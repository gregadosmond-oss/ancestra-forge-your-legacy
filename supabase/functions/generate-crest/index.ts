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

  const ideogramKey = Deno.env.get("IDEOGRAM_API_KEY");
  const removeBgKey = Deno.env.get("REMOVE_BG_API_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!ideogramKey || !removeBgKey || !supabaseUrl || !supabaseKey) {
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
  const surname = body.surname.trim();
  if (surname.length > 60) {
    return json({ error: "surname too long" }, 400);
  }
  if (!body.facts || typeof body.facts !== "object") {
    return json({ error: "facts required" }, 400);
  }
  const factsObj = body.facts as Record<string, unknown>;
  if (!Array.isArray(factsObj.symbolism) || factsObj.symbolism.length === 0) {
    return json({ error: "facts.symbolism must be a non-empty array" }, 400);
  }

  const facts = body.facts as LegacyFacts;
  const client = createClient(supabaseUrl, supabaseKey);

  try {
    const imageUrl = await generateCrest({
      client,
      surname,
      facts,
      callImageApi: async (prompt: string) => {
          // Download reference crest image from storage for style reference
          const refUrl = `${supabaseUrl}/storage/v1/object/public/crests/reference/osmond-reference.png`;
          const refRes = await fetch(refUrl);
          if (!refRes.ok) {
            throw new Error(`Failed to fetch reference image: ${refRes.status}`);
          }
          const refBlob = await refRes.blob();

          const formData = new FormData();
          formData.append("prompt", prompt);
          formData.append("aspect_ratio", "1x1");
          formData.append("rendering_speed", "TURBO");
          formData.append("style_type", "DESIGN");
          formData.append("style_reference_images[0]", refBlob, "osmond-reference.png");
          formData.append("negative_prompt", "room, interior, furniture, walls, floor, ceiling, hallway, library, environment, building, table, surface, reflections");

          const res = await fetch("https://api.ideogram.ai/v1/ideogram-v3/generate", {
            method: "POST",
            headers: {
              "Api-Key": ideogramKey,
            },
            body: formData,
          });
        if (!res.ok) {
          const err = await res.text();
          throw new Error(`Ideogram error ${res.status}: ${err}`);
        }
        const data = await res.json();
        const url: string | undefined = data.data?.[0]?.url;
        if (!url) throw new Error("Ideogram: no image URL in response");
        return url;
      },
      downloadAndUpload: async (normalized: string, tempUrl: string) => {
        // 1. Download from Ideogram
        const imgRes = await fetch(tempUrl);
        if (!imgRes.ok) throw new Error(`failed to download image: ${imgRes.status}`);
        const imgBuffer = await imgRes.arrayBuffer();
        const imgBlob = new Blob([imgBuffer], { type: "image/png" });

        // 2. Send binary to remove.bg
        const rbgForm = new FormData();
        rbgForm.append("image_file", imgBlob, "crest.png");
        rbgForm.append("size", "auto");

        const rbgRes = await fetch("https://api.remove.bg/v1.0/removebg", {
          method: "POST",
          headers: {
            "X-Api-Key": removeBgKey,
            "Accept": "image/png",
          },
          body: rbgForm,
        });
        if (!rbgRes.ok) {
          const errText = await rbgRes.text();
          throw new Error(`remove.bg error ${rbgRes.status}: ${errText}`);
        }
        const buffer = await rbgRes.arrayBuffer();

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
    const msg = (err as Error).message;
    console.error("generate-crest error:", msg);
    const clientReason =
      msg.startsWith("Ideogram error") || msg.startsWith("storage upload")
        ? "image generation failed"
        : msg;
    return json({ code: "ERROR", reason: clientReason }, 502);
  }
});
