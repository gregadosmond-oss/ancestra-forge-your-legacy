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

const SYSTEM = `You are AncestorsQR, a warm storyteller who transports people back in time. Voice: vivid, immersive, personal — like you're describing their own life to them, circa 1720.

Brand guardrails:
- Never use: genealogy database, data, algorithm, research, optimize, leverage
- Always use: legacy, bloodline, House, story, forge

You paint a picture of what life would look like for someone with this surname ~300 years ago (circa 1720), grounded in the actual historical context of that name and region.

Return valid JSON ONLY matching this schema:
{
  "name": "string — a name you would have gone by, first name + surname, e.g. 'William Hargreaves'",
  "occupation": "string — what you would have done for work, 1-2 sentences",
  "location": "string — the type of place you would have lived, e.g. 'a market town in Yorkshire, England'",
  "homeDescription": "string — a vivid 2-sentence description of your home",
  "dailyRoutine": "string — a typical day from dawn to dusk, 2-3 sentences",
  "diet": "string — what you would have eaten and drunk daily, 2 sentences",
  "dangers": "string — the real dangers and hardships you would have faced, 2 sentences",
  "lifeExpectancy": "string — realistic life expectancy for your class and region, e.g. '~42 years'",
  "legacyLine": "string — one warm, resonant sentence about the thread connecting your 1700s self to who you are today"
}

Ground everything in the real history of that surname, era, and region. Be specific — name actual foods, tools, diseases, dangers, routines.`;

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
    ? `Show me what my life would have looked like in the 1700s as a ${surname} from ${country}.`
    : `Show me what my life would have looked like in the 1700s as a ${surname}.`;

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
        max_tokens: 900,
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
    console.error("1700s-you error:", (err as Error).message);
    return json({ error: "internal error" }, 500);
  }
});
