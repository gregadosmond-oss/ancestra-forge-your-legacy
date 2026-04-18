import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PRINTIFY_BASE = "https://api.printify.com/v1";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const apiKey = Deno.env.get("PRINTIFY_API_KEY");
  if (!apiKey) return new Response(JSON.stringify({ error: "PRINTIFY_API_KEY not set" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const { action, shopId, data } = await req.json();

  try {
    let url = "";
    let method = "GET";
    let body: string | undefined;

    switch (action) {
      case "get-shops":
        url = `${PRINTIFY_BASE}/shops.json`;
        break;
      case "get-blueprints":
        url = `${PRINTIFY_BASE}/catalog/blueprints.json`;
        break;
      case "get-blueprint":
        url = `${PRINTIFY_BASE}/catalog/blueprints/${data.blueprintId}.json`;
        break;
      case "get-providers":
        url = `${PRINTIFY_BASE}/catalog/blueprints/${data.blueprintId}/print_providers.json`;
        break;
      case "get-variants":
        url = `${PRINTIFY_BASE}/catalog/blueprints/${data.blueprintId}/print_providers/${data.providerId}/variants.json`;
        break;
      case "create-product":
        url = `${PRINTIFY_BASE}/shops/${shopId}/products.json`;
        method = "POST";
        body = JSON.stringify(data.product);
        break;
      case "create-order":
        url = `${PRINTIFY_BASE}/shops/${shopId}/orders.json`;
        method = "POST";
        body = JSON.stringify(data.order);
        break;
      case "send-order":
        url = `${PRINTIFY_BASE}/shops/${shopId}/orders/${data.orderId}/send_to_production.json`;
        method = "POST";
        break;
      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const response = await fetch(url, {
      method,
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      ...(body && { body }),
    });

    const result = await response.json();
    return new Response(JSON.stringify(result), {
      status: response.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
