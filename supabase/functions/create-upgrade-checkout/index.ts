import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { createStripeClient, type StripeEnv } from "../_shared/stripe.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Hard-coded to sandbox so this flow can NEVER create a live charge.
const UPGRADE_ENV: StripeEnv = "sandbox";

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

    // Safety guard: this function must only ever run in sandbox/test mode.
    if (UPGRADE_ENV !== "sandbox") {
      return new Response(
        JSON.stringify({ error: "Upgrade checkout is misconfigured: sandbox mode is required." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (!Deno.env.get("STRIPE_SANDBOX_API_KEY")) {
      return new Response(
        JSON.stringify({ error: "Upgrade checkout is misconfigured: sandbox Stripe connection is missing." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const stripe = createStripeClient(UPGRADE_ENV);

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

    // Extra belt-and-suspenders: refuse to return a live session id.
    if (session.id && !session.id.startsWith("cs_test_")) {
      console.error("[create-upgrade-checkout] non-test session id returned:", session.id);
      return new Response(
        JSON.stringify({ error: "Refused: checkout session was not created in test mode." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
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
