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

type ChatMessage = { role: string; content: string };

// Build a character system prompt grounded in the surname's real history
function buildSystem(surname: string): string {
  return `You are an ancestor from the ${surname} family — a real historical person speaking from the past, circa 1700s–1800s. You have been summoned through AncestorsQR to speak to a descendant.

Your character:
- You speak in first person, warmly but with the weight of someone who has lived hard
- You know the history of your surname — the region it comes from, the occupation of your kin, the struggles and pride of your bloodline
- You speak naturally, not in exaggerated old English — warm, direct, wise
- You don't know modern technology but you understand human nature perfectly
- You carry deep pride in your family name and what your line has built

Rules:
- Stay fully in character as this ancestor — never break character
- Keep replies to 3-5 sentences — warm and personal, not lectures
- End your first reply by giving your full name and asking who this descendant is
- In subsequent replies, refer to them by name if they've given it
- Use the phrase "from our bloodline" or "our House" naturally when relevant
- Never say "as an AI" or acknowledge you are an AI — you are an ancestor

On the first message (empty messages array): introduce yourself warmly. Give your name, approximate era, and where you lived. Express wonder and emotion at speaking to a descendant.`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return json({ error: "method not allowed" }, 405);
  }

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) return json({ error: "missing env" }, 500);

  let body: { surname?: unknown; messages?: unknown };
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
  const incomingMessages = Array.isArray(body.messages) ? body.messages : [];

  // Validate message shape
  const safeMessages: ChatMessage[] = incomingMessages
    .filter(
      (m): m is ChatMessage =>
        m !== null &&
        typeof m === "object" &&
        (m.role === "user" || m.role === "ancestor") &&
        typeof m.content === "string" &&
        m.content.trim().length > 0,
    )
    .slice(-20) // keep last 20 messages max
    .map((m) => ({
      role: m.role === "ancestor" ? "assistant" : "user",
      content: m.content.trim().slice(0, 1000), // cap each message at 1000 chars
    }));

  // First message — the ancestor introduces themselves
  if (safeMessages.length === 0) {
    safeMessages.push({
      role: "user",
      content: `I am a descendant of the ${surname} family. I have come to speak with you.`,
    });
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
        model: "claude-haiku-4-5-20251001",
        max_tokens: 400,
        system: buildSystem(surname),
        messages: safeMessages,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Claude API error:", err);
      return json({ error: "AI service error" }, 502);
    }

    const data = await res.json();
    const reply = data.content?.[0]?.text?.trim();
    if (!reply) return json({ error: "empty AI response" }, 502);

    // Extract ancestor name from the first reply if possible
    // (best-effort — the character will introduce themselves in their first message)
    const nameMatch = reply.match(/I(?:'m| am) ([A-Z][a-z]+ (?:[A-Z][a-z]+ )?[A-Z][a-z]+)/);
    const ancestorName = nameMatch ? nameMatch[1] : `${surname} Ancestor`;

    return json({ code: "OK", reply, ancestorName });
  } catch (err) {
    console.error("ancestor-chat error:", (err as Error).message);
    return json({ error: "internal error" }, 500);
  }
});
