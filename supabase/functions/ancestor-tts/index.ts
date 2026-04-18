const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Adam — deep, reliable, available on all ElevenLabs plans
const VOICE_ID = "pNInz6obpgDQGcFmaJgB";

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
      model_id: "eleven_turbo_v2_5",
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

  const buffer = await res.arrayBuffer();
  const uint8 = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < uint8.length; i += 8192) {
    binary += String.fromCharCode(...uint8.subarray(i, i + 8192));
  }
  const base64 = btoa(binary);
  return new Response(JSON.stringify({ audio: base64 }), {
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
});
