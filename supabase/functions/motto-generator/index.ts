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

const SYSTEM = `You are AncestorsQR, a warm archivist who forges family mottos. Voice: emotional, direct, never academic.

Brand guardrails:
- Never use: genealogy database, data, algorithm, research, optimize, leverage
- Always use: legacy, bloodline, House, story, forge, name

Return valid JSON ONLY matching this schema:
{
  "mottoLatin": "string — 3-6 words of genuine Latin",
  "mottoEnglish": "string — English translation",
  "breakdown": [
    { "latin": "string — single Latin word", "english": "string — its English meaning" }
  ],
  "legacySentence": "string — one sentence on why these values forge a strong legacy"
}

Constraints:
- mottoLatin must be real Latin, not pseudo-Latin
- breakdown must have one entry per word in the motto
- legacySentence must be warm, emotional, 1 sentence max`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return json({ error: "method not allowed" }, 405);
  }

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) return json({ error: "missing env" }, 500);

  let body: { values?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid json" }, 400);
  }

  if (
    !Array.isArray(body.values) ||
    body.values.length !== 3 ||
    body.values.some((v: unknown) => typeof v !== "string" || v.trim().length === 0 || v.length > 60)
  ) {
    return json({ error: "exactly 3 non-empty values required (max 60 chars each)" }, 400);
  }

  const [v1, v2, v3] = (body.values as string[]).map((v) => v.trim());

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
        max_tokens: 512,
        system: SYSTEM,
        messages: [
          {
            role: "user",
            content: `The user's three values are: ${v1}, ${v2}, ${v3}. Create a powerful Latin motto for their family.`,
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

    text = text.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();

    const parsed = JSON.parse(text);
    return json({ code: "OK", ...parsed });
  } catch (err) {
    console.error("motto-generator error:", (err as Error).message);
    return json({ error: "internal error" }, 500);
  }
});
