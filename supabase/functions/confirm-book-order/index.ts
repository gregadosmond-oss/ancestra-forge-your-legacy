// Return-page fallback. CheckoutReturn calls this with the Stripe session_id
// after the user finishes paying. We fetch the session from Stripe (via the
// shared gateway client, same as create-checkout), and if it's a paid
// legacy-book session we trigger the fulfillment pipeline. Idempotent.
//
// Always returns { productType, fulfillmentStatus? } so the return page can
// pick the correct confirmation copy regardless of whether the webhook beat
// us to it.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createStripeClient, type StripeEnv } from "../_shared/stripe.ts";
import { triggerLegacyBookFulfillment } from "../_shared/legacyBookFulfillment.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId, environment } = await req.json();
    if (!sessionId || typeof sessionId !== "string") {
      return new Response(JSON.stringify({ error: "sessionId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const env: StripeEnv = environment === "live" ? "live" : "sandbox";
    const stripe = createStripeClient(env);

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const productType = (session.metadata?.productType ?? null) as string | null;
    const paid = session.payment_status === "paid";

    console.log("[confirm-book-order] session:", sessionId, "productType:", productType, "paid:", paid);

    if (productType !== "legacy-book") {
      return new Response(JSON.stringify({ productType, paid }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!paid) {
      return new Response(JSON.stringify({ productType, paid: false }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const surname = session.metadata?.surname ?? "";
    const userId = session.metadata?.user_id || session.metadata?.userId || undefined;
    const buyerEmail =
      session.metadata?.email ??
      session.customer_details?.email ??
      session.customer_email ??
      undefined;
    const shippingAddressRaw = session.metadata?.shipping ?? session.metadata?.shippingAddress;

    if (!surname || !shippingAddressRaw) {
      console.warn("[confirm-book-order] missing surname or shippingAddress in session metadata");
      return new Response(
        JSON.stringify({
          productType,
          paid,
          fulfillmentStatus: "missing_metadata",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const paymentIntent =
      typeof session.payment_intent === "string" ? session.payment_intent : undefined;

    const result = await triggerLegacyBookFulfillment({
      surname,
      shippingAddress: JSON.parse(shippingAddressRaw),
      buyerEmail: buyerEmail ?? undefined,
      sessionId: session.id,
      paymentIntent,
      amountTotal: session.amount_total ?? undefined,
      currency: session.currency ?? undefined,
      userId,
      env,
    });

    return new Response(
      JSON.stringify({
        productType,
        paid: true,
        fulfillmentStatus: result.fulfillmentStatus,
        alreadyFulfilled: result.alreadyFulfilled,
        orderId: result.orderId,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("[confirm-book-order] error:", (e as Error).message);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
