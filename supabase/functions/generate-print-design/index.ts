import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Image } from "https://deno.land/x/imagescript@1.2.17/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CANVAS_W = 3600;
const CANVAS_H = 4200;
const BG_COLOR = 0x0d0a07ff; // #0d0a07 opaque

// Crest centered in the middle 2400×3000 zone (600px offset from each side)
const CREST_W = 2400;
const CREST_H = 3000;
const CREST_X = 600;
const CREST_Y = 600;

// QR code at fixed position inside the front face
const QR_SIZE = 300;
const QR_X = 2700;
const QR_Y = 3500;

async function fetchImage(url: string): Promise<Image> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  const buf = new Uint8Array(await res.arrayBuffer());
  return await Image.decode(buf);
}

async function buildDesign(crestUrl: string, qrUrl: string): Promise<Uint8Array> {
  const [crestRaw, qrRaw] = await Promise.all([
    fetchImage(crestUrl),
    fetchImage(qrUrl),
  ]);

  // Resize while preserving aspect ratio, fit inside the target box
  const crestRatio = crestRaw.width / crestRaw.height;
  let cw = CREST_W;
  let ch = Math.round(CREST_W / crestRatio);
  if (ch > CREST_H) {
    ch = CREST_H;
    cw = Math.round(CREST_H * crestRatio);
  }
  const crest = crestRaw.resize(cw, ch);
  const cx = CREST_X + Math.round((CREST_W - cw) / 2);
  const cy = CREST_Y + Math.round((CREST_H - ch) / 2);

  const qr = qrRaw.resize(QR_SIZE, QR_SIZE);

  const canvas = new Image(CANVAS_W, CANVAS_H).fill(BG_COLOR);
  canvas.composite(crest, cx, cy);
  canvas.composite(qr, QR_X, QR_Y);

  return await canvas.encode();
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { crestUrl, qrUrl, surname } = await req.json();

    if (!crestUrl || !qrUrl) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: crestUrl, qrUrl" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const pngBytes = await buildDesign(crestUrl, qrUrl);
    const filename = `${(surname ?? "crest").toLowerCase().replace(/\s+/g, "-")}-print-design.png`;

    return new Response(pngBytes, {
      headers: {
        ...corsHeaders,
        "Content-Type": "image/png",
        "Content-Disposition": `inline; filename="${filename}"`,
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
