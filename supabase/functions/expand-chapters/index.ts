import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { callClaudeJson } from "./claude.ts";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "content-type": "application/json" },
  });
}

const EXPAND_SYSTEM = `You are AncestorsQR. You are given chapter titles for a family legacy story and must write the body text for each chapter. Each chapter is cinematic, sensory prose in third person, set in the ancestral period. ~150 words per chapter.

Return valid JSON ONLY:

{
  "chapterBodies": [
    "string — ~150 words for the chapter, one vivid scene, no exposition dumps"
  ]
}

Constraints:
- Return one chapterBody per title provided in the user prompt, in the same order
- Each body is a standalone scene from a different moment in the family's history
- Never use: genealogy database, data, algorithm, research
- Always use: legacy, bloodline, House, story, forge, name
- NEVER use markdown formatting — plain prose only.`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return json({ error: "method not allowed" }, 405);
  }

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!apiKey || !supabaseUrl || !supabaseKey) {
    return json({ error: "missing env" }, 500);
  }

  let body: { surname?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid json" }, 400);
  }
  if (typeof body.surname !== "string" || !body.surname.trim()) {
    return json({ error: "surname required" }, 400);
  }

  const surname = body.surname.trim().toLowerCase();
  const client = createClient(supabaseUrl, supabaseKey);

  // Read existing story from cache
  const { data: row, error: readErr } = await client
    .from("surname_facts")
    .select("story_payload")
    .eq("surname", surname)
    .maybeSingle();

  if (readErr) return json({ error: readErr.message }, 500);
  if (!row?.story_payload) return json({ error: "no story found for this surname" }, 404);

  const story = row.story_payload as {
    chapterOneTitle: string;
    chapterOneBody: string;
    teaserChapters: string[];
    chapterBodies?: string[];
  };

  // Already expanded — return cached
  if (story.chapterBodies && story.chapterBodies.length > 0) {
    return json({ code: "OK", chapterBodies: story.chapterBodies });
  }

  if (!story.teaserChapters || story.teaserChapters.length < 1) {
    return json({ error: "story teaserChapters missing" }, 422);
  }

  const expectedCount = story.teaserChapters.length;

  // Generate chapter bodies
  const userPrompt = `Family surname: "${surname}"
Chapter 1 (already written): "${story.chapterOneTitle}"
Chapters to write bodies for:
${story.teaserChapters.map((t, i) => `${i + 2}. ${t}`).join("\n")}

Write ~150 words of cinematic prose for each of these ${expectedCount} chapters. Return exactly ${expectedCount} entries in chapterBodies, one per chapter title above, in the same order.`;

  let chapterBodies: string[];
  try {
    const result = await callClaudeJson<{ chapterBodies: string[] }>({
      apiKey,
      system: EXPAND_SYSTEM,
      user: userPrompt,
      maxTokens: 8000,
    });
    chapterBodies = result.chapterBodies;
  } catch (err) {
    console.error("expand-chapters claude error", err);
    return json({ error: (err as Error).message }, 500);
  }

  if (!Array.isArray(chapterBodies) || chapterBodies.length === 0) {
    console.error("expand-chapters bad shape", { received: chapterBodies?.length, expected: expectedCount });
    return json({ error: "unexpected response shape from Claude" }, 500);
  }

  // If Claude returned fewer than expected, pad; if more, truncate
  if (chapterBodies.length < expectedCount) {
    console.warn(`expand-chapters got ${chapterBodies.length}, expected ${expectedCount}`);
  }
  chapterBodies = chapterBodies.slice(0, expectedCount);

  // Save back to story_payload
  const updatedStory = { ...story, chapterBodies };
  const { error: writeErr } = await client
    .from("surname_facts")
    .update({ story_payload: updatedStory })
    .eq("surname", surname);

  if (writeErr) {
    console.error("expand-chapters write error", writeErr);
    // Non-fatal — return the data even if we couldn't cache it
  }

  return json({ code: "OK", chapterBodies });
});
