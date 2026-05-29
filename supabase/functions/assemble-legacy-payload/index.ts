import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  let surname = "";
  let userId = "";
  try {
    const body = await req.json().catch(() => ({}));
    if (body && typeof body.surname === "string") surname = body.surname.trim();
    if (body && typeof body.user_id === "string") userId = body.user_id.trim();
  } catch (_) {
    // ignore
  }

  if (!surname) return json(400, { error: "surname required" });
  if (!userId) return json(400, { error: "user_id required" });

  // 1. Fetch shared surname fixture via existing get-legacy-fixture
  const getRes = await fetch(`${SUPABASE_URL}/functions/v1/get-legacy-fixture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      apikey: SERVICE_ROLE_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ surname }),
  });
  const getText = await getRes.text();
  if (!getRes.ok) {
    return json(getRes.status, {
      error: "get_fixture_failed",
      detail: getText.slice(0, 500),
    });
  }
  let shared: any;
  try {
    const parsed = JSON.parse(getText);
    shared = parsed?.fixture ?? parsed;
  } catch (err) {
    return json(500, { error: "invalid_fixture_json", detail: (err as Error).message });
  }

  // 2. Fetch personal tree + memories (service role bypasses RLS, scoped by user_id)
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const [treeRes, memRes] = await Promise.all([
    supabase
      .from("family_tree_members")
      .select(
        "id,name,birth_date,birth_place,death_date,death_place,father_name,mother_name,profile_url,summary,confidence,source,position",
      )
      .eq("user_id", userId)
      .order("position", { ascending: true }),
    supabase
      .from("family_memories")
      .select("id,relative_name,relationship,answers,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: true }),
  ]);

  if (treeRes.error) {
    return json(500, { error: "tree_query_failed", detail: treeRes.error.message });
  }
  if (memRes.error) {
    return json(500, { error: "memories_query_failed", detail: memRes.error.message });
  }

  // Sort tree by birth year (oldest → youngest), tie-break on position
  const tree = (treeRes.data ?? []).slice().sort((a: any, b: any) => {
    const ay = parseInt(String(a.birth_date ?? "").slice(0, 4), 10);
    const by = parseInt(String(b.birth_date ?? "").slice(0, 4), 10);
    const aNum = Number.isNaN(ay) ? 9999 : ay;
    const bNum = Number.isNaN(by) ? 9999 : by;
    if (aNum !== bNum) return aNum - bNum;
    return (a.position ?? 0) - (b.position ?? 0);
  });

  // 3. Refresh / fetch the AI-woven memories chapter (cached, regenerates only when memories changed)
  let memoriesProse: string | null = null;
  const memories = memRes.data ?? [];
  if (memories.length > 0) {
    try {
      const weaveRes = await fetch(
        `${SUPABASE_URL}/functions/v1/weave-memories-chapter`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
            apikey: SERVICE_ROLE_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ user_id: userId }),
        },
      );
      if (weaveRes.ok) {
        const weaveJson = await weaveRes.json();
        if (typeof weaveJson?.prose === "string") {
          memoriesProse = weaveJson.prose;
        }
      } else {
        console.warn(
          "[assemble-legacy-payload] weave-memories-chapter failed",
          weaveRes.status,
        );
      }
    } catch (e) {
      console.warn("[assemble-legacy-payload] weave invoke threw", e);
    }
  }

  const combined = {
    ...shared,
    personal: {
      user_id: userId,
      tree,
      memories,
      memoriesProse,
      assembledAt: new Date().toISOString(),
    },
  };

  return json(200, { fixture: combined });
});

