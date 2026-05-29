import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
const MODEL = "claude-sonnet-4-5-20250929";

// Target ~3 print pages per chapter ≈ 900 words.
const WORDS_PER_CHAPTER_MIN = 750;
const WORDS_PER_CHAPTER_MAX = 950;

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function safeStr(v: unknown): string {
  return v == null ? "" : String(v).trim();
}

function treeBlock(tree: any[]): string {
  if (!tree.length) return "(No named ancestors provided.)";
  return tree
    .map((m, i) => {
      const parts = [
        `Ancestor ${i + 1}: ${safeStr(m.name) || "(unnamed)"}`,
        m.birth_date || m.birth_place
          ? `  born ${safeStr(m.birth_date) || "?"} ${
              m.birth_place ? `in ${safeStr(m.birth_place)}` : ""
            }`.trim()
          : "",
        m.death_date || m.death_place
          ? `  died ${safeStr(m.death_date) || "?"} ${
              m.death_place ? `in ${safeStr(m.death_place)}` : ""
            }`.trim()
          : "",
        m.father_name ? `  father: ${safeStr(m.father_name)}` : "",
        m.mother_name ? `  mother: ${safeStr(m.mother_name)}` : "",
        m.summary ? `  notes: ${safeStr(m.summary)}` : "",
      ].filter(Boolean);
      return parts.join("\n");
    })
    .join("\n\n");
}

function memoriesBlock(memories: any[]): string {
  if (!memories.length) return "(No living-memory contributions yet.)";
  return memories
    .map((m, i) => {
      const a = m.answers && typeof m.answers === "object" ? m.answers : {};
      const pairs = Object.entries(a as Record<string, unknown>)
        .filter(([, v]) => v != null && String(v).trim().length > 0)
        .map(([q, v]) => `  - ${q}: ${String(v).trim()}`)
        .join("\n");
      return `Relative ${i + 1}: ${safeStr(m.relative_name) || "(unnamed)"} (${
        safeStr(m.relationship) || "—"
      })\n${pairs || "  (no answers)"}`;
    })
    .join("\n\n");
}

function factsBlock(facts: any): string {
  if (!facts) return "(No surname scaffolding available.)";
  const lines: string[] = [];
  if (facts.meaning) {
    lines.push(
      `Origin: ${safeStr(facts.meaning.origin)} — ${safeStr(facts.meaning.etymology)}`,
    );
    if (facts.meaning.historicalContext)
      lines.push(`Historical context: ${safeStr(facts.meaning.historicalContext)}`);
    if (facts.meaning.role) lines.push(`Ancestral role: ${safeStr(facts.meaning.role)}`);
  }
  if (facts.mottoLatin) lines.push(`Motto (Latin): ${safeStr(facts.mottoLatin)}`);
  if (facts.mottoEnglish) lines.push(`Motto (English): ${safeStr(facts.mottoEnglish)}`);
  const wp = facts.migration?.waypoints;
  if (Array.isArray(wp) && wp.length) {
    lines.push("Migration waypoints (oldest first):");
    wp.forEach((w: any) =>
      lines.push(
        `  - ${safeStr(w.century)}: ${safeStr(w.region)} (${safeStr(w.role)})`,
      ),
    );
  }
  return lines.join("\n") || "(empty)";
}

type Chapter = { title: string; body: string };
type StoryOut = { chapterOne: Chapter; chapters: Chapter[] };

