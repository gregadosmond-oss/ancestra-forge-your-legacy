import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const DEFAULT_CATALOG_UID = "photo-books";
const DEFAULT_LIMIT = 50;
const DEFAULT_OFFSET = 0;
const DEFAULT_ATTRIBUTE_FILTERS: Record<string, string[]> = {
  CoverFinish: ["matt-lamination"],
  CoverMaterial: ["paper-130-gsm-65-lb-cover-coated-silk"],
  ProductPages: ["40"],
  Size: ["210x280-mm-8x11-inch"],
  PaperType: ["170-gsm-65lb-coated-silk"],
  ProductColors: ["4-4"],
  CoverColors: ["4-4"],
  BindingType: ["glued-left"],
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

    let body: {
      catalogUid?: string;
      attributeFilters?: Record<string, string[]>;
      limit?: number;
      offset?: number;
    } = {};
    try {
      body = await req.json();
    } catch (_) {
      body = {};
    }

    const catalogUid = body.catalogUid ?? DEFAULT_CATALOG_UID;
    const attributeFilters = body.attributeFilters ?? DEFAULT_ATTRIBUTE_FILTERS;
    const limit = body.limit ?? DEFAULT_LIMIT;
    const offset = body.offset ?? DEFAULT_OFFSET;

    const url = `${GELATO_PRODUCT_BASE}/catalogs/${encodeURIComponent(
      catalogUid,
    )}/products:search`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "X-API-KEY": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ attributeFilters, limit, offset }),
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
          requestUrl: url,
          filtersUsed: { catalogUid, attributeFilters, limit, offset },
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
