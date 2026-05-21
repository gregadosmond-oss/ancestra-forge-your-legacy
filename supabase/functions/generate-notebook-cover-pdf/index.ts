import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function titleCase(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function buildHtml(opts: {
  displaySurname: string;
  crestUrl: string;
  qrUrl: string;
  mottoLatin: string;
  mottoEnglish: string;
  foundingYear?: string;
}) {
  const { displaySurname, crestUrl, qrUrl, mottoLatin, mottoEnglish, foundingYear } = opts;
  const estLine = foundingYear
    ? `<div class="est">EST. ${foundingYear}</div>`
    : "";

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  @import url('https://fonts.googleapis.com/css2?family=Libre+Caslon+Display&family=Libre+Caslon+Text:ital@0;1&family=DM+Sans:wght@400;500&display=swap');
  :root {
    --page-bg: #0d0a07;
    --text-cream: #f0e8da;
    --text-cream-soft: #d8cdbf;
    --amber: #d4a04a;
    --amber-dim: #a07830;
    --gold-line: #3d3020;
  }
  @page { size: 154mm 216mm; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: var(--page-bg); color: var(--text-cream); font-family: 'DM Sans', sans-serif; }
  .page {
    width: 154mm;
    height: 216mm;
    background: var(--page-bg);
    position: relative;
    padding: 14mm 12mm;
    display: flex;
    flex-direction: column;
    align-items: center;
    page-break-after: always;
    overflow: hidden;
  }
  .page:last-child { page-break-after: auto; }
  .wordmark {
    font-family: 'DM Sans', sans-serif;
    font-size: 9pt;
    letter-spacing: 4px;
    color: var(--amber);
    text-transform: uppercase;
    text-align: center;
  }
  .divider {
    width: 40mm;
    height: 1px;
    background: var(--gold-line);
    margin: 6mm auto;
  }
  .crest {
    width: 90mm;
    height: auto;
    margin: 8mm auto 6mm;
    display: block;
  }
  .house {
    font-family: 'Libre Caslon Text', serif;
    font-style: italic;
    font-size: 26pt;
    color: var(--text-cream);
    text-align: center;
    line-height: 1.2;
    margin-top: 4mm;
  }
  .label {
    font-family: 'DM Sans', sans-serif;
    font-size: 11pt;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--amber);
    margin-top: 6mm;
    text-align: center;
  }
  .est {
    font-family: 'DM Sans', sans-serif;
    font-size: 8pt;
    letter-spacing: 2px;
    color: var(--amber-dim);
    margin-top: 4mm;
    text-align: center;
  }
  .quote {
    font-family: 'Libre Caslon Text', serif;
    font-style: italic;
    font-size: 16pt;
    color: var(--text-cream-soft);
    text-align: center;
    max-width: 110mm;
    margin: 12mm auto 8mm;
    line-height: 1.4;
  }
  .qr-wrap {
    margin: 6mm auto;
    width: 44mm;
    height: 44mm;
    padding: 2mm;
    border: 1px solid var(--amber);
    background: var(--page-bg);
  }
  .qr-wrap img { width: 100%; height: 100%; display: block; }
  .qr-caption {
    font-family: 'Libre Caslon Text', serif;
    font-style: italic;
    font-size: 10pt;
    color: var(--text-cream-soft);
    text-align: center;
    margin-top: 3mm;
  }
  .motto {
    position: absolute;
    bottom: 14mm;
    left: 0; right: 0;
    text-align: center;
  }
  .motto-latin {
    font-family: 'Libre Caslon Text', serif;
    font-style: italic;
    font-size: 13pt;
    color: var(--amber);
  }
  .motto-en {
    font-family: 'DM Sans', sans-serif;
    font-size: 9pt;
    letter-spacing: 2px;
    color: var(--text-cream-soft);
    margin-top: 2mm;
    text-transform: uppercase;
  }
  .front-inner {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
  }
</style>
</head>
<body>
  <div class="page">
    <div class="wordmark">AncestorsQR</div>
    <div class="divider"></div>
    <div class="front-inner">
      <img class="crest" src="${crestUrl}" alt="Family Crest" />
      <div class="house">The House of ${displaySurname}</div>
      <div class="label">Family Notebook</div>
      ${estLine}
    </div>
  </div>
  <div class="page">
    <div class="wordmark">AncestorsQR</div>
    <div class="divider"></div>
    <div class="quote">&ldquo;Every page is part of your family&rsquo;s story.&rdquo;</div>
    <div class="qr-wrap"><img src="${qrUrl}" alt="QR code" /></div>
    <div class="qr-caption">Scan to read your family&rsquo;s legacy</div>
    <div class="motto">
      <div class="motto-latin">${mottoLatin}</div>
      <div class="motto-en">${mottoEnglish}</div>
    </div>
  </div>
</body>
</html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  let step = "parse-input";
  try {
    const body = await req.json().catch(() => ({}));
    const surnameRaw = (body.surname ?? "").toString();
    if (!surnameRaw.trim()) {
      return new Response(
        JSON.stringify({ success: false, step, error: "surname is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const normalizedSurname = surnameRaw.trim().toLowerCase();
    const displaySurname = (body.displaySurname ?? titleCase(normalizedSurname)).toString();
    const mottoLatin = (body.mottoLatin ?? "Ex Labore, Ascendimus").toString();
    const mottoEnglish = (body.mottoEnglish ?? "From Labour, We Rise").toString();
    const foundingYear = body.foundingYear ? String(body.foundingYear) : undefined;

    step = "env";
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const PDFSHIFT_API_KEY = Deno.env.get("PDFSHIFT_API_KEY");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !PDFSHIFT_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, step, error: "missing required env vars" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    step = "lookup-crest";
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: crestRow, error: crestErr } = await supabase
      .from("surname_crests")
      .select("image_url")
      .eq("surname", normalizedSurname)
      .maybeSingle();
    if (crestErr) {
      return new Response(
        JSON.stringify({ success: false, step, error: crestErr.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (!crestRow?.image_url) {
      return new Response(
        JSON.stringify({
          success: false,
          step,
          error: "No crest found for surname. Run generate-crest first.",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    step = "build-html";
    const qrData = encodeURIComponent(`https://ancestorsqr.com/f/${normalizedSurname}`);
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&color=d4a04a&bgcolor=0d0a07&data=${qrData}`;
    const html = buildHtml({
      displaySurname,
      crestUrl: crestRow.image_url,
      qrUrl,
      mottoLatin,
      mottoEnglish,
      foundingYear,
    });

    step = "render-pdf";
    const pdfRes = await fetch("https://api.pdfshift.io/v3/convert/pdf", {
      method: "POST",
      headers: {
        "X-API-Key": PDFSHIFT_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ source: html, sandbox: false, landscape: false }),
    });
    if (!pdfRes.ok) {
      const errText = await pdfRes.text();
      return new Response(
        JSON.stringify({ success: false, step, status: pdfRes.status, error: errText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const pdfBytes = new Uint8Array(await pdfRes.arrayBuffer());

    step = "upload";
    const path = `notebooks/${normalizedSurname}-notebook-cover.pdf`;
    const { error: uploadErr } = await supabase.storage
      .from("print-designs")
      .upload(path, pdfBytes, {
        upsert: true,
        contentType: "application/pdf",
      });
    if (uploadErr) {
      return new Response(
        JSON.stringify({ success: false, step, error: uploadErr.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: publicUrlData } = supabase.storage
      .from("print-designs")
      .getPublicUrl(path);

    return new Response(
      JSON.stringify({
        success: true,
        url: publicUrlData.publicUrl,
        surname: normalizedSurname,
        pages: 2,
        dimensions: "154x216mm each",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ success: false, step, error: String(e?.message ?? e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
