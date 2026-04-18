import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Image } from "https://deno.land/x/imagescript@1.2.15/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PRINTIFY_BASE = "https://api.printify.com/v1";
const BLUEPRINT_ID = 478;  // Ceramic Mug 11oz/15oz
const PROVIDER_ID = 99;    // Printify Choice
const PRINT_W = 2475;
const PRINT_H = 1155;

async function fetchBytes(url: string): Promise<Uint8Array> {
  const res = await fetch(url);
  return new Uint8Array(await res.arrayBuffer());
}

// Build a 2475x1155 mug design image
async function buildDesign(crestUrl: string, qrUrl: string): Promise<Uint8Array> {
  const canvas = new Image(PRINT_W, PRINT_H);

  // Dark background #1a1510
  canvas.fill(0x1a1510ff);

  // Gold border strip at top and bottom
  for (let x = 0; x < PRINT_W; x++) {
    for (let y = 0; y < 18; y++) canvas.setPixelAt(x + 1, y + 1, 0xc9a84cff);
    for (let y = PRINT_H - 18; y < PRINT_H; y++) canvas.setPixelAt(x + 1, y + 1, 0xc9a84cff);
  }

  // Crest image — left-center
  const crestBytes = await fetchBytes(crestUrl);
  const crest = await Image.decode(crestBytes);
  const crestSize = Math.min(900, PRINT_H - 80);
  crest.resize(crestSize, Image.RESIZE_AUTO);
  canvas.composite(crest, 40, Math.floor((PRINT_H - crest.height) / 2));

  // QR code — bottom right
  const qrBytes = await fetchBytes(qrUrl);
  const qr = await Image.decode(qrBytes);
  qr.resize(220, Image.RESIZE_AUTO);
  canvas.composite(qr, PRINT_W - 260, PRINT_H - 280);

  return await canvas.encode(1); // PNG
}

async function getFirstWhiteVariant(apiKey: string): Promise<number> {
  const res = await fetch(
    `${PRINTIFY_BASE}/catalog/blueprints/${BLUEPRINT_ID}/print_providers/${PROVIDER_ID}/variants.json`,
    { headers: { Authorization: `Bearer ${apiKey}` } }
  );
  const { variants } = await res.json();
  // Find 11oz white variant
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
    // 1. Generate QR code URL
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&color=c9a84c&bgcolor=1a1510&qzone=2&data=${encodeURIComponent(legacyUrl)}`;

    // 2. Build design image
    const pngBytes = await buildDesign(crestUrl, qrUrl);

    // 3. Upload to Supabase Storage
    const supabase = createClient(supabaseUrl, serviceKey);
    const fileName = `heirloom/${surname.toLowerCase().replace(/\s+/g, "-")}-mug-${Date.now()}.png`;
    const { error: uploadErr } = await supabase.storage
      .from("crests")
      .upload(fileName, pngBytes, { contentType: "image/png", upsert: true });

    if (uploadErr) throw new Error(`Upload failed: ${uploadErr.message}`);

    const { data: { publicUrl: designUrl } } = supabase.storage.from("crests").getPublicUrl(fileName);

    // 4. Get variant ID
    const variantId = await getFirstWhiteVariant(apiKey);

    // 5. Create Printify order
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

    // 6. Send to production
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
