import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resvg, initWasm } from "npm:@resvg/resvg-wasm";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PRINTFUL_BASE = "https://api.printful.com";
const PRINT_W = 2475;
const PRINT_H = 1155;

let wasmReady = false;
async function ensureWasm() {
  if (!wasmReady) {
    const res = await fetch("https://unpkg.com/@resvg/resvg-wasm/index_bg.wasm");
    await initWasm(res);
    wasmReady = true;
  }
}

async function toBase64(url: string): Promise<{ b64: string; mime: string }> {
  const res = await fetch(url);
  const mime = res.headers.get("content-type") ?? "image/png";
  const buf = await res.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return { b64: btoa(binary), mime };
}

async function buildDesign(crestUrl: string, qrUrl: string, surname: string): Promise<Uint8Array> {
  await ensureWasm();

  const [crest, qr] = await Promise.all([toBase64(crestUrl), toBase64(qrUrl)]);
  const crestDataUri = `data:${crest.mime};base64,${crest.b64}`;
  const qrDataUri = `data:${qr.mime};base64,${qr.b64}`;
  const SAFE_T = 80;
  const SAFE_B = 80;
  const crestY = SAFE_T + 30;
  const crestH = PRINT_H - SAFE_T - SAFE_B - 60;

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${PRINT_W}" height="${PRINT_H}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <rect width="${PRINT_W}" height="${PRINT_H}" fill="#0d0a07"/>
  <rect x="0" y="${SAFE_T}" width="${PRINT_W}" height="18" fill="#c9a84c"/>
  <rect x="0" y="${PRINT_H - SAFE_B - 18}" width="${PRINT_W}" height="18" fill="#c9a84c"/>
  <rect x="20" y="${SAFE_T + 26}" width="${PRINT_W - 40}" height="${PRINT_H - SAFE_T - SAFE_B - 52}" fill="none" stroke="#c9a84c" stroke-width="1.5" opacity="0.4"/>
  <text x="330" y="720" font-family="Arial, sans-serif" font-size="28" fill="#a07830" letter-spacing="4" text-anchor="middle">SCAN YOUR LEGACY</text>
  <image href="${qrDataUri}" x="205" y="740" width="250" height="250" preserveAspectRatio="xMidYMid meet"/>
  <text x="350" y="260" font-family="Georgia, 'Times New Roman', serif" font-size="52" fill="#a07830" letter-spacing="6">HOUSE  OF</text>
  <text x="350" y="430" font-family="Georgia, 'Times New Roman', serif" font-size="148" font-weight="bold" fill="#e8b85c">${surname.toUpperCase()}</text>
  <line x1="350" y1="458" x2="1600" y2="458" stroke="#c9a84c" stroke-width="2" opacity="0.6"/>
  <line x1="1640" y1="${SAFE_T + 28}" x2="1640" y2="${PRINT_H - SAFE_B - 28}" stroke="#c9a84c" stroke-width="1.5" opacity="0.25"/>
  <image href="${crestDataUri}" x="1600" y="${crestY}" width="700" height="${crestH}" preserveAspectRatio="xMidYMid meet"/>
  <text x="950" y="${PRINT_H - SAFE_B - 28}" font-family="Georgia, serif" font-size="34" fill="#c9a84c" opacity="0.18" text-anchor="middle" letter-spacing="10">A N C E S T O R S Q R</text>
</svg>`;

  const resvg = new Resvg(svg, { fitTo: { mode: "width", value: PRINT_W } });
  return resvg.render().asPng();
}

async function findMugProductId(apiKey: string, storeId: string): Promise<number> {
  const res = await fetch(`${PRINTFUL_BASE}/products`, {
    headers: { Authorization: `Bearer ${apiKey}`, "X-PF-Store-Id": storeId },
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Printful /products failed (${res.status}): ${errText}`);
  }
  const json = await res.json();
  const products: Array<{ id: number; type: string; type_name: string; title: string; model: string }> = json?.result ?? [];

  const mugs = products.filter((p) =>
    [p.type, p.type_name, p.title, p.model].some((v) => (v ?? "").toLowerCase().includes("mug"))
  );
  console.log("[generate-mug-mockup] Mug products from Printful:", JSON.stringify(mugs, null, 2));

  const whiteMug =
    mugs.find((p) => /white/i.test(p.title) && /11/.test(p.title)) ??
    mugs.find((p) => /11\s*oz/i.test(p.title)) ??
    mugs[0];

  if (!whiteMug) throw new Error(`No mug product found in Printful catalog (total: ${products.length})`);
  console.log("[generate-mug-mockup] Selected mug product:", whiteMug);
  return whiteMug.id;
}

async function generatePrintfulMockup(apiKey: string, storeId: string, designUrl: string): Promise<string> {
  const productId = await findMugProductId(apiKey, storeId);

  const createRes = await fetch(
    `${PRINTFUL_BASE}/mockup-generator/create-task/${productId}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "X-PF-Store-Id": storeId,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
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

    // Build the full mug design (black bg, HOUSE OF + surname, gold borders, QR placeholder, crest)
    const legacyUrl = `https://ancestorsqr.com/?s=${encodeURIComponent(surname)}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&color=c9a84c&bgcolor=1a1510&qzone=2&data=${encodeURIComponent(legacyUrl)}`;

    console.log("[generate-mug-mockup] Rendering design PNG for:", surname);
    const pngBytes = await buildDesign(crestUrl, qrUrl, surname);

    // Upload to public storage so Printful can fetch it
    const supabase = createClient(supabaseUrl, serviceKey);
    const fileName = `heirloom/mockup-${surname.toLowerCase().replace(/\s+/g, "-")}.png`;
    const { error: uploadErr } = await supabase.storage
      .from("crests")
      .upload(fileName, pngBytes, { contentType: "image/png", upsert: true });
    if (uploadErr) throw new Error(`Upload failed: ${uploadErr.message}`);

    const { data: { publicUrl: designUrl } } = supabase.storage.from("crests").getPublicUrl(fileName);
    console.log("[generate-mug-mockup] Design uploaded:", designUrl);

    const mockupUrl = await generatePrintfulMockup(printfulKey, printfulStoreId, designUrl);
    console.log("[generate-mug-mockup] Got mockupUrl:", mockupUrl);

    return new Response(JSON.stringify({ mockupUrl, designUrl }), {
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
