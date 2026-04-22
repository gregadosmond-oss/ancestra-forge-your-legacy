import { createClient } from "npm:@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const CHAPTER_COUNT = 12;
const CHAPTER_WORD_TARGET = 1200;

type ChapterOutline = { num: number; title: string; synopsis: string };
type Chapter = ChapterOutline & { body: string };

async function callClaude(prompt: string, maxTokens: number): Promise<string> {
  const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": anthropicKey!,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-opus-4-5",
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`Claude error: ${await res.text()}`);
  const data = await res.json();
  return data.content?.[0]?.text ?? "";
}

function formatInterview(interviewAnswers: unknown): string {
  if (!Array.isArray(interviewAnswers)) return "";
  const filled = interviewAnswers.filter(
    (a: Record<string, unknown>) => typeof a?.answer === "string" && (a.answer as string).trim().length > 0
  );
  if (filled.length === 0) return "";
  const grouped: Record<string, string[]> = {};
  for (const a of filled) {
    const section = (a.sectionTitle as string) || "GENERAL";
    grouped[section] ??= [];
    grouped[section].push(`Q: ${a.question}\nA: ${a.answer}`);
  }
  return Object.entries(grouped)
    .map(([section, items]) => `## ${section}\n${items.join("\n\n")}`)
    .join("\n\n");
}

async function generateOutline(surname: string, country: string, research: string, interview: string): Promise<ChapterOutline[]> {
  const prompt = `You are crafting a 12-chapter family legacy novella for the ${surname} family from ${country}.

Below is historical research about the surname AND the user's personal family memories from a deep interview. Your task: design a 12-chapter book outline that weaves both into one cohesive multi-generational narrative.

The book should read like a literary family saga — warm, cinematic, intimate. Each chapter should focus on a specific era, ancestor, or theme. Where the user named real people (grandmothers, great-grandfathers, etc.), make them recurring characters. Where historical events are mentioned, ground them in time and place.

Return EXACTLY 12 chapters as a JSON array with this shape:
[
  { "num": 1, "title": "Chapter title", "synopsis": "1-2 sentence description of what this chapter covers" },
  ...
]

Suggested arc:
- Chapter 1: The name's origin (etymology, first known bearers, oldest era)
- Chapters 2-4: Early generations / the homeland / the work that shaped the family
- Chapters 5-7: Migration, war, upheaval — the turning points
- Chapters 8-10: The user's grandparents and parents — the people they remember or were told about
- Chapter 11: Patterns, values, what got passed down
- Chapter 12: The user as the next chapter — what they carry forward

HISTORICAL RESEARCH:
${research}

PERSONAL FAMILY MEMORIES:
${interview}

Return ONLY the JSON array. No prose before or after.`;

  const raw = await callClaude(prompt, 2500);
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
  const outline = JSON.parse(cleaned);
  if (!Array.isArray(outline) || outline.length !== CHAPTER_COUNT) {
    throw new Error(`Expected ${CHAPTER_COUNT} chapters, got ${Array.isArray(outline) ? outline.length : "non-array"}`);
  }
  return outline;
}

async function generateChapter(chapter: ChapterOutline, surname: string, country: string, research: string, interview: string, outline: ChapterOutline[]): Promise<Chapter> {
  const otherChapters = outline.filter((c) => c.num !== chapter.num).map((c) => `Chapter ${c.num}: ${c.title} — ${c.synopsis}`).join("\n");

  const prompt = `You are writing Chapter ${chapter.num} of a 12-chapter family legacy novella about the ${surname} family from ${country}.

THIS CHAPTER:
Title: ${chapter.title}
Focus: ${chapter.synopsis}

THE FULL BOOK OUTLINE (so you can reference what other chapters cover, but DO NOT duplicate them):
${otherChapters}

Write Chapter ${chapter.num} as approximately ${CHAPTER_WORD_TARGET} words of literary prose. Style:
- Warm, cinematic, intimate — like Annie Proulx or Ken Burns narrating a family
- Use names from the personal memories where they fit (grandmothers, great-grandfathers, etc.)
- Ground in specific time and place — give us seasons, weather, smells, sounds
- Use second person ("your great-grandfather") sparingly but powerfully where it deepens emotion
- No bullet points, no headers, no chapter number in the body — just flowing paragraphs
- Open with a vivid scene or image, not exposition
- Do not mention any celebrities or entertainment figures

HISTORICAL RESEARCH (use what's relevant to THIS chapter):
${research}

PERSONAL FAMILY MEMORIES (weave in details that fit THIS chapter's era or theme):
${interview}

Write the chapter body now. Just the prose — no title line, no metadata.`;

  const body = await callClaude(prompt, 4000);
  return { ...chapter, body: body.trim() };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { surname, country, userId, interviewAnswers } = await req.json();

    if (!surname || !userId) {
      return new Response(JSON.stringify({ error: "Missing surname or userId" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const originCountry = country || "unknown origin";

    const { data: existing } = await supabase
      .from("deep_legacy_results")
      .select("research_summary, sources")
      .eq("user_id", userId)
      .maybeSingle();

    const research = existing?.research_summary ?? "";
    const interview = formatInterview(interviewAnswers);

    if (!research && !interview) {
      return new Response(JSON.stringify({ error: "No research or interview data to build book from" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Generating outline for", surname);
    const outline = await generateOutline(surname, originCountry, research, interview);
    console.log("Outline generated:", outline.length, "chapters");

    console.log("Generating", outline.length, "chapters in parallel");
    const chapters = await Promise.all(
      outline.map((c) => generateChapter(c, surname, originCountry, research, interview, outline))
    );
    console.log("All chapters generated");

    const rows = chapters.map((c) => ({
      user_id: userId,
      surname: surname.trim().toLowerCase(),
      chapter_num: c.num,
      title: c.title,
      body: c.body,
    }));

    await supabase.from("deep_legacy_chapters").delete().eq("user_id", userId);
    const { error: insertErr } = await supabase.from("deep_legacy_chapters").insert(rows);
    if (insertErr) {
      console.error("Failed to save chapters:", insertErr);
      return new Response(JSON.stringify({ error: insertErr.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      surname,
      chapterCount: chapters.length,
      chapters: chapters.map((c) => ({ num: c.num, title: c.title })),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("deep-legacy-book error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
