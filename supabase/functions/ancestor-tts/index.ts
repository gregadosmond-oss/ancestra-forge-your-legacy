const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const DEFAULT_VOICE = "wyWA56cQNU2KqUW4eCsI";

// Country keyword → ElevenLabs voice ID
// Update any entry with a voice ID you pick from elevenlabs.io/voice-library
const VOICE_MAP: Record<string, string> = {
  england:   "wyWA56cQNU2KqUW4eCsI",
  britain:   "wyWA56cQNU2KqUW4eCsI",
  uk:        "wyWA56cQNU2KqUW4eCsI",
  scotland:  "wyWA56cQNU2KqUW4eCsI",
  ireland:   "wyWA56cQNU2KqUW4eCsI",
  wales:     "wyWA56cQNU2KqUW4eCsI",
  // Add more once you pick voices from ElevenLabs:
  // germany: "VOICE_ID",
  // france:  "VOICE_ID",
  // russia:  "VOICE_ID",
  // italy:   "VOICE_ID",
  // spain:   "VOICE_ID",
  // poland:  "VOICE_ID",
  // sweden:  "VOICE_ID",
  // norway:  "VOICE_ID",
  // greece:  "VOICE_ID",
};

function voiceForCountry(country?: string): string {
  if (!country) return DEFAULT_VOICE;
  const key = country.toLowerCase();
  for (const [pattern, id] of Object.entries(VOICE_MAP)) {
    if (key.includes(pattern)) return id;
  }
  return DEFAULT_VOICE;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS_HEADERS });

  const apiKey = Deno.env.get("ELEVENLABS_API_KEY");
  if (!apiKey) return new Response("Missing API key", { status: 500 });

  const { text, country } = await req.json();
  if (!text) return new Response("Missing text", { status: 400 });

  const voiceId = voiceForCountry(country);
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
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
    return new Response(
      JSON.stringify({ error: "TTS error", detail: err, status: res.status }),
      { status: 502, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    );
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
