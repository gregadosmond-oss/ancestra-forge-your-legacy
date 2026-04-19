import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PRINTFUL_BASE = "https://api.printful.com";
const PRINTFUL_PRODUCT_ID = 19; // White 11oz mug
const PRINTFUL_VARIANT_ID = 1320; // White 11oz mug variant

async function generatePrintfulMockup(apiKey: string, storeId: string, designUrl: string): Promise<string> {
  const createRes = await fetch(
    `${PRINTFUL_BASE}/mockup-generator/create-task/${PRINTFUL_PRODUCT_ID}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "X-PF-Store-Id": storeId,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        variant_ids: [PRINTFUL_VARIANT_ID],
        format: "jpg",
        files: [
          {
            placement: "default",
            image_url: designUrl,
            position: {
              area_width: 2400,
              area_height: 1000,
              width: 2400,
              height: 1000,
              top: 0,
              left: 0,
            },
          },
        ],
      }),
    }
  );

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Printful create-task failed (${createRes.status}): ${errText}`);
  }

  const createJson = await createRes.json();
  const taskKey = createJson?.result?.task_key;
  if (!taskKey) throw new Error(`No task_key in Printful response: ${JSON.stringify(createJson)}`);

  for (let attempt = 0; attempt < 30; attempt++) {
    await new Promise((r) => setTimeout(r, 2000));

    const pollRes = await fetch(
      `${PRINTFUL_BASE}/mockup-generator/task?task_key=${encodeURIComponent(taskKey)}`,
      { headers: { Authorization: `Bearer ${apiKey}`, "X-PF-Store-Id": storeId } }
    );

    if (!pollRes.ok) {
      const errText = await pollRes.text();
      throw new Error(`Printful poll failed (${pollRes.status}): ${errText}`);
    }

    const pollJson = await pollRes.json();
    const status = pollJson?.result?.status;
    console.log(`[generate-mug-mockup] Poll ${attempt + 1}: status=${status}`);

    if (status === "completed") {
      const mockupUrl = pollJson?.result?.mockups?.[0]?.mockup_url;
      if (!mockupUrl) throw new Error(`No mockup_url in completed result`);
      return mockupUrl;
    }

    if (status === "failed") {
      throw new Error(`Printful task failed: ${JSON.stringify(pollJson)}`);
    }
  }

  throw new Error("Printful mockup task timed out after 60s");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const printfulKey = Deno.env.get("PRINTFUL_API_KEY");
  const printfulStoreId = Deno.env.get("PRINTFUL_STORE_ID");
  if (!printfulKey) {
    return new Response(JSON.stringify({ error: "Missing PRINTFUL_API_KEY" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (!printfulStoreId) {
    return new Response(JSON.stringify({ error: "Missing PRINTFUL_STORE_ID" }), {
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

    // Use the crest URL directly as the design — Printful fetches it from the public URL.
    console.log("[generate-mug-mockup] Calling Printful with crestUrl:", crestUrl);
    const mockupUrl = await generatePrintfulMockup(printfulKey, printfulStoreId, crestUrl);
    console.log("[generate-mug-mockup] Got mockupUrl:", mockupUrl);

    return new Response(JSON.stringify({ mockupUrl, designUrl: crestUrl }), {
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
