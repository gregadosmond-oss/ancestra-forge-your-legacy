const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Daniel — deep, British, authoritative. Good aged ancestor voice.
const VOICE_ID = "onwK4e9ZLuTAKqWW03F9";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS_HEADERS });

  const apiKey = Deno.env.get("ELEVENLABS_API_KEY");
  if (!apiKey) return new Response("Missing API key", { status: 500 });

  const { text } = await req.json();
  if (!text) return new Response("Missing text", { status: 400 });

  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      "Accept": "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_monolingual_v1",
      voice_settings: {
        stability: 0.72,
        similarity_boost: 0.75,
        style: 0.35,
        use_speaker_boost: true,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("ElevenLabs error:", err);
    return new Response("TTS error", { status: 502 });
  }

  const audio = await res.arrayBuffer();
  return new Response(audio, {
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-cache",
    },
  });
});
