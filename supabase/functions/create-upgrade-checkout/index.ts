import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { createStripeClient, type StripeEnv } from "../_shared/stripe.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: userData, error: userErr } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const user = userData.user;

    // Parse requested environment from client (driven by publishable-key prefix).
    let body: { environment?: string } = {};
    try { body = await req.json(); } catch { /* no body */ }
    const requested = body.environment;
    if (requested !== "sandbox" && requested !== "live") {
      return new Response(
        JSON.stringify({ error: "Invalid environment. Expected 'sandbox' or 'live'." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const env: StripeEnv = requested;

    // Ensure the matching connection is configured.
    const requiredKey = env === "live" ? "STRIPE_LIVE_API_KEY" : "STRIPE_SANDBOX_API_KEY";
    if (!Deno.env.get(requiredKey)) {
      return new Response(
        JSON.stringify({ error: `Upgrade checkout is misconfigured: ${requiredKey} is missing.` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const stripe = createStripeClient(env);

    const origin = req.headers.get("origin") || "https://ancestorsqr.com";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: { name: "Legacy Pack" },
          unit_amount: 2999,
        },
        quantity: 1,
      }],
      customer_email: user.email ?? undefined,
      success_url: `${origin}/dashboard?upgraded=1`,
      cancel_url: `${origin}/upgrade`,
      metadata: {
        user_id: user.id,
        productType: "legacy-upgrade",
      },
      payment_intent_data: {
        description: "Legacy Pack",
        metadata: { user_id: user.id, productType: "legacy-upgrade" },
      },
    });

    // Environment-correct safety guard: never allow the wrong mode for the env.
    // Stripe returns `cs_test_...` for test-mode sessions and `cs_live_...` for live.
    if (session.id) {
      const isTestSession = session.id.startsWith("cs_test_");
      if (env === "sandbox" && !isTestSession) {
        console.error("[create-upgrade-checkout] REFUSED: live session created in sandbox env:", session.id);
        return new Response(
          JSON.stringify({ error: "Refused: expected a test-mode session in sandbox but got a live one." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (env === "live" && isTestSession) {
        console.error("[create-upgrade-checkout] REFUSED: test session created in live env:", session.id);
        return new Response(
          JSON.stringify({ error: "Refused: expected a live-mode session in production but got a test one." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[create-upgrade-checkout]", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
