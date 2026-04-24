import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PRINTIFY_BASE = "https://api.printify.com/v1";

const PRODUCTS = {
  canvas:       { blueprintId: 900,  providerId: 72,  defaultVariantId: 77255 },
  coaster:      { blueprintId: 510,  providerId: 48,  defaultVariantId: 72872 },
  blanket:      { blueprintId: 522,  providerId: 99,  defaultVariantId: 68323 },
  charcuterie:  { blueprintId: 2020, providerId: 261, defaultVariantId: 123101 },
};

type ProductType = keyof typeof PRODUCTS;

function isProductType(value: string): value is ProductType {
  return value in PRODUCTS;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const apiKey = Deno.env.get("PRINTIFY_API_KEY");
  const shopId = Deno.env.get("PRINTIFY_SHOP_ID");

  if (!apiKey || !shopId) {
    return new Response(JSON.stringify({ error: "Missing Printify config" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { productType, crestUrl, shippingAddress, variantId, quantity = 1 } = await req.json();

  if (!productType || !crestUrl || !shippingAddress) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!isProductType(productType)) {
    return new Response(JSON.stringify({ error: `Unknown productType: ${productType}` }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const config = PRODUCTS[productType];

  const resolvedVariantId = variantId ?? config.defaultVariantId;

  try {
    const orderPayload = {
      external_id: `aqr-${productType}-${Date.now()}`,
      line_items: [{
        blueprint_id: config.blueprintId,
        print_provider_id: config.providerId,
        variant_id: resolvedVariantId,
        print_areas: { front: crestUrl },
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

    return new Response(JSON.stringify({ success: true, orderId: order.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
