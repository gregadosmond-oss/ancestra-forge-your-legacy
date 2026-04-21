import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const apiKey = Deno.env.get("PRINTFUL_API_KEY");
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Missing PRINTFUL_API_KEY" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { variantId, crestUrl, shippingAddress, customerEmail, legacyUrl, surname, quantity = 1 } = await req.json();

  if (!variantId || !crestUrl || !shippingAddress) {
    return new Response(JSON.stringify({ error: "Missing required fields: variantId, crestUrl, shippingAddress" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const qrData = encodeURIComponent(legacyUrl || "https://ancestorsqr.com/my-legacy");
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&color=c9a84c&bgcolor=0d0a07&qzone=2&data=${qrData}`;

    const orderPayload = {
      recipient: {
        name: shippingAddress.name || "",
        address1: shippingAddress.address1,
        address2: shippingAddress.address2 || "",
        city: shippingAddress.city,
        state_code: shippingAddress.state_code,
        country_code: shippingAddress.country_code || "US",
        zip: shippingAddress.zip,
        email: customerEmail || "",
      },
      items: [{
        variant_id: variantId,
        quantity,
        files: [{ type: "default", url: crestUrl }],
      }],
      packing_slip: {
        email: "support@ancestorsqr.com",
        message: `Your ${surname || ""} family legacy is ready. Scan the QR code above or visit: ${legacyUrl || "ancestorsqr.com/my-legacy"}`,
        logo_url: qrUrl,
        store_name: "AncestorsQR",
      },
      confirm: true,
    };

    const orderRes = await fetch("https://api.printful.com/orders", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(orderPayload),
    });

    const order = await orderRes.json();
    if (!orderRes.ok) throw new Error(`Printful order failed: ${JSON.stringify(order)}`);

    return new Response(JSON.stringify({ success: true, orderId: order.result?.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});