import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resvg, initWasm } from "npm:@resvg/resvg-wasm";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CANVAS_W = 3000;
const CANVAS_H = 3600;

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
  surname: string,
  crestUrl: string,
  qrUrl: string,
  motto?: string,
): Promise<Uint8Array> {
  await ensureWasm();

  const [crest, qr] = await Promise.all([toBase64(crestUrl), toBase64(qrUrl)]);
  const crestDataUri = `data:${crest.mime};base64,${crest.b64}`;
  const qrDataUri = `data:${qr.mime};base64,${qr.b64}`;

  // Scale factor — design originally tuned for 4500w; everything scales with canvas width
  const k = CANVAS_W / 4500;
  const px = (n: number) => Math.round(n * k);

  // Crest at 70% canvas width, centered horizontally, positioned in upper portion
  const crestW = Math.round(CANVAS_W * 0.7);
  const crestH = crestW;
  const crestX = Math.round((CANVAS_W - crestW) / 2);
  const crestY = px(500);

  // Surname positioned below crest
  const surnameY = crestY + crestH + px(280);

  // Motto below surname
  const mottoY = surnameY + px(220);

  // QR bottom right (300x300 in source spec, scaled)
  const qrSize = px(300);
  const qrMargin = px(200);
  const qrX = CANVAS_W - qrSize - qrMargin;
  const qrY = CANVAS_H - qrSize - qrMargin - px(80);
  const qrLabelY = qrY + qrSize + px(70);

  const mottoSvg = motto
    ? `<text x="${CANVAS_W / 2}" y="${mottoY}" font-family="Georgia, 'Times New Roman', serif" font-style="italic" font-size="${px(120)}" fill="#e8b85c" text-anchor="middle" opacity="0.9">${escapeXml(motto)}</text>`
    : "";

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${CANVAS_W}" height="${CANVAS_H}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">

  <!-- Background -->
  <rect width="${CANVAS_W}" height="${CANVAS_H}" fill="#0d0a07"/>

  <!-- Inner gold frame -->
  <rect x="${px(120)}" y="${px(120)}" width="${CANVAS_W - px(240)}" height="${CANVAS_H - px(240)}"
        fill="none" stroke="#c9a84c" stroke-width="${Math.max(2, px(3))}" opacity="0.35"/>

  <!-- Crest -->
  <image href="${crestDataUri}" x="${crestX}" y="${crestY}" width="${crestW}" height="${crestH}" preserveAspectRatio="xMidYMid meet"/>

  <!-- HOUSE OF label -->
  <text x="${CANVAS_W / 2}" y="${surnameY - px(130)}" font-family="Georgia, 'Times New Roman', serif"
        font-size="${px(90)}" fill="#a07830" letter-spacing="${px(14)}" text-anchor="middle">HOUSE  OF</text>

  <!-- Surname (large gold display) -->
  <text x="${CANVAS_W / 2}" y="${surnameY}" font-family="Georgia, 'Times New Roman', serif"
        font-size="${px(240)}" font-weight="bold" fill="#e8b85c" text-anchor="middle"
        letter-spacing="${px(8)}">${escapeXml(surname.toUpperCase())}</text>

  <!-- Motto (italic) -->
  ${mottoSvg}

  <!-- QR code (bottom right) -->
  <image href="${qrDataUri}" x="${qrX}" y="${qrY}" width="${qrSize}" height="${qrSize}" preserveAspectRatio="xMidYMid meet"/>

  <!-- QR label -->
  <text x="${qrX + qrSize / 2}" y="${qrLabelY}" font-family="Arial, Helvetica, sans-serif"
        font-size="${px(40)}" fill="#a07830" letter-spacing="${px(4)}" text-anchor="middle">SCAN YOUR LEGACY</text>

  <!-- Ancestra wordmark (bottom left) -->
  <text x="${qrMargin}" y="${CANVAS_H - qrMargin}" font-family="Georgia, serif"
        font-size="${px(42)}" fill="#c9a84c" opacity="0.35" letter-spacing="${px(12)}">A N C E S T R A</text>

</svg>`;

  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: CANVAS_W },
  });
  return resvg.render().asPng();
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { surname, crestUrl, qrUrl, motto } = await req.json();

    if (!surname || !crestUrl || !qrUrl) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: surname, crestUrl, qrUrl" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const pngBytes = await buildDesign(surname, crestUrl, qrUrl, motto);

    return new Response(pngBytes, {
      headers: {
        ...corsHeaders,
        "Content-Type": "image/png",
        "Content-Disposition": `inline; filename="${surname.toLowerCase().replace(/\s+/g, "-")}-print-design.png"`,
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
