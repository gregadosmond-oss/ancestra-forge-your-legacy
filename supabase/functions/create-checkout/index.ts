import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import Stripe from "https://esm.sh/stripe@18.5.0";

type StripeEnv = 'sandbox' | 'live';

function getStripeClient(env: StripeEnv): Stripe {
  // Prefer user-managed key (MY_STRIPE_*), fall back to Lovable-managed
  const userKey = env === 'sandbox'
    ? Deno.env.get('MY_STRIPE_SANDBOX_API_KEY')
    : Deno.env.get('MY_STRIPE_LIVE_API_KEY');

  if (userKey) {
    console.log(`[stripe] source=user env=${env} keyLen=${userKey.length} keyPrefix=${userKey.slice(0,12)}`);
    return new Stripe(userKey, { apiVersion: '2024-12-18.acacia' as any });
  }

  const lovableKey = env === 'sandbox'
    ? Deno.env.get('STRIPE_SANDBOX_API_KEY')
    : Deno.env.get('STRIPE_LIVE_API_KEY');

  if (!lovableKey) throw new Error(`No Stripe ${env} API key configured`);
  const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!lovableApiKey) throw new Error('LOVABLE_API_KEY is not configured');

  console.log(`[stripe] source=lovable env=${env} keyLen=${lovableKey.length}`);
  return new Stripe(lovableKey, {
    httpClient: Stripe.createFetchHttpClient((url: string | URL, init?: RequestInit) => {
      const gatewayUrl = url.toString().replace('https://api.stripe.com', 'https://connector-gateway.lovable.dev/stripe');
      return fetch(gatewayUrl, {
        ...init,
        headers: {
          ...Object.fromEntries(new Headers(init?.headers).entries()),
          'X-Connection-Api-Key': lovableKey,
          'Lovable-API-Key': lovableApiKey,
        },
      });
    }),
  });
}

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

    const env = (environment || 'live') as StripeEnv;
    const stripe = getStripeClient(env);

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
      payment_method_types: ["card"],
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
