import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { generateCrest } from "./crest.ts";
import type { LegacyFacts } from "../generate-legacy/types.ts";

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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return json({ error: "method not allowed" }, 405);
  }

  const openaiKey = Deno.env.get("OPENAI_API_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!openaiKey || !supabaseUrl || !supabaseKey) {
    return json({ error: "missing env" }, 500);
  }

  let body: { surname?: unknown; facts?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid json" }, 400);
  }
  if (typeof body.surname !== "string" || body.surname.trim().length === 0) {
    return json({ error: "surname required" }, 400);
  }
  if (!body.facts || typeof body.facts !== "object") {
    return json({ error: "facts required" }, 400);
  }

  const facts = body.facts as LegacyFacts;
  const client = createClient(supabaseUrl, supabaseKey);

  try {
    const imageUrl = await generateCrest({
      client,
      surname: body.surname,
      facts,
      callDalle: async (prompt: string) => {
        const res = await fetch("https://api.openai.com/v1/images/generations", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "authorization": `Bearer ${openaiKey}`,
          },
          body: JSON.stringify({
            model: "dall-e-3",
            prompt,
            n: 1,
            size: "1024x1024",
            quality: "standard",
            style: "vivid",
          }),
        });
        if (!res.ok) {
          const err = await res.text();
          throw new Error(`DALL-E error ${res.status}: ${err}`);
        }
        const data = await res.json();
        const url: string | undefined = data.data?.[0]?.url;
        if (!url) throw new Error("DALL-E: no image URL in response");
        return url;
      },
      downloadAndUpload: async (normalized: string, tempUrl: string) => {
        const imgRes = await fetch(tempUrl);
        if (!imgRes.ok) {
          throw new Error(`failed to download image: ${imgRes.status}`);
        }
        const buffer = await imgRes.arrayBuffer();

        const filePath = `${normalized}.png`;
        const { error: uploadError } = await client.storage
          .from("crests")
          .upload(filePath, buffer, { contentType: "image/png", upsert: true });
        if (uploadError) {
          throw new Error(`storage upload failed: ${uploadError.message}`);
        }

        const { data: { publicUrl } } = client.storage
          .from("crests")
          .getPublicUrl(filePath);
        return publicUrl;
      },
    });

    return json({ code: "OK", imageUrl });
  } catch (err) {
    console.error("generate-crest error:", (err as Error).message);
    return json({ code: "ERROR", reason: (err as Error).message }, 502);
  }
});
