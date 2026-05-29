import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createStripeClient, type StripeEnv } from "../_shared/stripe.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      priceId,
      quantity,
      customerEmail,
      userId,
      returnUrl,
      environment,
      isGift,
      recipientEmail,
      surname,
      shippingAddress,
      productType,
    } = await req.json();

    const isLegacyBook = productType === "legacy-book";

    if (!isLegacyBook) {
      if (!priceId || typeof priceId !== "string" || !/^[a-zA-Z0-9_-]+$/.test(priceId)) {
        return new Response(JSON.stringify({ error: "Invalid priceId" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const env: StripeEnv = environment === "live" ? "live" : "sandbox";
    // Route through Lovable's shared gateway client so the managed
    // PAYMENTS_*_WEBHOOK_SECRET-signed webhook fires (mirrors the working
    // create-upgrade-checkout path).
    const stripe = createStripeClient(env);

    // Legacy Book uses inline price_data — the stored $99 price isn't
    // available in the managed gateway's Stripe account. Other products
    // continue to resolve via lookup_keys.
    let lineItems: Array<Record<string, unknown>>;
    if (isLegacyBook) {
      lineItems = [{
        price_data: {
          currency: "usd",
          unit_amount: 9900,
          product_data: {
            name: "Legacy Book",
            description: "Heirloom hardcover edition of your family's personalized story — 9 chapters, 42 pages.",
          },
        },
        quantity: 1,
      }];
    } else {
      const prices = await stripe.prices.list({ lookup_keys: [priceId] });
      if (!prices.data.length) {
        return new Response(JSON.stringify({ error: "Price not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      lineItems = [{ price: prices.data[0].id, quantity: quantity || 1 }];
    }

    // Session metadata — webhook reads these to identify the buyer and
    // dispatch the correct fulfillment path.
    const metadata: Record<string, string> = {
      surname: surname ?? "",
      user_id: userId ?? "",
      email: customerEmail ?? "",
    };
    if (userId) metadata.userId = userId;
    if (isGift) metadata.isGift = "true";
    if (recipientEmail) metadata.recipientEmail = recipientEmail;
    if (productType) metadata.productType = productType;
    if (shippingAddress) metadata.shippingAddress = shippingAddress;

    // PaymentIntent metadata — mirrors session metadata so the buyer is
    // identifiable on the PI itself (parity with create-upgrade-checkout).
    const piMetadata: Record<string, string> = {};
    if (userId) piMetadata.user_id = userId;
    if (productType) piMetadata.productType = productType;
    if (surname) piMetadata.surname = surname;

    console.log(
      "[create-checkout] env:", env,
      "productType:", productType,
      "user_id:", userId,
      "surname:", surname,
    );

    const session = await stripe.checkout.sessions.create({
      line_items: [{ price: stripePrice.id, quantity: quantity || 1 }],
      mode: "payment",
      ui_mode: "embedded",
      payment_method_types: ["card"],
      return_url:
        returnUrl ||
        `${req.headers.get("origin")}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
      ...(customerEmail && { customer_email: customerEmail }),
      ...(userId && { client_reference_id: userId }),
      metadata,
      payment_intent_data: {
        description: productType === "legacy-book" ? "Legacy Book" : (productType ?? "AncestorsQR Order"),
        metadata: piMetadata,
      },
    });

    console.log("[create-checkout] session created:", session.id);

    return new Response(JSON.stringify({ clientSecret: session.client_secret }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[create-checkout] error:", (error as Error).message);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