async function callClaude(params: {
  surname: string;
  facts: any;
  tree: any[];
  memories: any[];
}): Promise<StoryOut> {
  const { surname, facts, tree, memories } = params;
  const hasTree = tree.length > 0;
  const hasMemories = memories.length > 0;

  const system = `You are the literary author of "The House of ${surname}" — a warm, lyrical 9-chapter family legacy book.
Your voice is measured, literary, emotionally grounded, in the register of Robert Macfarlane or Marilynne Robinson. Warm, never sentimental. Specific, never generic.

You will be given:
  (a) Shared historical scaffolding about the surname (origin, migration waypoints, motto).
  (b) A list of NAMED ANCESTORS the reader has actually documented (with real dates and places where known).
  (c) A list of LIVING-MEMORY notes about recent relatives.

Your task is to write a 9-chapter family legacy that WEAVES (b) and (c) into the historical arc of (a).

ABSOLUTE RULES — non-negotiable:
- Use ONLY the named individuals, dates, and places present in the provided data. Do not invent ancestors, dates, places, occupations, or events about real people.
- Connective tissue is allowed: sensory atmosphere, weather, the sound of a place, the texture of a craft, the rhythm of a century. New factual claims about specific real people are not.
- Place each named ancestor into the chapter that fits their century chronologically. If two ancestors share a century, both belong in that chapter.
- ${hasTree ? "You MUST reference the named ancestors by name at least once each across the chapters where they chronologically fit." : "If no named ancestors are provided, write the chapters around the shared historical scaffolding only — do not invent named people."}
- ${hasMemories ? "Chapter IX must reference the living-memory relatives by name, drawing only on the notes given." : "If no living memories are provided, Chapter IX should close the arc on the present generation in general terms."}
- Each chapter must be ${WORDS_PER_CHAPTER_MIN}–${WORDS_PER_CHAPTER_MAX} words. This is a hard constraint — the book has a fixed page budget.
- Avoid clichés ("salt of the earth", "a life well lived"). Avoid bullet lists. Use em-dashes sparingly.

OUTPUT FORMAT — strict JSON only, no prose outside the JSON, no markdown fences:
{
  "chapterOne": { "title": "string", "body": "string" },
  "chapters": [
    { "title": "string", "body": "string" },
    { "title": "string", "body": "string" },
    { "title": "string", "body": "string" },
    { "title": "string", "body": "string" },
    { "title": "string", "body": "string" },
    { "title": "string", "body": "string" },
    { "title": "string", "body": "string" },
    { "title": "string", "body": "string" }
  ]
}
chapterOne is Chapter I. The chapters array is chapters II–IX in order. Total 9 chapters.`;

  const user = `Surname: ${surname}

SHARED HISTORICAL SCAFFOLDING:
${factsBlock(facts)}

NAMED ANCESTORS (from the reader's family tree):
${treeBlock(tree)}

LIVING-MEMORY NOTES (for Chapter IX):
${memoriesBlock(memories)}

Write the 9-chapter legacy now. Output JSON only.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 16000,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Claude error ${res.status}: ${t.slice(0, 600)}`);
  }
  const data = await res.json();
  const text: string = data?.content?.[0]?.text ?? "";
  if (!text) throw new Error("Claude returned empty text");

  // Strip any accidental fencing.
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();

  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    throw new Error(`Claude returned non-JSON: ${(e as Error).message}`);
  }

  const chapterOne = parsed?.chapterOne;
  const chapters = parsed?.chapters;
  if (
    !chapterOne ||
    typeof chapterOne.title !== "string" ||
    typeof chapterOne.body !== "string" ||
    !Array.isArray(chapters) ||
    chapters.length !== 8 ||
    chapters.some(
      (c: any) => typeof c?.title !== "string" || typeof c?.body !== "string",
    )
  ) {
    throw new Error("Claude JSON shape invalid");
  }
  return { chapterOne, chapters } as StoryOut;
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

  if (!ANTHROPIC_API_KEY) return json(500, { error: "missing ANTHROPIC_API_KEY" });

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // Load profile (surname), tree, memories, shared surname facts.
  const { data: profile, error: profErr } = await supabase
    .from("profiles")
    .select("surname")
    .eq("id", userId)
    .maybeSingle();
  if (profErr) return json(500, { error: "profile_query_failed", detail: profErr.message });

  const rawSurname = (profile?.surname ?? "").trim();
  if (!rawSurname) return json(400, { error: "no_surname" });
  const normSurname = rawSurname.toLowerCase();
  const displaySurname =
    rawSurname.charAt(0).toUpperCase() + rawSurname.slice(1).toLowerCase();

  const [treeRes, memRes, factsRes] = await Promise.all([
    supabase
      .from("family_tree_members")
      .select(
        "id,name,birth_date,birth_place,death_date,death_place,father_name,mother_name,summary,position,created_at",
      )
      .eq("user_id", userId)
      .order("position", { ascending: true }),
    supabase
      .from("family_memories")
      .select("id,relative_name,relationship,answers,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: true }),
    supabase
      .from("surname_facts")
      .select("payload")
      .eq("surname", normSurname)
      .maybeSingle(),
  ]);

  if (treeRes.error)
    return json(500, { error: "tree_query_failed", detail: treeRes.error.message });
  if (memRes.error)
    return json(500, { error: "memories_query_failed", detail: memRes.error.message });

  const tree = treeRes.data ?? [];
  const memories = memRes.data ?? [];
  const facts = (factsRes.data?.payload as any) ?? null;

  // Build signature from the inputs that should invalidate the cache.
  const sigInput = JSON.stringify({
    surname: normSurname,
    model: MODEL,
    tree: tree.map((m: any) => ({
      id: m.id,
      name: m.name,
      bd: m.birth_date,
      bp: m.birth_place,
      dd: m.death_date,
      dp: m.death_place,
      f: m.father_name,
      mo: m.mother_name,
      s: m.summary,
    })),
    memories: memories.map((m: any) => ({
      id: m.id,
      r: m.relative_name,
      rel: m.relationship,
      a: m.answers,
    })),
  });
  const signature = await sha256Hex(sigInput);

  console.log(
    `[generate-personal-story] user=${userId} surname=${normSurname} tree=${tree.length} memories=${memories.length} sig=${signature.slice(0, 8)} force=${force}`,
  );

  // Cache check
  if (!force) {
    const { data: cached } = await supabase
      .from("personal_legacy_stories")
      .select("signature,chapters,model,updated_at")
      .eq("user_id", userId)
      .maybeSingle();
    if (cached && cached.signature === signature) {
      console.log(`[generate-personal-story] cache hit user=${userId}`);
      return json(200, {
        chapters: cached.chapters,
        signature,
        cached: true,
        model: cached.model,
      });
    }
  }

  // Generate
  let story: StoryOut;
  try {
    story = await callClaude({ surname: displaySurname, facts, tree, memories });
    const wc = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
    const totals = [story.chapterOne, ...story.chapters].map((c) => wc(c.body));
    console.log(
      `[generate-personal-story] Claude success user=${userId} word_counts=${totals.join(",")}`,
    );
  } catch (e) {
    console.error("[generate-personal-story] claude failed", e);
    return json(500, { error: "claude_failed", detail: (e as Error).message });
  }

  const chaptersPayload = { chapterOne: story.chapterOne, chapters: story.chapters };

  const { error: upErr } = await supabase.from("personal_legacy_stories").upsert(
    {
      user_id: userId,
      signature,
      chapters: chaptersPayload,
      model: MODEL,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (upErr) console.error("[generate-personal-story] upsert failed", upErr);

  return json(200, {
    chapters: chaptersPayload,
    signature,
    cached: false,
    model: MODEL,
  });
});
