import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { priceId, quantity, customerEmail, userId, returnUrl, environment, isGift, recipientEmail, surname, shippingAddress, productType } = await req.json();
    if (!priceId || typeof priceId !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(priceId)) {
      return new Response(JSON.stringify({ error: "Invalid priceId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const env = (environment || 'sandbox') as StripeEnv;
    const stripe = createStripeClient(env);

    const prices = await stripe.prices.list({ lookup_keys: [priceId] });
    if (!prices.data.length) {
      return new Response(JSON.stringify({ error: "Price not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const stripePrice = prices.data[0];

    // Required metadata fields — webhook depends on these for delivery email
    const metadata: Record<string, string> = {
      surname: surname ?? '',
      user_id: userId ?? '',
      email: customerEmail ?? '',
    };
    // Backward-compat alias used by older webhook code paths
    if (userId) metadata.userId = userId;
    if (isGift) metadata.isGift = 'true';
    if (recipientEmail) metadata.recipientEmail = recipientEmail;
    if (productType) metadata.productType = productType;
    if (shippingAddress) metadata.shippingAddress = shippingAddress;

    console.log('[create-checkout] metadata being sent to Stripe:', JSON.stringify({
      surname: metadata.surname,
      user_id: metadata.user_id,
      email: metadata.email,
      productType: metadata.productType,
      isGift: metadata.isGift,
    }));

    const session = await stripe.checkout.sessions.create({
      line_items: [{ price: stripePrice.id, quantity: quantity || 1 }],
      mode: "payment",
      ui_mode: "embedded",
      return_url: returnUrl || `${req.headers.get("origin")}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
      ...(customerEmail && { customer_email: customerEmail }),
      metadata,
    });

    console.log('[create-checkout] Session created:', session.id, 'metadata keys:', Object.keys(session.metadata ?? {}).join(','));

    return new Response(JSON.stringify({ clientSecret: session.client_secret }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
