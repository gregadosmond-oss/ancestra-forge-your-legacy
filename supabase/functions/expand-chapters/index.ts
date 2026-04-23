import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { callClaudeJson } from "./claude.ts";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const CHAPTER_MODEL = "claude-sonnet-4-5-20250929";
const TARGET_MIN_WORDS = 700;
const TARGET_MAX_WORDS = 850;
const RETRY_MIN_WORDS = 500;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "content-type": "application/json" },
  });
}

function wordCount(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

const CHAPTER_SYSTEM = `You are AncestorsQR. You write cinematic chapter bodies for a family legacy story.

You write ONE chapter at a time. The chapter MUST be between ${TARGET_MIN_WORDS} and ${TARGET_MAX_WORDS} words — this is a hard floor, not a suggestion. Shorter than ${TARGET_MIN_WORDS} words is rejected and rewritten.

Each chapter is cinematic, sensory prose in third person, set in the ancestral period. Every chapter must contain: three to four distinct paragraphs (not one block), sensory detail woven throughout (smells, weather, light, fabric, sound, texture), at least one line of dialogue or italicized inner voice, historical grounding consistent with the time period and region, and continuity that picks up from the previous chapter's ending.

Return valid JSON ONLY:

{
  "chapterBody": "string — between ${TARGET_MIN_WORDS} and ${TARGET_MAX_WORDS} words for this ONE chapter, multiple paragraphs separated by \\n\\n, one extended scene with sensory detail, dialogue or inner voice, and historical grounding"
}

Constraints:
- Return exactly one chapterBody for the title provided in the user prompt
- Never use: genealogy database, data, algorithm, research, corporate language
- Always use: legacy, bloodline, House, story, forge, name, duty, inheritance
- NEVER use markdown formatting — plain prose with \\n\\n between paragraphs only
- Minimum ${TARGET_MIN_WORDS} words. Maximum ${TARGET_MAX_WORDS} words. Count your words before returning.`;

async function writeOneChapter(
  apiKey: string,
  surname: string,
  chapterOneTitle: string,
  chapterOneBody: string,
  allTitles: string[],
  currentIndex: number,
  previousEnding: string | null,
): Promise<string> {
  const currentTitle = allTitles[currentIndex];
  const chapterNumber = currentIndex + 2;

  const continuityBlock = previousEnding
    ? `The previous chapter (Chapter ${chapterNumber - 1}) ended with:
"${previousEnding.slice(-600)}"

Pick up continuity from that ending.`
    : `The story so far — Chapter 1 "${chapterOneTitle}":
"${chapterOneBody}"

Pick up continuity from Chapter 1's ending.`;

  const userPrompt = `Family surname: "${surname}"

Full chapter outline:
1. ${chapterOneTitle} (already written)
${allTitles.map((t, i) => `${i + 2}. ${t}${i === currentIndex ? "  ← WRITE THIS CHAPTER" : ""}`).join("\n")}

${continuityBlock}

Write Chapter ${chapterNumber}: "${currentTitle}"

Requirements (strict):
- Between ${TARGET_MIN_WORDS} and ${TARGET_MAX_WORDS} words — count them before returning
- Three to four distinct paragraphs separated by \\n\\n
- Sensory detail woven throughout (smells, weather, light, fabric, sound, texture)
- At least one line of dialogue or italicized inner voice
- Historically grounded for the period and region
- Picks up continuity from the previous chapter

Return ONLY the JSON: { "chapterBody": "..." }`;

  let result = await callClaudeJson<{ chapterBody: string }>({
    apiKey,
    system: CHAPTER_SYSTEM,
    user: userPrompt,
    model: CHAPTER_MODEL,
    maxTokens: 4096,
  });

  let body = result?.chapterBody ?? "";
  let count = wordCount(body);

  if (count < RETRY_MIN_WORDS) {
    console.warn(`expand-chapters chapter ${chapterNumber} too short (${count} words), retrying...`);
    const retryPrompt = `${userPrompt}

IMPORTANT: Your previous attempt returned ${count} words, which is too short. Write this chapter in ${TARGET_MIN_WORDS}-${TARGET_MAX_WORDS} words. Expand every paragraph with more sensory detail, more dialogue, more historical texture. Count your words before returning.`;

    result = await callClaudeJson<{ chapterBody: string }>({
      apiKey,
      system: CHAPTER_SYSTEM,
      user: retryPrompt,
      model: CHAPTER_MODEL,
      maxTokens: 4096,
    });
    body = result?.chapterBody ?? body;
    count = wordCount(body);
    console.log(`expand-chapters chapter ${chapterNumber} retry produced ${count} words`);
  }

  if (!body) throw new Error(`chapter ${chapterNumber} returned empty body`);
  return body;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS_HEADERS });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!apiKey || !supabaseUrl || !supabaseKey) return json({ error: "missing env" }, 500);

  let body: { surname?: unknown; forceRegenerate?: unknown };
  try { body = await req.json(); } catch { return json({ error: "invalid json" }, 400); }
  if (typeof body.surname !== "string" || !body.surname.trim()) return json({ error: "surname required" }, 400);

  const surname = body.surname.trim().toLowerCase();
  const forceRegenerate = body.forceRegenerate === true;
  const client = createClient(supabaseUrl, supabaseKey);

  const { data: row, error: readErr } = await client
    .from("surname_facts").select("story_payload").eq("surname", surname).maybeSingle();
  if (readErr) return json({ error: readErr.message }, 500);
  if (!row?.story_payload) return json({ error: "no story found for this surname" }, 404);

  const story = row.story_payload as {
    chapterOneTitle: string; chapterOneBody: string;
    teaserChapters: string[]; chapterBodies?: string[];
  };

  if (!forceRegenerate && story.chapterBodies && story.chapterBodies.length > 0) {
    return json({ code: "OK", chapterBodies: story.chapterBodies });
  }
  if (!story.teaserChapters || story.teaserChapters.length < 1) {
    return json({ error: "story teaserChapters missing" }, 422);
  }

  const titles = story.teaserChapters;
  const chapterBodies: string[] = [];
  let previousEnding: string | null = null;

  for (let i = 0; i < titles.length; i++) {
    try {
      const chapterBody = await writeOneChapter(
        apiKey, surname, story.chapterOneTitle, story.chapterOneBody,
        titles, i, previousEnding,
      );
      chapterBodies.push(chapterBody);
      previousEnding = chapterBody;
      console.log(`expand-chapters wrote chapter ${i + 2}: ${wordCount(chapterBody)} words`);
    } catch (err) {
      console.error(`expand-chapters chapter ${i + 2} error`, err);
      return json({
        error: `chapter ${i + 2} generation failed: ${(err as Error).message}`,
        completedChapters: chapterBodies.length,
      }, 500);
    }
  }

  const updatedStory = { ...story, chapterBodies };
  const { error: writeErr } = await client
    .from("surname_facts").update({ story_payload: updatedStory }).eq("surname", surname);
  if (writeErr) console.error("expand-chapters write error", writeErr);

  return json({ code: "OK", chapterBodies });
});
