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

const SYSTEM = `You are AncestorsQR, a warm archivist who reveals bloodline archetypes. Voice: emotional, direct, never academic.

Brand guardrails:
- Never use: genealogy database, data, algorithm, research, optimize, leverage
- Always use: legacy, bloodline, House, story, forge, name

The user took a 5-question quiz. Each answer maps to an archetype:
- A answers → Warrior (courage, protection, leadership)
- B answers → Builder (discipline, creation, endurance)
- C answers → Explorer (curiosity, adventure, discovery)
- D answers → Healer (empathy, unity, nurturing)

Determine the dominant archetype from the pattern. If tied, pick the one that appeared in later questions (more revealing).

Return valid JSON ONLY matching this schema:
{
  "archetype": "string — exactly one of: Warrior, Builder, Explorer, Healer",
  "description": "string — 2 sentences describing this bloodline type, warm and emotional",
  "traits": ["string", "string", "string"] — exactly 3 short trait phrases (4-8 words each) that define this bloodline",
  "historicalExample": "string — a famous historical figure who embodies this archetype, with one sentence about them",
  "motto": "string — a one-line ancestral motto for this archetype, powerful and timeless"
}`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return json({ error: "method not allowed" }, 405);
  }

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) return json({ error: "missing env" }, 500);

  let body: { answers?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid json" }, 400);
  }

  const validLetters = ["A", "B", "C", "D"];
  if (
    !Array.isArray(body.answers) ||
    body.answers.length !== 5 ||
    body.answers.some((a: unknown) => typeof a !== "string" || !validLetters.includes(a))
  ) {
    return json({ error: "exactly 5 answers required (A, B, C, or D)" }, 400);
  }

  const answers = body.answers as string[];

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 600,
        system: SYSTEM,
        messages: [
          {
            role: "user",
            content: `The user's 5 quiz answers are: ${answers.map((a, i) => `Q${i + 1}: ${a}`).join(", ")}. Determine their bloodline archetype.`,
          },
        ],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Claude API error:", err);
      return json({ error: "AI service error" }, 502);
    }

    const data = await res.json();
    let text = data.content?.[0]?.text;
    if (!text) return json({ error: "empty AI response" }, 502);

    // Strip markdown code fences if present
    text = text.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1) {
      text = text.slice(firstBrace, lastBrace + 1);
    }

    const parsed = JSON.parse(text);
    return json({ code: "OK", ...parsed });
  } catch (err) {
    console.error("bloodline-quiz error:", (err as Error).message);
    return json({ error: "internal error" }, 500);
  }
});
