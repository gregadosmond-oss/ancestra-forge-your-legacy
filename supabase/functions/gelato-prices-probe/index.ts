import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const apiKey = Deno.env.get("GELATO_API_KEY");
  if (!apiKey) {
    return new Response(JSON.stringify({ ok: false, error: "no key" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  let body: { productUid?: string; country?: string; currency?: string; pageCount?: number } = {};
  try { body = await req.json(); } catch (_) {}
  const productUid = body.productUid ?? "";
  const qsObj: Record<string, string> = {};
  if (body.country) qsObj.country = body.country;
  if (body.currency) qsObj.currency = body.currency;
  if (body.pageCount) qsObj.pageCount = String(body.pageCount);
  const qs = new URLSearchParams(qsObj).toString();
  const url = `https://product.gelatoapis.com/v3/products/${encodeURIComponent(productUid)}/prices${qs ? `?${qs}` : ""}`;
  const r = await fetch(url, { headers: { "X-API-KEY": apiKey, "Content-Type": "application/json" } });
  const raw = await r.text();
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { parsed = raw; }
  return new Response(JSON.stringify({ ok: r.ok, status: r.status, requestUrl: url, response: parsed }, null, 2), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
