import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PRINTFUL_BASE = "https://api.printful.com";

async function findMugProductId(apiKey: string, storeId: string): Promise<number> {
  const res = await fetch(`${PRINTFUL_BASE}/products`, {
    headers: { Authorization: `Bearer ${apiKey}`, "X-PF-Store-Id": storeId },
  });
  if (!res.ok) throw new Error(`Printful /products failed (${res.status}): ${await res.text()}`);
  const json = await res.json();
  const products: Array<{ id: number; type: string; type_name: string; title: string; model: string }> = json?.result ?? [];

  const mugs = products.filter((p) =>
    [p.type, p.type_name, p.title, p.model].some((v) => (v ?? "").toLowerCase().includes("mug"))
  );

  const whiteMug =
    mugs.find((p) => /white/i.test(p.title) && !/black|color/i.test(p.title)) ??
    mugs.find((p) => /^(?!.*black).*mug/i.test(p.title)) ??
    mugs[0];

  if (!whiteMug) throw new Error(`No mug product found in Printful catalog`);
  console.log("[generate-mug-mockup] Selected mug product:", { id: whiteMug.id, title: whiteMug.title });
  return whiteMug.id;
}

async function findFirstVariantId(apiKey: string, storeId: string, productId: number): Promise<number> {
  const res = await fetch(`${PRINTFUL_BASE}/products/${productId}`, {
    headers: { Authorization: `Bearer ${apiKey}`, "X-PF-Store-Id": storeId },
  });
  if (!res.ok) throw new Error(`Printful /products/${productId} failed (${res.status}): ${await res.text()}`);
  const json = await res.json();
  const variants: Array<{ id: number; name?: string; color?: string }> =
    json?.result?.variants ?? json?.result?.product?.variants ?? [];
  if (variants.length === 0) throw new Error(`No variants for product ${productId}`);

  const whiteVariant =
    variants.find((v) => /white/i.test(v.name ?? "")) ??
    variants.find((v) => /white/i.test(v.color ?? "")) ??
    variants[0];
  console.log("[generate-mug-mockup] Selected variant:", { id: whiteVariant.id, name: whiteVariant.name });
  return whiteVariant.id;
}

async function generatePrintfulMockup(apiKey: string, storeId: string, designUrl: string): Promise<string> {
  const productId = await findMugProductId(apiKey, storeId);
  const variantId = await findFirstVariantId(apiKey, storeId, productId);

  const createRes = await fetch(`${PRINTFUL_BASE}/mockup-generator/create-task/${productId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "X-PF-Store-Id": storeId,
      "Content-Type": "application/json",
    },
      body: JSON.stringify({
        variant_ids: [variantId],
        format: "jpg",
        files: [
          {
            placement: "default",
            image_url: designUrl,
            // Center crest as square within the wide mug print area (2475x1155).
            // Square ~1100px tall, centered horizontally.
            position: { area_width: 2475, area_height: 1155, width: 1100, height: 1100, top: 28, left: 688 },
          },
        ],
      }),
  });

  if (!createRes.ok) throw new Error(`Printful create-task failed (${createRes.status}): ${await createRes.text()}`);

  const createJson = await createRes.json();
  const taskKey = createJson?.result?.task_key;
  if (!taskKey) throw new Error(`No task_key in Printful response`);

  for (let attempt = 0; attempt < 30; attempt++) {
    await new Promise((r) => setTimeout(r, 2000));
    const pollRes = await fetch(
      `${PRINTFUL_BASE}/mockup-generator/task?task_key=${encodeURIComponent(taskKey)}`,
      { headers: { Authorization: `Bearer ${apiKey}`, "X-PF-Store-Id": storeId } }
    );
    if (!pollRes.ok) throw new Error(`Printful poll failed (${pollRes.status}): ${await pollRes.text()}`);
    const pollJson = await pollRes.json();
    const status = pollJson?.result?.status;
    console.log(`[generate-mug-mockup] Poll ${attempt + 1}: status=${status}`);

    if (status === "completed") {
      const mockupUrl = pollJson?.result?.mockups?.[0]?.mockup_url;
      if (!mockupUrl) throw new Error(`No mockup_url in completed result`);
      return mockupUrl;
    }
    if (status === "failed") throw new Error(`Printful task failed: ${JSON.stringify(pollJson)}`);
  }

  throw new Error("Printful mockup task timed out after 60s");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const printfulKey = Deno.env.get("PRINTFUL_API_KEY");
  const printfulStoreId = Deno.env.get("PRINTFUL_STORE_ID");
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  if (!printfulKey || !printfulStoreId) {
    return new Response(JSON.stringify({ error: "Missing Printful config" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { surname, crestUrl } = await req.json();
    if (!surname || !crestUrl) {
      return new Response(JSON.stringify({ error: "Missing surname or crestUrl" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const slug = surname.toLowerCase().replace(/\s+/g, "-");
    const cacheFile = `heirloom/mockup-${slug}.json`;

    // 1. Check cache
    const { data: cached } = await supabase.storage.from("crests").download(cacheFile);
    if (cached) {
      try {
        const parsed = JSON.parse(await cached.text());
        if (parsed?.mockupUrl) {
          console.log("[generate-mug-mockup] Cache hit:", parsed.mockupUrl);
          return new Response(JSON.stringify({ mockupUrl: parsed.mockupUrl, cached: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } catch (e) {
        console.warn("[generate-mug-mockup] Cache parse failed, regenerating:", e);
      }
    }

    // 2. Call Printful with the raw crest URL directly
    console.log("[generate-mug-mockup] Cache miss, calling Printful with crestUrl:", crestUrl);
    const mockupUrl = await generatePrintfulMockup(printfulKey, printfulStoreId, crestUrl);
    console.log("[generate-mug-mockup] Got mockupUrl:", mockupUrl);

    // 3. Save cache reference (best-effort)
    const { error: cacheErr } = await supabase.storage
      .from("crests")
      .upload(cacheFile, new Blob([JSON.stringify({ mockupUrl, surname, crestUrl, createdAt: new Date().toISOString() })], { type: "application/json" }), { upsert: true, contentType: "application/json" });
    if (cacheErr) console.warn("[generate-mug-mockup] Cache write failed:", cacheErr.message);

    return new Response(JSON.stringify({ mockupUrl, cached: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[generate-mug-mockup] Error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
