import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const GELATO_PRODUCT_BASE = "https://product.gelatoapis.com/v3";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("GELATO_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify(
          { ok: false, error: "GELATO_API_KEY not set in Supabase secrets" },
          null,
          2,
        ),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const url = `${GELATO_PRODUCT_BASE}/catalogs`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-API-KEY": apiKey,
        "Content-Type": "application/json",
      },
    });

    const rawText = await response.text();
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawText);
    } catch (_) {
      parsed = rawText;
    }

    return new Response(
      JSON.stringify(
        {
          ok: response.ok,
          status: response.status,
          response: parsed,
        },
        null,
        2,
      ),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    return new Response(
      JSON.stringify(
        { ok: false, error: (err as Error).message },
        null,
        2,
      ),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
