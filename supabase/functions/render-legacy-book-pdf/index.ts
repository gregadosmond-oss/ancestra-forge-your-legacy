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
  return paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join("\n");
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

  const laterChaptersHtml = teaserChapters
    .slice(0, 8)
    .map((title, i) => {
      const body = chapterBodies[i] || "";
      const num = romanNumerals[i + 1];
      return `
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
      height: 230mm;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
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

    .certificate {
      page-break-before: always;
      height: 230mm;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      border: 2px solid var(--divider);
      padding: 20mm;
      box-sizing: border-box;
    }
    .certificate .eyebrow {
      font-family: 'DM Sans', sans-serif;
      font-size: 10pt;
      letter-spacing: 0.4em;
      text-transform: uppercase;
      color: var(--chapter-label);
      margin-bottom: 10mm;
    }
    .certificate h2 {
      font-size: 32pt;
      margin-bottom: 14mm;
    }
    .certificate .body-text {
      font-family: 'Libre Caslon Text', serif;
      font-style: italic;
      font-size: 14pt;
      color: var(--body-text);
      max-width: 140mm;
      line-height: 1.7;
      margin-bottom: 14mm;
    }
    .certificate .motto-block {
      font-family: 'Libre Caslon Text', serif;
      font-style: italic;
      font-size: 13pt;
      color: var(--heading);
    }
    .certificate .motto-en {
      color: var(--motto);
      font-size: 11pt;
      margin-top: 2mm;
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
  <div class="eyebrow">Legacy Certificate</div>
  <h2>House of ${escapeHtml(displaySurname)}</h2>
  <div class="body-text">
    This certifies that the House of ${escapeHtml(displaySurname)}
    bears the arms since ${escapeHtml(String(migrationYear))}.
  </div>
  <div class="motto-block">
    ${mottoLatin ? `"${escapeHtml(mottoLatin)}"` : ""}
    ${mottoEnglish ? `<div class="motto-en">— ${escapeHtml(mottoEnglish)}</div>` : ""}
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
      pageCount: 11,
    });
  } catch (err) {
    return fail("upload", (err as Error).message);
  }
});
