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

  // 4. Fetch (or generate) the personalized 9-chapter story so the printed book
  //    reads identically to the /novel page.
  type PersonalChapter = { title: string; body: string };
  type PersonalStory = { chapterOne: PersonalChapter; chapters: PersonalChapter[] };
  const isValidStory = (ch: any): ch is PersonalStory =>
    !!ch &&
    ch.chapterOne &&
    typeof ch.chapterOne.title === "string" &&
    typeof ch.chapterOne.body === "string" &&
    Array.isArray(ch.chapters) &&
    ch.chapters.length === 8 &&
    ch.chapters.every(
      (c: any) => typeof c?.title === "string" && typeof c?.body === "string",
    );

  let personalStory: PersonalStory | null = null;
  const { data: existingStoryRow } = await supabase
    .from("personal_legacy_stories")
    .select("chapters")
    .eq("user_id", userId)
    .maybeSingle();

  if (existingStoryRow && isValidStory(existingStoryRow.chapters)) {
    personalStory = existingStoryRow.chapters as PersonalStory;
  } else {
    try {
      const genRes = await fetch(
        `${SUPABASE_URL}/functions/v1/generate-personal-story`,
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
      if (genRes.ok) {
        const genJson = await genRes.json();
        if (isValidStory(genJson?.chapters)) {
          personalStory = genJson.chapters as PersonalStory;
        } else {
          console.warn(
            "[assemble-legacy-payload] generate-personal-story returned invalid shape",
          );
        }
      } else {
        console.warn(
          "[assemble-legacy-payload] generate-personal-story failed",
          genRes.status,
          (await genRes.text()).slice(0, 300),
        );
      }
    } catch (e) {
      console.warn("[assemble-legacy-payload] generate-personal-story threw", e);
    }
  }

  // If we have a personalized story, override the shared fixture's story
  // chapters so the book renders the same Chapters I–IX as /novel.
  const mergedStory = personalStory
    ? {
        ...(shared?.story ?? {}),
        chapterOneTitle: personalStory.chapterOne.title,
        chapterOneBody: personalStory.chapterOne.body,
        teaserChapters: personalStory.chapters.map((c) => c.title),
        chapterBodies: personalStory.chapters.map((c) => c.body),
      }
    : shared?.story;

  // Also override the top-level `chapters` block — the book renderer checks
  // fixture.chapters.chapterBodies BEFORE story.chapterBodies. Without this
  // override the renderer falls back to the shared fixture's generic chapter
  // bodies (e.g. the Astrid/Danelaw Chapter IX text).
  const mergedChapters = personalStory
    ? {
        ...(shared?.chapters ?? {}),
        chapterBodies: personalStory.chapters.map((c) => c.body),
        chapters: personalStory.chapters.map((c) => ({
          title: c.title,
          body: c.body,
        })),
        expandedChapters: personalStory.chapters.map((c) => ({
          title: c.title,
          body: c.body,
        })),
      }
    : shared?.chapters;

  // Per-user motto override: the crest is the single source of truth for the
  // family motto. Look up this user's saved crest row and use its motto on the
  // novel cover, printed book, cover PDF, and certificate. Falls back to the
  // shared surname motto when the user hasn't forged a crest yet.
  let mergedFacts: any = shared?.facts ?? {};
  try {
    const { data: crestRow } = await supabase
      .from("crests")
      .select("motto_latin, motto_english")
      .eq("user_id", userId)
      .not("motto_latin", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (crestRow?.motto_latin) {
      mergedFacts = {
        ...mergedFacts,
        mottoLatin: crestRow.motto_latin,
        mottoEnglish: crestRow.motto_english ?? mergedFacts?.mottoEnglish ?? "",
      };
    }
  } catch (e) {
    console.warn("[assemble-legacy-payload] crest motto lookup failed", e);
  }

  const combined = {
    ...shared,
    facts: mergedFacts,
    story: mergedStory,
    chapters: mergedChapters,
    personal: {
      user_id: userId,
      tree,
      memories,
      memoriesProse,
      assembledAt: new Date().toISOString(),
      personalStoryUsed: !!personalStory,
    },
  };

  return json(200, { fixture: combined });
});

