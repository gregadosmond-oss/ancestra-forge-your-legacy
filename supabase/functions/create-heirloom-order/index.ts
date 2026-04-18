import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resvg, initWasm } from "npm:@resvg/resvg-wasm";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PRINTIFY_BASE = "https://api.printify.com/v1";
const BLUEPRINT_ID = 478;
const PROVIDER_ID = 99;
const PRINT_W = 2475;
const PRINT_H = 1155;

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
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return { b64: btoa(binary), mime };
}

async function buildDesign(crestUrl: string, qrUrl: string, surname: string): Promise<Uint8Array> {
  await ensureWasm();

  const [crest, qr] = await Promise.all([toBase64(crestUrl), toBase64(qrUrl)]);
  const crestDataUri = `data:${crest.mime};base64,${crest.b64}`;
  const qrDataUri = `data:${qr.mime};base64,${qr.b64}`;
  const SAFE_T = 80;
  const SAFE_B = 80;
  const crestY = SAFE_T + 30;
  const crestH = PRINT_H - SAFE_T - SAFE_B - 60;

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${PRINT_W}" height="${PRINT_H}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">

  <!-- Background -->
  <rect width="${PRINT_W}" height="${PRINT_H}" fill="#0d0a07"/>

  <!-- Gold border strips — inside safe zone -->
  <rect x="0" y="${SAFE_T}" width="${PRINT_W}" height="18" fill="#c9a84c"/>
  <rect x="0" y="${PRINT_H - SAFE_B - 18}" width="${PRINT_W}" height="18" fill="#c9a84c"/>

  <!-- Inner frame -->
  <rect x="20" y="${SAFE_T + 26}" width="${PRINT_W - 40}" height="${PRINT_H - SAFE_T - SAFE_B - 52}" fill="none" stroke="#c9a84c" stroke-width="1.5" opacity="0.4"/>

  <!-- QR label — left side (back of mug) -->
  <text x="330" y="720" font-family="Arial, sans-serif" font-size="28" fill="#a07830" letter-spacing="4" text-anchor="middle">SCAN YOUR LEGACY</text>

  <!-- QR code -->
  <image href="${qrDataUri}" x="205" y="740" width="250" height="250" preserveAspectRatio="xMidYMid meet"/>

  <!-- HOUSE OF label -->
  <text x="350" y="260" font-family="Georgia, 'Times New Roman', serif" font-size="52" fill="#a07830" letter-spacing="6">HOUSE  OF</text>

  <!-- Surname — large -->
  <text x="350" y="430" font-family="Georgia, 'Times New Roman', serif" font-size="148" font-weight="bold" fill="#e8b85c">${surname.toUpperCase()}</text>

  <!-- Gold rule under surname -->
  <line x1="350" y1="458" x2="1600" y2="458" stroke="#c9a84c" stroke-width="2" opacity="0.6"/>

  <!-- Vertical divider -->
  <line x1="1640" y1="${SAFE_T + 28}" x2="1640" y2="${PRINT_H - SAFE_B - 28}" stroke="#c9a84c" stroke-width="1.5" opacity="0.25"/>

  <!-- Crest — right side, flush -->
  <image href="${crestDataUri}" x="1600" y="${crestY}" width="700" height="${crestH}" preserveAspectRatio="xMidYMid meet"/>

  <!-- ANCESTORSQR wordmark -->
  <text x="950" y="${PRINT_H - SAFE_B - 28}" font-family="Georgia, serif" font-size="34" fill="#c9a84c" opacity="0.18" text-anchor="middle" letter-spacing="10">A N C E S T O R S Q R</text>

</svg>`;

  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: PRINT_W },
  });
  return resvg.render().asPng();
}

async function getWhite11ozVariant(apiKey: string): Promise<number> {
  const res = await fetch(
    `${PRINTIFY_BASE}/catalog/blueprints/${BLUEPRINT_ID}/print_providers/${PROVIDER_ID}/variants.json`,
    { headers: { Authorization: `Bearer ${apiKey}` } }
  );
  const { variants } = await res.json();
  const white11 = variants?.find((v: any) =>
    v.title?.toLowerCase().includes("11") && v.title?.toLowerCase().includes("white")
  );
  return white11?.id ?? variants?.[0]?.id;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const apiKey = Deno.env.get("PRINTIFY_API_KEY");
  const shopId = Deno.env.get("PRINTIFY_SHOP_ID");
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  if (!apiKey || !shopId) {
    return new Response(JSON.stringify({ error: "Missing Printify config" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { surname, crestUrl, legacyUrl, shippingAddress, customerEmail, quantity = 1 } = await req.json();

  if (!surname || !crestUrl || !shippingAddress) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&color=c9a84c&bgcolor=1a1510&qzone=2&data=${encodeURIComponent(legacyUrl)}`;

    const pngBytes = await buildDesign(crestUrl, qrUrl, surname);

    const supabase = createClient(supabaseUrl, serviceKey);
    const fileName = `heirloom/${surname.toLowerCase().replace(/\s+/g, "-")}-mug-${Date.now()}.png`;
    const { error: uploadErr } = await supabase.storage
      .from("crests")
      .upload(fileName, pngBytes, { contentType: "image/png", upsert: true });

    if (uploadErr) throw new Error(`Upload failed: ${uploadErr.message}`);

    const { data: { publicUrl: designUrl } } = supabase.storage.from("crests").getPublicUrl(fileName);

    const variantId = await getWhite11ozVariant(apiKey);

    const orderPayload = {
      external_id: `aqr-${surname.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
      line_items: [{
        blueprint_id: BLUEPRINT_ID,
        print_provider_id: PROVIDER_ID,
        variant_id: variantId,
        print_areas: { front: designUrl },
        quantity,
      }],
      shipping_method: 1,
      send_shipping_notification: true,
      address_to: shippingAddress,
    };

    const orderRes = await fetch(`${PRINTIFY_BASE}/shops/${shopId}/orders.json`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(orderPayload),
    });

    const order = await orderRes.json();
    if (!orderRes.ok) throw new Error(`Printify order failed: ${JSON.stringify(order)}`);

    await fetch(`${PRINTIFY_BASE}/shops/${shopId}/orders/${order.id}/send_to_production.json`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    return new Response(JSON.stringify({ success: true, orderId: order.id, designUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
