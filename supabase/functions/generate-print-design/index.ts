import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resvg, initWasm } from "npm:@resvg/resvg-wasm";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Logical canvas is Printify's 8x10 satin (3600x4200 @ 300 DPI).
// Output is rendered at half scale (1800x2100 @ 150 DPI) to fit edge function limits.
const CANVAS_W = 3600;
const CANVAS_H = 4200;
const RENDER_W = 1800;

let wasmReady = false;
async function ensureWasm() {
  if (!wasmReady) {
    const res = await fetch("https://unpkg.com/@resvg/resvg-wasm/index_bg.wasm");
    await initWasm(res);
    wasmReady = true;
  }
}

async function toBase64(url: string): Promise<{ b64: string; mime: string }> {
  const res = await fetch(url);
  const mime = res.headers.get("content-type") ?? "image/png";
  const buf = await res.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(
      null,
      bytes.subarray(i, i + chunk) as unknown as number[],
    );
  }
  return { b64: btoa(binary), mime };
}

async function buildDesign(
  crestUrl: string,
  qrUrl: string,
): Promise<Uint8Array> {
  await ensureWasm();

  const [crest, qr] = await Promise.all([toBase64(crestUrl), toBase64(qrUrl)]);
  const crestDataUri = `data:${crest.mime};base64,${crest.b64}`;
  const qrDataUri = `data:${qr.mime};base64,${qr.b64}`;

  // Crest: centered horizontally; vertically centered between y=200 and y=3400
  // (logical 3600x4200 canvas → renders to y=100..1700 on 1800x2100 output)
  const crestW = 2400;
  const crestH = 2400;
  const crestX = Math.round((CANVAS_W - crestW) / 2);
  const crestY = Math.round((200 + 3400) / 2 - crestH / 2); // 600

  // QR: centered horizontally, exactly 1.5 inches (225px @ 150 DPI = 450px in logical 300 DPI coords) below crest
  const qrSize = 400;
  const qrX = Math.round((CANVAS_W - qrSize) / 2);
  const qrY = crestY + crestH + 450;

  // Gold border frame: inset 80px
  const frameInset = 80;
  const frameX = frameInset;
  const frameY = frameInset;
  const frameW = CANVAS_W - frameInset * 2;
  const frameH = CANVAS_H - frameInset * 2;

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${CANVAS_W}" height="${CANVAS_H}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <rect width="${CANVAS_W}" height="${CANVAS_H}" fill="#0d0a07"/>
  <rect x="${frameX}" y="${frameY}" width="${frameW}" height="${frameH}" fill="none" stroke="#a07830" stroke-width="3" stroke-opacity="0.5"/>
  <image href="${crestDataUri}" x="${crestX}" y="${crestY}" width="${crestW}" height="${crestH}" preserveAspectRatio="xMidYMid meet"/>
  <image href="${qrDataUri}" x="${qrX}" y="${qrY}" width="${qrSize}" height="${qrSize}" preserveAspectRatio="xMidYMid meet"/>
  
</svg>`;

  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: RENDER_W },
  });
  return resvg.render().asPng();
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
