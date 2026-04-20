import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resvg, initWasm } from "npm:@resvg/resvg-wasm";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Default (satin print): Printify's 8x10 satin (3600x4200 @ 300 DPI), output at 1800x2100.
const DEFAULT_CANVAS_W = 3600;
const DEFAULT_CANVAS_H = 4200;
const DEFAULT_RENDER_W = 1800;

// Phone case: 1242x2099px (no scaling, render at native size).
const PHONE_CASE_W = 1242;
const PHONE_CASE_H = 2099;

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

type LayoutParams = {
  canvasW: number;
  canvasH: number;
  renderW: number;
  crestX: number;
  crestY: number;
  crestW: number;
  crestH: number;
  qrX: number;
  qrY: number;
  qrSize: number;
  frameInset: number;
  frameStrokeWidth: number;
};

function getLayout(productType?: string): LayoutParams {
  if (productType === "phone-case") {
    // 1242 x 2099 phone case canvas, rendered at native size.
    // Top 30% (~y=0 to y=630) reserved for camera cutout — keep clear.
    const canvasW = PHONE_CASE_W;
    const canvasH = PHONE_CASE_H;
    const crestH = 900;
    const crestW = Math.round(crestH * (1500 / 1100)); // preserve ~1500x1100 ratio -> ~1227
    const crestX = Math.round((canvasW - crestW) / 2);
    const crestY = 650; // below camera cutout
    const qrSize = 220;
    const qrX = Math.round((canvasW - qrSize) / 2);
    const qrY = crestY + crestH + 60; // 60px gap below crest
    return {
      canvasW,
      canvasH,
      renderW: canvasW,
      crestX,
      crestY,
      crestW,
      crestH,
      qrX,
      qrY,
      qrSize,
      frameInset: 40,
      frameStrokeWidth: 2,
    };
  }

  // Default: satin print 3600x4200 logical, rendered at 1800x2100.
  return {
    canvasW: DEFAULT_CANVAS_W,
    canvasH: DEFAULT_CANVAS_H,
    renderW: DEFAULT_RENDER_W,
    crestX: 300,
    crestY: 400,
    crestW: 3000,
    crestH: 2200,
    qrX: 1550,
    qrY: 2750,
    qrSize: 500,
    frameInset: 80,
    frameStrokeWidth: 3,
  };
}

async function buildDesign(
  crestUrl: string,
  qrUrl: string,
  productType?: string,
): Promise<Uint8Array> {
  await ensureWasm();

  const [crest, qr] = await Promise.all([toBase64(crestUrl), toBase64(qrUrl)]);
  const crestDataUri = `data:${crest.mime};base64,${crest.b64}`;
  const qrDataUri = `data:${qr.mime};base64,${qr.b64}`;

  const L = getLayout(productType);

  const frameX = L.frameInset;
  const frameY = L.frameInset;
  const frameW = L.canvasW - L.frameInset * 2;
  const frameH = L.canvasH - L.frameInset * 2;

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${L.canvasW}" height="${L.canvasH}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <rect width="${L.canvasW}" height="${L.canvasH}" fill="#0d0a07"/>
  <rect x="${frameX}" y="${frameY}" width="${frameW}" height="${frameH}" fill="none" stroke="#a07830" stroke-width="${L.frameStrokeWidth}" stroke-opacity="0.5"/>
  <image href="${crestDataUri}" x="${L.crestX}" y="${L.crestY}" width="${L.crestW}" height="${L.crestH}" preserveAspectRatio="xMidYMid meet"/>
  <image href="${qrDataUri}" x="${L.qrX}" y="${L.qrY}" width="${L.qrSize}" height="${L.qrSize}" preserveAspectRatio="xMidYMid meet"/>
</svg>`;

  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: L.renderW },
  });
  return resvg.render().asPng();
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { crestUrl, qrUrl, surname, productType } = await req.json();

    if (!crestUrl || !qrUrl) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: crestUrl, qrUrl" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const pngBytes = await buildDesign(crestUrl, qrUrl, productType);
    const suffix = productType === "phone-case" ? "phone-case" : "print-design";
    const filename = `${(surname ?? "crest").toLowerCase().replace(/\s+/g, "-")}-${suffix}.png`;

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
