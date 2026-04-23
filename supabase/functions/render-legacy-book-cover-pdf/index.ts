import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const PDFSHIFT_API_KEY = Deno.env.get("PDFSHIFT_API_KEY")!;

const DEFAULT_FIXTURE_URL =
  "https://fjtkjbnvpobawqqkzrst.supabase.co/storage/v1/object/public/print-designs/fixtures/osmond-fixture.json";

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const fail = (step: string, error: string) =>
  json(500, { success: false, step, error });

function escapeHtml(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

type PaletteMode = "print" | "digital";

const PALETTES: Record<PaletteMode, Record<string, string>> = {
  print: {
    "--page-bg": "#f5eedb",
    "--body-text": "#2a1f15",
    "--heading": "#b87a2a",
    "--dropcap": "#d4a04a",
    "--motto": "#6b4a22",
    "--divider": "#c4a878",
    "--chapter-label": "#8a6a3a",
  },
  digital: {
    "--page-bg": "#0d0a07",
    "--body-text": "#d0c4b4",
    "--heading": "#e8b85c",
    "--dropcap": "#d4a04a",
    "--motto": "#e8ddd0",
    "--divider": "#3d3020",
    "--chapter-label": "#a07830",
  },
};

function paletteCss(mode: PaletteMode): string {
  const vars = PALETTES[mode];
  return `:root {\n${Object.entries(vars)
    .map(([k, v]) => `  ${k}: ${v};`)
    .join("\n")}\n}`;
}

function buildHtml(
  fixture: any,
  mode: PaletteMode = "print",
  crestOverrideUrl: string | null = null,
  qrUrl: string | null = null,
): string {
  const facts = fixture?.facts ?? {};

  const displaySurname: string =
    facts.displaySurname || facts.surname || fixture.surname || "Osmond";
  const mottoLatin: string = facts.mottoLatin || "";
  const mottoEnglish: string = facts.mottoEnglish || "";

  const crestImageUrl: string =
    crestOverrideUrl ||
    facts.crestImageUrl ||
    facts.crestUrl ||
    fixture.crestImageUrl ||
    fixture.crestUrl ||
    "";

  const nowTs = Date.now().toString();
  const surnameSlug = String(displaySurname)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  const certNumber = `${surnameSlug.slice(0, 8)}-${nowTs.slice(-6)}`;

  const spineSurname = String(displaySurname).toUpperCase();

  const css = `
    ${paletteCss(mode)}
    @page {
      size: 464.4mm 325.4mm;
      margin: 0;
    }
    html, body {
      margin: 0;
      padding: 0;
      background: var(--page-bg);
      color: var(--body-text);
      font-family: 'DM Sans', sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .cover {
      position: relative;
      width: 464.4mm;
      height: 325.4mm;
      background: var(--page-bg);
      overflow: hidden;
    }
    /* Locked geometry:
       Spread 464.4 x 325.4mm. Spine 6mm + 8mm joints each side.
       Back panel:  201.2 x 285.4mm at (20, 20)    -> center x = 120.6mm
       Front panel: 201.2 x 285.4mm at (243.2, 20) -> center x = 343.8mm
    */
    .back-panel {
      position: absolute;
      left: 20mm;
      top: 20mm;
      width: 201.2mm;
      height: 285.4mm;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      box-sizing: border-box;
    }
    .spine {
      position: absolute;
      top: 0;
      left: 229.2mm;
      width: 6mm;
      height: 325.4mm;
      display: flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
      overflow: hidden;
    }
    .front-panel {
      position: absolute;
      left: 243.2mm;
      top: 20mm;
      width: 201.2mm;
      height: 285.4mm;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      box-sizing: border-box;
    }
    .front-panel > * {
      margin-left: 0;
      margin-right: 0;
    }

    /* Front cover */
    .front .eyebrow {
      font-family: 'DM Sans', sans-serif;
      font-size: 9pt;
      letter-spacing: 4.5px;
      text-transform: uppercase;
      color: #8a7e6e;
      margin: 0;
      line-height: 1;
    }
    .front .eyebrow-rule {
      width: 40mm;
      height: 1px;
      background: #3d3020;
      border: 0;
      margin: 8mm 0 0 0;
    }
    .front .crest-wrap {
      margin: 10mm auto 0 auto;
      line-height: 0;
      text-align: center;
    }
    .front .crest {
      display: block;
      margin: 0 auto;
      width: 90mm;
      max-width: 160mm;
      height: auto;
    }
    .front .house-of {
      font-family: 'Libre Caslon Text', serif;
      font-style: italic;
      font-weight: 400;
      font-size: 22pt;
      color: #d0c4b4;
      margin: 18mm 0 0 0;
      line-height: 1;
    }
    .front .surname {
      font-family: 'Libre Caslon Display', serif;
      font-style: normal;
      font-weight: 400;
      font-size: 68pt;
      color: #d4a04a;
      margin: 4mm 0 0 0;
      line-height: 1;
    }
    .front .flourish {
      font-size: 16pt;
      color: #3d3020;
      margin: 18mm 0 0 0;
      line-height: 1;
    }
    .front .motto-latin {
      font-family: 'Libre Caslon Text', serif;
      font-style: italic;
      font-size: 13pt;
      color: #d4a04a;
      margin: 8mm 0 0 0;
      line-height: 1;
    }
    .front .motto-english {
      font-family: 'DM Sans', sans-serif;
      font-style: normal;
      font-size: 9pt;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: #8a7e6e;
      margin: 4mm 0 0 0;
      line-height: 1;
    }

    /* Spine */
    .spine-inner {
      transform: rotate(90deg);
      transform-origin: center center;
      white-space: nowrap;
      font-family: 'DM Sans', sans-serif;
      font-size: 10pt;
      letter-spacing: 0.4em;
      color: var(--heading);
      text-transform: uppercase;
      text-align: center;
    }
    .spine-ornament {
      position: absolute;
      top: 6mm;
      left: 0;
      right: 0;
      text-align: center;
      color: var(--divider);
      font-size: 10pt;
      line-height: 1;
    }

    /* Back cover */
    .back .back-text {
      font-family: 'Libre Caslon Text', serif;
      font-style: italic;
      font-size: 14pt;
      line-height: 1.7;
      color: var(--body-text);
      max-width: 170mm;
      margin: 70mm auto 0 auto;
      text-align: center;
    }
    .back .back-ornament {
      text-align: center;
      color: var(--divider);
      font-size: 20pt;
      margin-top: 30mm;
      margin-bottom: 30mm;
      line-height: 1;
    }
    .back .wordmark {
      font-family: 'DM Sans', sans-serif;
      font-size: 10pt;
      letter-spacing: 0.4em;
      color: var(--chapter-label);
      text-align: center;
      text-transform: uppercase;
    }
    .back .cert {
      font-family: 'DM Sans', sans-serif;
      font-size: 8pt;
      letter-spacing: 0.3em;
      color: var(--chapter-label);
      text-align: center;
      text-transform: uppercase;
      margin-top: 4mm;
    }
  `;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>The House of ${escapeHtml(displaySurname)} — Cover</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Libre+Caslon+Display&family=Libre+Caslon+Text:ital@0;1&display=swap" rel="stylesheet">
<style>${css}</style>
</head>
<body>

<div class="cover">

  <div class="panel back">
    <div class="back-text">
      Every family has a story worth telling. This is the story of the House of ${escapeHtml(displaySurname)} — forged across centuries, carried forward by every generation that came before you, and now entrusted to you.
    </div>
    ${
      qrUrl
        ? `<div style="text-align:center; margin-top:18mm; margin-bottom:14mm;">
      <img src="${escapeHtml(qrUrl)}" style="width:40mm; height:40mm; display:inline-block; border:2px solid #3d3020; padding:4mm; background:#0d0a07;" />
      <div style="font-family:'DM Sans',sans-serif; font-size:8pt; letter-spacing:3px; color:#8a7e6e; margin-top:6mm; text-transform:uppercase;">Scan to explore your House</div>
    </div>`
        : ""
    }
    <div class="back-ornament">❦</div>
    <div class="wordmark">ANCESTORSQR.COM</div>
    <div class="cert">LEGACY № ${escapeHtml(certNumber)}</div>
  </div>

  <div class="panel spine">
    <div class="spine-ornament">✦</div>
    <div class="spine-inner">THE HOUSE OF ${escapeHtml(spineSurname)}</div>
  </div>

  <div class="panel front">
    <div class="eyebrow">A Family Legacy</div>
    <hr class="eyebrow-rule" />
    ${
      crestImageUrl
        ? `<div class="crest-wrap"><img class="crest" src="${escapeHtml(
            crestImageUrl,
          )}" alt="" /></div>`
        : ""
    }
    <div class="house-of">The House of</div>
    <div class="surname">${escapeHtml(displaySurname)}</div>
    <div class="flourish">❦</div>
    ${
      mottoLatin
        ? `<div class="motto-latin">"${escapeHtml(mottoLatin)}"</div>`
        : ""
    }
    ${
      mottoEnglish
        ? `<div class="motto-english">${escapeHtml(mottoEnglish)}</div>`
        : ""
    }
  </div>

</div>

</body>
</html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  let fixtureUrl = DEFAULT_FIXTURE_URL;
  let mode: PaletteMode = "print";
  let surnameOverride: string | null = null;
  try {
    const body = await req.json().catch(() => ({}));
    if (body && typeof body.fixtureUrl === "string" && body.fixtureUrl.trim()) {
      fixtureUrl = body.fixtureUrl.trim();
    }
    if (body && (body.mode === "print" || body.mode === "digital")) {
      mode = body.mode;
    }
    if (body && typeof body.surname === "string" && body.surname.trim()) {
      surnameOverride = body.surname.trim();
    }
  } catch (_) {
    // keep defaults
  }

  let fixture: any;
  try {
    const res = await fetch(fixtureUrl);
    if (!res.ok) {
      return fail("fixture", `HTTP ${res.status} fetching fixture`);
    }
    fixture = await res.json();
  } catch (err) {
    return fail("fixture", (err as Error).message);
  }

  if (surnameOverride) {
    fixture.facts = fixture.facts ?? {};
    if (!fixture.facts.displaySurname) {
      fixture.facts.displaySurname = surnameOverride;
    }
    if (!fixture.facts.surname) {
      fixture.facts.surname = surnameOverride;
    }
  }

  const surnameForLookup = (
    surnameOverride ||
    fixture?.facts?.displaySurname ||
    fixture?.facts?.surname ||
    fixture?.surname ||
    "osmond"
  )
    .toString()
    .toLowerCase()
    .trim();

  let crestUrl: string | null = null;
  try {
    const lookupClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const { data: crestRow } = await lookupClient
      .from("surname_crests")
      .select("image_url")
      .eq("surname", surnameForLookup)
      .maybeSingle();
    crestUrl = crestRow?.image_url ?? null;
  } catch (_) {
    crestUrl = null;
  }

  const qrTarget = encodeURIComponent(
    `https://ancestorsqr.com/f/${surnameForLookup}`,
  );
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&color=d4a04a&bgcolor=0d0a07&data=${qrTarget}`;

  const html = buildHtml(fixture, mode, crestUrl, qrUrl);

  let pdfBytes: Uint8Array;
  try {
    const auth = btoa(`api:${PDFSHIFT_API_KEY}`);
    const res = await fetch("https://api.pdfshift.io/v3/convert/pdf", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source: html,
        landscape: false,
        format: "464.4mmx325.4mm",
        margin: {
          top: "0mm",
          bottom: "0mm",
          left: "0mm",
          right: "0mm",
        },
        sandbox: false,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return fail(
        "pdfshift",
        `HTTP ${res.status}: ${text.slice(0, 800)}`,
      );
    }

    const buf = await res.arrayBuffer();
    pdfBytes = new Uint8Array(buf);
  } catch (err) {
    return fail("pdfshift", (err as Error).message);
  }

  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const surnameForPath = (
      surnameOverride ||
      fixture?.facts?.displaySurname ||
      fixture?.facts?.surname ||
      fixture?.surname ||
      "osmond"
    )
      .toString()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
    const path = `books/${surnameForPath || "osmond"}-book-cover.pdf`;
    const { error: uploadErr } = await supabase.storage
      .from("print-designs")
      .upload(path, pdfBytes, {
        contentType: "application/pdf",
        upsert: true,
      });
    if (uploadErr) {
      return fail("upload", uploadErr.message);
    }

    const { data: pub } = supabase.storage
      .from("print-designs")
      .getPublicUrl(path);

    return json(200, {
      success: true,
      url: pub.publicUrl,
      bytes: pdfBytes.byteLength,
    });
  } catch (err) {
    return fail("upload", (err as Error).message);
  }
});
