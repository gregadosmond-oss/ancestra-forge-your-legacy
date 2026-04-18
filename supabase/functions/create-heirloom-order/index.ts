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
  const displayName = `House of ${surname}`;

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${PRINT_W}" height="${PRINT_H}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">

  <!-- Background -->
  <rect width="${PRINT_W}" height="${PRINT_H}" fill="#1a1510"/>

  <!-- Gold border strips -->
  <rect x="0" y="0" width="${PRINT_W}" height="20" fill="#c9a84c"/>
  <rect x="0" y="${PRINT_H - 20}" width="${PRINT_W}" height="20" fill="#c9a84c"/>

  <!-- Inner border lines -->
  <rect x="30" y="30" width="${PRINT_W - 60}" height="${PRINT_H - 60}" fill="none" stroke="#c9a84c" stroke-width="2" opacity="0.5"/>

  <!-- Vertical divider -->
  <line x1="1050" y1="60" x2="1050" y2="${PRINT_H - 60}" stroke="#c9a84c" stroke-width="1.5" opacity="0.3"/>

  <!-- Crest -->
  <image href="${crestDataUri}" x="60" y="60" width="940" height="${PRINT_H - 120}" preserveAspectRatio="xMidYMid meet"/>

  <!-- House of name -->
  <text x="1100" y="260" font-family="Georgia, 'Times New Roman', serif" font-size="110" fill="#e8b85c" letter-spacing="3">${displayName}</text>

  <!-- Decorative rule under name -->
  <line x1="1100" y1="310" x2="2380" y2="310" stroke="#c9a84c" stroke-width="2" opacity="0.5"/>

  <!-- Subtitle -->
  <text x="1100" y="390" font-family="Arial, sans-serif" font-size="44" fill="#a07830" letter-spacing="8">AN ANCESTORSQR ORIGINAL</text>

  <!-- QR label -->
  <text x="2150" y="820" font-family="Arial, sans-serif" font-size="28" fill="#a07830" letter-spacing="4" text-anchor="middle">SCAN YOUR LEGACY</text>

  <!-- QR code -->
  <image href="${qrDataUri}" x="2030" y="840" width="240" height="240" preserveAspectRatio="xMidYMid meet"/>

  <!-- ANCESTORSQR wordmark -->
  <text x="${PRINT_W / 2}" y="${PRINT_H - 40}" font-family="Georgia, serif" font-size="38" fill="#c9a84c" opacity="0.25" text-anchor="middle" letter-spacing="12">ANCESTORSQR</text>

</svg>`;

  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: PRINT_W },
  });
  return resvg.render().asPng();
}

async function getFirstWhiteVariant(apiKey: string): Promise<number> {
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

    const variantId = await getFirstWhiteVariant(apiKey);

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
