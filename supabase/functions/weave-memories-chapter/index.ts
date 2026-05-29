import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
const MODEL = "claude-3-5-sonnet-20241022";

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

function buildSignature(memories: any[]): string {
  // count + most-recent created_at — changes whenever memories are added/edited
  const count = memories.length;
  const latest = memories.reduce((acc, m) => {
    const t = m.created_at ? new Date(m.created_at).getTime() : 0;
    return t > acc ? t : acc;
  }, 0);
  return `${count}:${latest}`;
}

function memoriesToPromptBlock(memories: any[]): string {
  return memories
    .map((m, i) => {
      const answers =
        m.answers && typeof m.answers === "object" ? m.answers : {};
      const pairs = Object.entries(answers as Record<string, unknown>)
        .filter(([, v]) => v != null && String(v).trim().length > 0)
        .map(([q, a]) => `  - ${q}: ${String(a).trim()}`)
        .join("\n");
      return `Relative ${i + 1}: ${m.relative_name ?? "(unnamed)"} (${
        m.relationship ?? "—"
      })\n${pairs || "  (no answers)"}`;
    })
    .join("\n\n");
}

async function callClaude(memories: any[], surname: string): Promise<string> {
  const memoryBlock = memoriesToPromptBlock(memories);

  const systemPrompt = `You are the literary author of "The House of ${surname}" — a warm, lyrical family legacy book.
Your voice is the voice of the existing chapters: measured, literary, emotionally grounded, in the register of Robert Macfarlane or Marilynne Robinson. Warm, never sentimental. Specific, never generic.

You will be given raw memory notes that a person collected about their own relatives (a parent, grandparent, aunt, etc.). Your task is to weave those notes into a single flowing prose chapter titled "In Their Words" that honours each relative in turn.

RULES — absolute, non-negotiable:
- Use ONLY the facts present in the notes. Do not invent names, places, dates, occupations, or events.
- If a field is blank, simply omit it — never speculate.
- Write in third-person, present-or-past tense as appropriate, in continuous paragraphs (NOT as a Q&A list).
- Give each relative their own short section (2-4 paragraphs). Begin each section with the relative's name as a heading on its own line preceded by "## " (markdown H2). Underneath, in italics on its own line preceded by "_", write their relationship to the storyteller (e.g. "_Grandmother_").
- Do not include any preamble, framing, "here is the chapter", or closing remarks. Output only the chapter body.
- Length: aim for ~150-280 words per relative section.
- Honour the warm, literary tone of a legacy book. Avoid clichés ("salt of the earth", "a life well lived"). Avoid lists. Avoid em-dashes everywhere — use them sparingly.`;

  const userPrompt = `Surname: ${surname}\n\nRaw memory notes:\n\n${memoryBlock}\n\nWeave these into the "In Their Words" chapter now.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Claude error ${res.status}: ${t.slice(0, 500)}`);
  }
  const data = await res.json();
  const text = data?.content?.[0]?.text;
  if (!text || typeof text !== "string") {
    throw new Error("Claude returned no text");
  }
  return text.trim();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  let userId = "";
  let force = false;
  try {
    const body = await req.json().catch(() => ({}));
    if (body && typeof body.user_id === "string") userId = body.user_id.trim();
    if (body && body.force === true) force = true;
  } catch (_) {}

  if (!userId) return json(400, { error: "user_id required" });

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // Load memories
  const { data: memories, error: memErr } = await supabase
    .from("family_memories")
    .select("id,relative_name,relationship,answers,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (memErr) return json(500, { error: "memories_query_failed", detail: memErr.message });
  if (!memories || memories.length === 0) {
    // Clean any stale cache so frontend falls back gracefully
    await supabase.from("family_memory_chapters").delete().eq("user_id", userId);
    return json(200, { prose: null, signature: null, cached: false, empty: true });
  }

  const signature = buildSignature(memories);

  // Check cache
  if (!force) {
    const { data: cached } = await supabase
      .from("family_memory_chapters")
      .select("prose,signature")
      .eq("user_id", userId)
      .maybeSingle();
    if (cached && cached.signature === signature) {
      return json(200, { prose: cached.prose, signature, cached: true });
    }
  }

  // Resolve surname for tone
  const { data: profile } = await supabase
    .from("profiles")
    .select("surname")
    .eq("id", userId)
    .maybeSingle();
  const surname = (profile?.surname ?? "Family").trim() || "Family";
  const displaySurname =
    surname.charAt(0).toUpperCase() + surname.slice(1).toLowerCase();

  // Generate
  let prose: string;
  try {
    prose = await callClaude(memories, displaySurname);
  } catch (e) {
    console.error("[weave-memories-chapter]", e);
    return json(500, { error: "claude_failed", detail: (e as Error).message });
  }

  // Upsert
  const { error: upErr } = await supabase
    .from("family_memory_chapters")
    .upsert(
      {
        user_id: userId,
        prose,
        signature,
        model: MODEL,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
  if (upErr) {
    console.error("[weave-memories-chapter] upsert failed", upErr);
  }

  return json(200, { prose, signature, cached: false });
});
