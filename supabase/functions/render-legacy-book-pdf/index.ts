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

function paragraphsWithDropCap(body: string): string {
  const text = String(body ?? "").trim();
  if (!text) return "";
  const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  if (paragraphs.length === 0) return "";
  const paras = paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join("\n");
  return `${paras}\n<div class="chapter-flourish">✦ ✦ ✦</div>`;
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

function buildHtml(fixture: any, mode: PaletteMode = "print"): string {
  const facts = fixture?.facts ?? {};
  const story = fixture?.story ?? {};
  const chapters = fixture?.chapters ?? {};

  const displaySurname: string =
    facts.displaySurname || facts.surname || fixture.surname || "Osmond";
  const mottoLatin: string = facts.mottoLatin || "";
  const mottoEnglish: string = facts.mottoEnglish || "";

  const generatedAt = fixture.generatedAt
    ? new Date(fixture.generatedAt)
    : new Date();
  const generatedDate = generatedAt.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const crestImageUrl: string =
    facts.crestImageUrl ||
    facts.crestUrl ||
    fixture.crestImageUrl ||
    fixture.crestUrl ||
    "";

  const nowTs = Date.now().toString();
  const surnameSlug = String(displaySurname).toUpperCase().replace(/[^A-Z0-9]/g, "");
  const certNumber = `${surnameSlug.slice(0, 8)}-${nowTs.slice(-6)}`;
  const todayDate = new Date()
    .toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })
    .toUpperCase();

  const chapterOneTitle: string = story.chapterOneTitle || "Chapter I";
  const chapterOneBody: string = story.chapterOneBody || "";
  const teaserChapters: string[] = Array.isArray(story.teaserChapters)
    ? story.teaserChapters
    : [];

  const chapterBodies: string[] =
    (Array.isArray(chapters?.chapterBodies) && chapters.chapterBodies) ||
    (Array.isArray(story?.chapterBodies) && story.chapterBodies) ||
    (Array.isArray(chapters?.chapters) &&
      chapters.chapters.map((c: any) => c?.body ?? "")) ||
    (Array.isArray(chapters?.expandedChapters) &&
      chapters.expandedChapters.map((c: any) => c?.body ?? "")) ||
    [];

  const waypoints = facts?.migration?.waypoints ?? [];
  const earliestWaypoint = Array.isArray(waypoints) && waypoints.length
    ? waypoints[0]
    : null;
  const migrationYear =
    facts?.migration?.year ||
    earliestWaypoint?.century ||
    earliestWaypoint?.year ||
    "antiquity";

  const romanNumerals = [
    "I",
    "II",
    "III",
    "IV",
    "V",
    "VI",
    "VII",
    "VIII",
    "IX",
  ];

  const tocEntries: { num: string; title: string }[] = [
    { num: "I", title: chapterOneTitle },
    ...teaserChapters.slice(0, 8).map((t, i) => ({
      num: romanNumerals[i + 1],
      title: t,
    })),
  ];

  const tocHtml = tocEntries
    .map(
      (e) =>
        `<li><span class="toc-num">${escapeHtml(
          e.num,
        )}.</span><span class="toc-title">${escapeHtml(
          e.title,
        )}</span><span class="toc-dots"></span></li>`,
    )
    .join("\n");

  const chapterTitlePage = (num: string, title: string) => `
<section class="chapter-title-page">
  <div class="ct-eyebrow">Chapter</div>
  <div class="ct-numeral">${escapeHtml(num)}</div>
  <div class="ct-title">${escapeHtml(title)}</div>
  <div class="ct-flourish">✦ ❦ ✦</div>
</section>`;

  const laterChaptersHtml = teaserChapters
    .slice(0, 8)
    .map((title, i) => {
      const body = chapterBodies[i] || "";
      const num = romanNumerals[i + 1];
      return `
${chapterTitlePage(num, title)}
<section class="chapter">
  <div class="chapter-num">Chapter ${escapeHtml(num)}</div>
  <h2 class="chapter-title">${escapeHtml(title)}</h2>
  <div class="chapter-body">
    ${paragraphsWithDropCap(body)}
  </div>
</section>`;
    })
    .join("\n");

  const css = `
    ${paletteCss(mode)}
    @page {
      size: 210mm 280mm;
      margin: 28mm 25mm 28mm 28mm;
      background: var(--page-bg);
      @bottom-center {
        content: counter(page);
        font-family: 'DM Sans', sans-serif;
        font-size: 9pt;
        color: var(--chapter-label);
      }
    }
    @page :first {
      @bottom-center { content: ""; }
    }
    @page title-page {
      @bottom-center { content: ""; }
    }
    @page dedication-page {
      @bottom-center { content: ""; }
    }
    @page chapter-title-page {
      @bottom-center { content: ""; }
    }
    @page afterword-page {
      @bottom-center { content: ""; }
    }
    @page colophon-page {
      @bottom-center { content: ""; }
    }
    html, body {
      margin: 0;
      padding: 0;
      background: var(--page-bg);
      color: var(--body-text);
      font-family: 'DM Sans', sans-serif;
      font-size: 11pt;
      line-height: 1.6;
    }
    h1, h2, h3 {
      font-family: 'Libre Caslon Display', 'Libre Caslon Text', serif;
      color: var(--heading);
      font-style: italic;
      font-weight: 400;
      margin: 0 0 0.6em 0;
      line-height: 1.2;
    }
    p { margin: 0 0 0.9em 0; }

    .title-page {
      page: title-page;
      page-break-after: always;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      min-height: calc(280mm - 56mm);
      max-height: calc(280mm - 56mm);
      box-sizing: border-box;
    }
    .title-page .eyebrow {
      font-family: 'DM Sans', sans-serif;
      font-size: 10pt;
      letter-spacing: 0.4em;
      text-transform: uppercase;
      color: var(--chapter-label);
      margin-bottom: 18mm;
    }
    .title-page h1 {
      font-size: 48pt;
      color: var(--heading);
      margin: 0 0 14mm 0;
    }
    .title-page .display-surname {
      font-size: 64pt;
      color: var(--heading);
      font-style: italic;
      margin: 0 0 18mm 0;
      font-family: 'Libre Caslon Display', serif;
    }
    .title-page .motto-latin {
      font-family: 'Libre Caslon Text', serif;
      font-style: italic;
      font-size: 18pt;
      color: var(--heading);
      margin-bottom: 4mm;
    }
    .title-page .motto-english {
      font-family: 'Libre Caslon Text', serif;
      font-style: italic;
      font-size: 13pt;
      color: var(--motto);
      margin-bottom: 24mm;
    }
    .title-page .generated-date {
      font-family: 'DM Sans', sans-serif;
      font-size: 9pt;
      letter-spacing: 0.3em;
      text-transform: uppercase;
      color: var(--chapter-label);
    }
    .ornament {
      color: var(--dropcap);
      font-size: 14pt;
      margin: 6mm 0;
    }

    .toc {
      page-break-before: always;
      page-break-after: always;
    }
    .toc h2 {
      font-size: 28pt;
      text-align: center;
      margin-bottom: 14mm;
    }
    .toc ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .toc li {
      display: flex;
      align-items: baseline;
      font-family: 'Libre Caslon Text', serif;
      font-size: 13pt;
      color: var(--body-text);
      padding: 4mm 0;
      border-bottom: 1px solid var(--divider);
    }
    .toc .toc-num {
      color: var(--dropcap);
      font-style: italic;
      width: 18mm;
      flex-shrink: 0;
    }
    .toc .toc-title {
      flex: 1;
      font-style: italic;
    }

    .chapter {
      page-break-before: always;
    }
    .chapter-num {
      font-family: 'DM Sans', sans-serif;
      font-size: 9pt;
      letter-spacing: 0.4em;
      text-transform: uppercase;
      color: var(--chapter-label);
      margin-bottom: 4mm;
      text-align: center;
    }
    .chapter-title {
      font-size: 26pt;
      text-align: center;
      margin-bottom: 12mm;
      color: var(--heading);
    }
    .chapter-body p {
      text-align: justify;
      hyphens: auto;
      font-size: 12pt;
      line-height: 1.78;
      margin-bottom: 0.9em;
    }
    .chapter-flourish {
      text-align: center;
      margin-top: 2.5em;
      margin-bottom: 0;
      font-size: 14pt;
      letter-spacing: 0.6em;
      color: var(--divider);
    }
    .chapter-body > p:first-of-type {
      text-indent: 0;
      margin-top: 0;
    }
    .chapter-body > p:first-of-type::first-letter {
      font-family: 'Libre Caslon Display', serif;
      font-size: 5.2em;
      line-height: 0.82;
      float: left;
      margin: 0.05em 0.12em 0 0;
      padding: 0;
      color: var(--dropcap);
      font-weight: 400;
      vertical-align: top;
    }
    .chapter-body > p:first-of-type::after {
      content: "";
      display: block;
      clear: left;
      height: 0;
    }

    .dedication {
      page: dedication-page;
      page-break-before: always;
      page-break-after: always;
      height: calc(100vh - 56mm);
      max-height: calc(280mm - 56mm);
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
    }
    .dedication .dedication-text {
      font-family: 'Libre Caslon Text', serif;
      font-style: italic;
      font-size: 14pt;
      color: var(--motto);
      text-align: center;
      max-width: 130mm;
      line-height: 1.7;
    }

    .certificate {
      page-break-before: always;
      page-break-after: avoid;
      break-inside: avoid;
      page-break-inside: avoid;
      height: calc(100vh - 56mm);
      max-height: calc(280mm - 56mm);
      overflow: hidden;
      box-sizing: border-box;
    }
    .certificate .certificate-outer {
      height: 100%;
      border: 2px solid var(--divider);
      padding: 12mm;
      box-sizing: border-box;
    }
    .certificate .certificate-frame {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      height: 100%;
      text-align: center;
      border: 1px solid var(--divider);
      padding: 10mm;
      box-sizing: border-box;
    }
    .certificate .cert-main {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      flex: 1;
      width: 100%;
    }
    .certificate .cert-label {
      font-family: 'DM Sans', sans-serif;
      font-size: 9pt;
      letter-spacing: 0.4em;
      text-transform: uppercase;
      color: var(--chapter-label);
      margin-bottom: 6mm;
    }
    .certificate .cert-flourish {
      font-size: 24pt;
      color: var(--divider);
      line-height: 1;
      margin-bottom: 6mm;
    }
    .certificate .cert-crest {
      width: 90mm;
      height: auto;
      display: block;
      margin: 0 auto 6mm auto;
    }
    .certificate h2 {
      font-family: 'Libre Caslon Display', serif;
      font-size: 38pt;
      color: var(--heading);
      margin: 0 0 4mm 0;
      font-style: italic;
      font-weight: 400;
    }
    .certificate .cert-rule {
      border: none;
      border-top: 1px solid var(--divider);
      width: 40%;
      margin: 8mm auto;
    }
    .certificate .body-text {
      font-family: 'Libre Caslon Text', serif;
      font-size: 13pt;
      color: var(--body-text);
      max-width: 140mm;
      line-height: 1.6;
      margin: 0 auto;
    }
    .certificate .cert-motto-latin {
      font-family: 'Libre Caslon Text', serif;
      font-style: italic;
      font-size: 15pt;
      color: var(--motto);
      margin-top: 4mm;
    }
    .certificate .cert-motto-en {
      font-family: 'Libre Caslon Text', serif;
      font-style: italic;
      font-size: 11pt;
      color: var(--chapter-label);
      margin-top: 2mm;
    }
    .certificate .cert-footer {
      font-family: 'DM Sans', sans-serif;
      font-size: 8pt;
      letter-spacing: 0.3em;
      text-transform: uppercase;
      color: var(--chapter-label);
      width: 100%;
      line-height: 1.8;
    }
    .certificate .cert-footer div { display: block; }

    .chapter-title-page {
      page: chapter-title-page;
      page-break-before: always;
      page-break-after: always;
      min-height: calc(280mm - 56mm);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      box-sizing: border-box;
    }
    .chapter-title-page .ct-eyebrow {
      font-family: 'DM Sans', sans-serif;
      font-size: 10pt;
      letter-spacing: 0.4em;
      text-transform: uppercase;
      color: var(--chapter-label);
      margin-bottom: 14mm;
    }
    .chapter-title-page .ct-numeral {
      font-family: 'Libre Caslon Display', serif;
      font-style: italic;
      font-size: 96pt;
      color: var(--heading);
      line-height: 1;
      margin: 0 0 16mm 0;
    }
    .chapter-title-page .ct-title {
      font-family: 'Libre Caslon Text', serif;
      font-style: italic;
      font-size: 20pt;
      color: var(--body-text);
      max-width: 130mm;
      line-height: 1.3;
      margin: 0 auto;
    }
    .chapter-title-page .ct-flourish {
      font-size: 14pt;
      color: var(--divider);
      margin-top: 20mm;
      letter-spacing: 0.4em;
    }

    .afterword {
      page: afterword-page;
      page-break-before: always;
      page-break-after: always;
      min-height: calc(280mm - 56mm);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      box-sizing: border-box;
    }
    .afterword h2 {
      font-family: 'Libre Caslon Display', serif;
      font-style: italic;
      font-size: 32pt;
      color: var(--heading);
      margin: 0 0 14mm 0;
      text-align: center;
    }
    .afterword .afterword-body {
      font-family: 'Libre Caslon Text', serif;
      font-size: 13pt;
      line-height: 1.7;
      text-align: center;
      max-width: 140mm;
      color: var(--body-text);
      margin: 0 auto 12mm auto;
    }
    .afterword .afterword-motto-latin {
      font-family: 'Libre Caslon Text', serif;
      font-style: italic;
      font-size: 15pt;
      color: var(--motto);
      margin-top: 4mm;
    }
    .afterword .afterword-motto-en {
      font-family: 'Libre Caslon Text', serif;
      font-style: italic;
      font-size: 11pt;
      color: var(--chapter-label);
      margin-top: 2mm;
    }

    .colophon {
      page: colophon-page;
      page-break-before: always;
      page-break-after: always;
      min-height: calc(280mm - 56mm);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      box-sizing: border-box;
    }
    .colophon h2 {
      font-family: 'Libre Caslon Display', serif;
      font-style: italic;
      font-size: 28pt;
      color: var(--heading);
      margin: 0 0 14mm 0;
      text-align: center;
    }
    .colophon .colophon-body {
      font-family: 'Libre Caslon Text', serif;
      font-size: 11pt;
      line-height: 1.8;
      max-width: 130mm;
      text-align: center;
      color: var(--body-text);
      margin: 0 auto;
    }
    .colophon .colophon-flourish {
      font-size: 18pt;
      color: var(--divider);
      margin-top: 12mm;
    }
  `;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>The House of ${escapeHtml(displaySurname)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Libre+Caslon+Display&family=Libre+Caslon+Text:ital@0;1&display=swap" rel="stylesheet">
<style>${css}</style>
</head>
<body>

<section class="title-page">
  <div class="eyebrow">A Family Legacy</div>
  <h1>The House of</h1>
  <div class="display-surname">${escapeHtml(displaySurname)}</div>
  <div class="ornament">✦ ❦ ✦</div>
  ${mottoLatin ? `<div class="motto-latin">"${escapeHtml(mottoLatin)}"</div>` : ""}
  ${mottoEnglish ? `<div class="motto-english">${escapeHtml(mottoEnglish)}</div>` : ""}
  <div class="generated-date">Forged ${escapeHtml(generatedDate)}</div>
</section>

<section class="dedication">
  <div class="dedication-text">
    For the House of ${escapeHtml(displaySurname)} —<br/>
    past, present, and future.
  </div>
</section>

<section class="toc">
  <h2>Contents</h2>
  <ul>
    ${tocHtml}
  </ul>
</section>

<section class="chapter">
  <div class="chapter-num">Chapter I</div>
  <h2 class="chapter-title">${escapeHtml(chapterOneTitle)}</h2>
  <div class="chapter-body">
    ${paragraphsWithDropCap(chapterOneBody)}
  </div>
</section>

${laterChaptersHtml}

<section class="certificate">
  <div class="certificate-outer">
    <div class="certificate-frame">
      <div class="cert-main">
        <div class="cert-label">Legacy Certificate</div>
        <div class="cert-flourish">❦</div>
        ${crestImageUrl ? `<img class="cert-crest" src="${escapeHtml(crestImageUrl)}" alt="" />` : ""}
        <h2>House of ${escapeHtml(displaySurname)}</h2>
        <hr class="cert-rule" />
        <div class="body-text">
          This certifies that the House of ${escapeHtml(displaySurname)}
          bears the arms since ${escapeHtml(String(migrationYear))}.
        </div>
        ${mottoLatin ? `<div class="cert-motto-latin">"${escapeHtml(mottoLatin)}"</div>` : ""}
        ${mottoEnglish ? `<div class="cert-motto-en">— ${escapeHtml(mottoEnglish)}</div>` : ""}
        <hr class="cert-rule" />
      </div>
      <div class="cert-footer">
        <div>Issued by AncestorsQR</div>
        <div>Certificate № ${escapeHtml(certNumber)}</div>
        <div>${escapeHtml(todayDate)}</div>
      </div>
    </div>
  </div>
</section>

</body>
</html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  let fixtureUrl = DEFAULT_FIXTURE_URL;
  let mode: PaletteMode = "print";
  try {
    const body = await req.json().catch(() => ({}));
    if (body && typeof body.fixtureUrl === "string" && body.fixtureUrl.trim()) {
      fixtureUrl = body.fixtureUrl.trim();
    }
    if (body && (body.mode === "print" || body.mode === "digital")) {
      mode = body.mode;
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

  const html = buildHtml(fixture, mode);

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
        format: "210mmx280mm",
        margin: {
          top: "28mm",
          bottom: "28mm",
          left: "28mm",
          right: "25mm",
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
    const path = mode === "digital"
      ? "books/osmond-book-interior-digital.pdf"
      : "books/osmond-book-interior.pdf";
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
      pageCount: 12,
    });
  } catch (err) {
    return fail("upload", (err as Error).message);
  }
});
