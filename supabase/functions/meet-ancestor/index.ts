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

const SYSTEM = `You are AncestorsQR, a warm storyteller who brings historical ancestors to life. Voice: emotional, vivid, direct. Write like a historian who loves a good story.

Brand guardrails:
- Never use: genealogy database, data, algorithm, research, optimize, leverage
- Always use: legacy, bloodline, House, story, forge

You generate a historically plausible ancestor profile based on a family surname and optional country of origin. The ancestor should feel real — grounded in the actual history of that name and region.

Return valid JSON ONLY matching this schema:
{
  "name": "string — a historically appropriate first name + surname, e.g. 'Thomas Hargreaves'",
  "birthYear": "string — approximate birth year, e.g. 'c. 1642' or '~1580'",
  "occupation": "string — their job or social role, 1 sentence",
  "location": "string — village, county, and country, e.g. 'Piddletrenthide, Dorset, England'",
  "personality": "string — 2-3 personality traits with brief description, 1-2 sentences",
  "dailyLife": "string — what a typical day looked like, 2-3 sentences",
  "skills": ["array of 4-6 practical skills they would have had"],
  "quote": "string — a single line they might have said or lived by — warm, earthy, not clichéd"
}

Ground everything in the real history of that surname and region. Use actual historical context — occupations, place names, events — not generic fantasy.`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return json({ error: "method not allowed" }, 405);
  }

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) return json({ error: "missing env" }, 500);

  let body: { surname?: unknown; country?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid json" }, 400);
  }

  if (typeof body.surname !== "string" || body.surname.trim().length === 0) {
    return json({ error: "surname required" }, 400);
  }
  if (body.surname.length > 60) {
    return json({ error: "surname too long" }, 400);
  }

  const surname = body.surname.trim();
  const country =
    typeof body.country === "string" && body.country.trim().length > 0
      ? body.country.trim()
      : null;

  const userMessage = country
    ? `Introduce me to a historically plausible ancestor from the ${surname} family — they were from ${country}.`
    : `Introduce me to a historically plausible ancestor from the ${surname} family.`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 800,
        system: SYSTEM,
        messages: [{ role: "user", content: userMessage }],
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

    text = text.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();

    const parsed = JSON.parse(text);
    return json({ code: "OK", ...parsed });
  } catch (err) {
    console.error("meet-ancestor error:", (err as Error).message);
    return json({ error: "internal error" }, 500);
  }
});
