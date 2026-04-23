import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const DEFAULT_PRODUCT_UID =
  "hardcover_pf_210x280-mm-8x11-inch_pt_170-gsm-65lb-coated-silk_cl_4-4_ccl_4-4_bt_glued-left_ct_matt-lamination_prt_1-0_cpt_130-gsm-65-lb-cover-coated-silk_ver";
const DEFAULT_PAGE_COUNT = 40;
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

    let body: { productUid?: string; pageCount?: number } = {};
    try {
      body = await req.json();
    } catch (_) {
      body = {};
    }

    const productUid = body.productUid ?? DEFAULT_PRODUCT_UID;
    const pageCount = body.pageCount ?? DEFAULT_PAGE_COUNT;

    const url = `${GELATO_PRODUCT_BASE}/products/${encodeURIComponent(
      productUid,
    )}/cover-dimensions?pageCount=${pageCount}`;

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
          baseUrl: GELATO_PRODUCT_BASE,
          authHeader: "X-API-KEY",
          keyPrefix: `${apiKey.slice(0, 6)}…`,
          requestUrl: url,
          productUid,
          pageCount,
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
