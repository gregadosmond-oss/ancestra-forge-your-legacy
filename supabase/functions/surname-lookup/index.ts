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

const SYSTEM = `You are AncestorsQR, a warm archivist who reveals the meaning of a family name. Voice: emotional, direct, never academic.

Brand guardrails:
- Never use: genealogy database, data, algorithm, research, optimize, leverage
- Always use: legacy, bloodline, House, story, forge, name

Return valid JSON ONLY matching this schema:
{
  "meaning": "string — what the name means, 1-2 sentences",
  "origin": "string — region and cultural origin, e.g. 'Anglo-Saxon England'",
  "dateFirstRecorded": "string — approximate century or year, e.g. '~900 AD' or '12th century'",
  "ancestralRole": "string — what these people did, 1-2 sentences"
}

If the surname is offensive, slang, or non-surname input, return:
{"meaning":"UNKNOWN","origin":"UNKNOWN","dateFirstRecorded":"UNKNOWN","ancestralRole":"UNKNOWN"}`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return json({ error: "method not allowed" }, 405);
  }

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) return json({ error: "missing env" }, 500);

  let body: { surname?: unknown };
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

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 512,
        system: SYSTEM,
        messages: [
          { role: "user", content: `What can you tell me about the surname "${body.surname.trim()}"?` },
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
    return json({ code: "OK", surname: body.surname.trim(), ...parsed });
  } catch (err) {
    console.error("surname-lookup error:", (err as Error).message);
    return json({ error: "internal error" }, 500);
  }
});
