import type { LegacyFacts, LegacyStory } from "@/types/legacy";

interface CertificateData {
  facts: LegacyFacts;
  story: LegacyStory | null;
  crestUrl: string | null;
  surname?: string | null;
}

export function generateCertificate({ facts, story, crestUrl, surname }: CertificateData): void {
  const displaySurname = facts.displaySurname;
  const certNumber = `ANCESTORSQR-${Date.now().toString(36).toUpperCase().slice(-8)}`;
  const issuedDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const clean = (s: string) => s.replace(/\*\*/g, "").replace(/\*/g, "");

  const chapterTitles = story
    ? [story.chapterOneTitle, ...story.teaserChapters]
        .map((t, i) => `<li><span class="ch-num">Ch. ${["I","II","III","IV","V","VI","VII","VIII","IX"][i]}</span> ${clean(t).replace(/^Chapter\s+[IVX]+\s*[—–-]\s*/i, "")}</li>`)
        .join("")
    : "";

  const templateCrestUrl = typeof window !== "undefined" ? `${window.location.origin}/crest.png` : "/crest.png";
  const activeCrestUrl = crestUrl ?? templateCrestUrl;
  const isTemplate = !crestUrl;
  const legacySlug = (surname ?? facts.displaySurname ?? "").trim().toLowerCase().replace(/\s+/g, "-");
  const legacyUrl = typeof window !== "undefined" ? `${window.location.origin}/f/${legacySlug}` : `/f/${legacySlug}`;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=90x90&color=8b6914&bgcolor=fdf8f0&qzone=1&data=${encodeURIComponent(legacyUrl)}`;

  const crestSection = `
    <div style="position:relative;display:inline-block;">
      <img src="${activeCrestUrl}" alt="${displaySurname} Crest" style="display:block;width:160px;height:auto;" />
      ${isTemplate ? `<img src="${qrSrc}" alt="QR" style="position:absolute;top:60%;left:50%;transform:translate(-50%,-50%);width:11%;height:auto;mix-blend-mode:multiply;pointer-events:none;" />` : ""}
    </div>`;

  const waypointRows = facts.migration.waypoints.map(w => `
    <tr>
      <td class="wp-century">${w.century}</td>
      <td class="wp-dot">✦</td>
      <td class="wp-region">${w.region}</td>
      <td class="wp-role">${w.role}</td>
    </tr>`).join("");

  const symbolismRows = facts.symbolism.map(s => `
    <div class="sym-item">
      <span class="sym-el">${s.element}</span>
      <span class="sym-meaning">${s.meaning}</span>
    </div>`).join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>House of ${displaySurname} — Legacy Certificate</title>
  <link href="https://fonts.googleapis.com/css2?family=Libre+Caslon+Display&family=Libre+Caslon+Text:ital@0;1&family=DM+Sans:wght@400;600&display=swap" rel="stylesheet" />
  <style>
    @page { size: A4 landscape; margin: 0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: 297mm;
      height: 210mm;
      background: #fdf8f0;
      font-family: 'Libre Caslon Text', Georgia, serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      overflow: hidden;
    }

    /* ── Frame ── */
    .border-outer {
      position: absolute;
      inset: 6mm;
      border: 2.5px solid #c9a84c;
    }
    .border-inner {
      position: absolute;
      inset: 9.5mm;
      border: 1px solid rgba(201,168,76,0.35);
    }
    /* Corner ornaments */
    .corner {
      position: absolute;
      width: 14mm;
      height: 14mm;
      border-color: #c9a84c;
      border-style: solid;
    }
    .corner-tl { top: -1.5px; left: -1.5px; border-width: 3px 0 0 3px; }
    .corner-tr { top: -1.5px; right: -1.5px; border-width: 3px 3px 0 0; }
    .corner-bl { bottom: -1.5px; left: -1.5px; border-width: 0 0 3px 3px; }
    .corner-br { bottom: -1.5px; right: -1.5px; border-width: 0 3px 3px 0; }

    /* ── Watermark ── */
    .watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-family: 'Libre Caslon Display', Georgia, serif;
      font-size: 90pt;
      color: rgba(201,168,76,0.04);
      letter-spacing: 6px;
      text-transform: uppercase;
      white-space: nowrap;
      pointer-events: none;
      user-select: none;
    }

    /* ── Layout ── */
    .content {
      position: absolute;
      inset: 13mm 12mm 32mm 12mm;
      display: flex;
      gap: 8mm;
    }

    /* Left panel */
    .left {
      flex: 0 0 50mm;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      border-right: 1px solid rgba(201,168,76,0.3);
      padding-right: 8mm;
      gap: 3.5mm;
    }
    .left-label {
      font-family: 'DM Sans', Arial, sans-serif;
      font-size: 6pt;
      font-weight: 600;
      letter-spacing: 3px;
      text-transform: uppercase;
      color: #a07830;
    }
    .motto-latin {
      font-family: 'Libre Caslon Text', Georgia, serif;
      font-style: italic;
      font-size: 11pt;
      color: #6b4e1a;
      line-height: 1.35;
    }
    .motto-english {
      font-family: 'DM Sans', Arial, sans-serif;
      font-size: 6pt;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: #a07830;
      margin-top: 1mm;
    }
    .origin-block {
      font-family: 'DM Sans', Arial, sans-serif;
      font-size: 6pt;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: #8a7040;
      line-height: 1.6;
    }
    .divider-h {
      width: 100%;
      height: 1px;
      background: linear-gradient(to right, transparent, rgba(201,168,76,0.6), transparent);
    }
    .qr-wrap { margin-top: auto; }
    .qr-label {
      font-family: 'DM Sans', Arial, sans-serif;
      font-size: 5.5pt;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: #a07830;
      margin-bottom: 2mm;
    }

    /* Right panel */
    .right {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 3.5mm;
      overflow: hidden;
    }

    /* Header */
    .cert-label {
      font-family: 'DM Sans', Arial, sans-serif;
      font-size: 6.5pt;
      font-weight: 600;
      letter-spacing: 4px;
      text-transform: uppercase;
      color: #a07830;
    }
    .house-name {
      font-family: 'Libre Caslon Display', Georgia, serif;
      font-size: 30pt;
      color: #1e1208;
      line-height: 1;
      letter-spacing: 0.5px;
    }
    .house-sub {
      font-family: 'Libre Caslon Text', Georgia, serif;
      font-style: italic;
      font-size: 8pt;
      color: #a07830;
      margin-top: 1mm;
    }

    /* Declaration */
    .declaration {
      font-family: 'Libre Caslon Text', Georgia, serif;
      font-size: 8.5pt;
      color: #3a2c14;
      line-height: 1.75;
      border-left: 2px solid rgba(201,168,76,0.5);
      padding-left: 3.5mm;
    }

    /* Section titles */
    .sec {
      font-family: 'DM Sans', Arial, sans-serif;
      font-size: 6pt;
      font-weight: 600;
      letter-spacing: 3px;
      text-transform: uppercase;
      color: #a07830;
      margin-bottom: 2mm;
    }

    /* Migration table */
    .wp-table { width: 100%; border-collapse: collapse; }
    .wp-century {
      font-family: 'DM Sans', Arial, sans-serif;
      font-size: 6.5pt;
      letter-spacing: 1px;
      color: #a07830;
      white-space: nowrap;
      padding-right: 2.5mm;
      vertical-align: top;
    }
    .wp-dot {
      font-size: 5pt;
      color: #c9a84c;
      padding-right: 2mm;
      vertical-align: top;
      padding-top: 1pt;
    }
    .wp-region {
      font-family: 'Libre Caslon Text', Georgia, serif;
      font-size: 7.5pt;
      color: #2c1e08;
      font-weight: bold;
      padding-right: 3mm;
      vertical-align: top;
      white-space: nowrap;
    }
    .wp-role {
      font-family: 'Libre Caslon Text', Georgia, serif;
      font-size: 7pt;
      font-style: italic;
      color: #6b5030;
      vertical-align: top;
      line-height: 1.5;
    }
    .wp-table tr { line-height: 1.7; }
    .migration-close {
      font-family: 'Libre Caslon Text', Georgia, serif;
      font-size: 7pt;
      font-style: italic;
      color: #8a7040;
      margin-top: 1.5mm;
    }

    /* Symbolism */
    .sym-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5mm 4mm;
    }
    .sym-item { display: flex; flex-direction: column; }
    .sym-el {
      font-family: 'DM Sans', Arial, sans-serif;
      font-size: 6.5pt;
      font-weight: 600;
      color: #5a3e10;
      letter-spacing: 0.5px;
    }
    .sym-meaning {
      font-family: 'Libre Caslon Text', Georgia, serif;
      font-style: italic;
      font-size: 7pt;
      color: #7a6040;
      line-height: 1.45;
    }

    /* Chapters */
    .chapters-list {
      list-style: none;
      columns: 2;
      column-gap: 5mm;
      font-family: 'Libre Caslon Text', Georgia, serif;
      font-size: 7pt;
      color: #4a3820;
      line-height: 1.75;
    }
    .chapters-list li { break-inside: avoid; }
    .ch-num {
      font-family: 'DM Sans', Arial, sans-serif;
      font-size: 6pt;
      color: #a07830;
      letter-spacing: 0.5px;
      margin-right: 1mm;
    }

    /* Two-column bottom layout */
    .bottom-cols {
      display: flex;
      gap: 6mm;
      flex: 1;
    }
    .bottom-left { flex: 1; }
    .bottom-right { flex: 1; }

    /* Footer */
    .footer {
      position: absolute;
      bottom: 7mm;
      left: 0;
      right: 0;
      padding: 0 13mm;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .sig-line { width: 36mm; height: 1px; background: #c9a84c; margin-bottom: 1mm; }
    .sig-name {
      font-family: 'Libre Caslon Text', Georgia, serif;
      font-style: italic;
      font-size: 7.5pt;
      color: #5a3e10;
    }
    .sig-title {
      font-family: 'DM Sans', Arial, sans-serif;
      font-size: 5.5pt;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: #a07830;
      margin-top: 0.5mm;
    }
    .brand-center { text-align: center; }
    .brand-name {
      font-family: 'Libre Caslon Display', Georgia, serif;
      font-size: 8.5pt;
      color: #a07830;
      letter-spacing: 3px;
      text-transform: uppercase;
    }
    .brand-tagline {
      font-family: 'Libre Caslon Text', Georgia, serif;
      font-style: italic;
      font-size: 6pt;
      color: #c9a84c;
      margin-top: 1mm;
    }
    .cert-info {
      font-family: 'DM Sans', Arial, sans-serif;
      font-size: 6pt;
      color: #a07830;
      letter-spacing: 0.5px;
      text-align: right;
      line-height: 1.8;
    }

    @media print { body { margin: 0; } }
  </style>
</head>
<body>

  <!-- Watermark -->
  <div class="watermark">ANCESTORSQR</div>

  <!-- Borders -->
  <div class="border-outer">
    <div class="corner corner-tl"></div>
    <div class="corner corner-tr"></div>
    <div class="corner corner-bl"></div>
    <div class="corner corner-br"></div>
  </div>
  <div class="border-inner"></div>

  <!-- Content -->
  <div class="content">

    <!-- LEFT: Crest + Motto + Origin -->
    <div class="left">
      <p class="left-label">Coat of Arms</p>
      ${crestSection}
      <div class="divider-h"></div>
      <p class="motto-latin">"${facts.mottoLatin}"</p>
      <p class="motto-english">${facts.mottoEnglish}</p>
      <div class="divider-h"></div>
      <div class="origin-block">
        <div>${facts.meaning.origin}</div>
        <div style="margin-top:1mm;color:#c9a84c;">Ancestral Role</div>
        <div style="margin-top:0.5mm;font-style:italic;font-family:'Libre Caslon Text',Georgia,serif;font-size:6.5pt;color:#6b5030;text-transform:none;letter-spacing:0;">${facts.meaning.role}</div>
      </div>
    </div>

    <!-- RIGHT -->
    <div class="right">

      <!-- Header -->
      <div>
        <p class="cert-label">Legacy Certificate &nbsp;·&nbsp; An AncestorsQR Original</p>
        <p class="house-name">House ${displaySurname}</p>
        <p class="house-sub">Est. ${facts.meaning.origin.replace(/[^0-9–—,\s]/g, "").trim() || facts.meaning.origin} &nbsp;✦&nbsp; ${facts.meaning.role}</p>
      </div>

      <div style="height:1px;background:linear-gradient(to right,#c9a84c,rgba(201,168,76,0.2));"></div>

      <!-- Declaration -->
      <div class="declaration">
        Be it known to all who bear witness that <strong>House ${displaySurname}</strong> is hereby formally recognised
        as a family of verified ancestral lineage, heraldic standing, and enduring legacy.
        ${facts.meaning.etymology} ${facts.meaning.historicalContext ? facts.meaning.historicalContext : ""}
      </div>

      <!-- Two-column bottom -->
      <div class="bottom-cols">

        <div class="bottom-left">
          <!-- Migration -->
          <p class="sec">Bloodline Journey</p>
          <table class="wp-table">
            ${waypointRows}
          </table>
          <p class="migration-close">${facts.migration.closingLine}</p>
        </div>

        <div class="bottom-right" style="display:flex;flex-direction:column;gap:3.5mm;">
          <!-- Symbolism -->
          <div>
            <p class="sec">Heraldic Symbolism</p>
            <div class="sym-grid">${symbolismRows}</div>
          </div>

          ${story ? `
          <!-- Chapters -->
          <div>
            <p class="sec">Family Story — 9 Chapters</p>
            <ul class="chapters-list">${chapterTitles}</ul>
          </div>` : ""}
        </div>

      </div>
    </div>
  </div>

  <!-- Footer -->
  <div class="footer">
    <div>
      <img src="${qrSrc}" alt="Legacy QR" style="width:52px;height:52px;display:block;margin-bottom:2mm;" />
      <p class="qr-label" style="margin-bottom:2mm;">VIEW ONLINE</p>
      <div class="sig-line"></div>
      <p class="sig-name">Gregory Osmond</p>
      <p class="sig-title">Founder, AncestorsQR</p>
    </div>
    <div class="brand-center">
      <p class="brand-name">AncestorsQR</p>
      <p class="brand-tagline">✦ &nbsp; Every family has a story worth telling &nbsp; ✦</p>
    </div>
    <div>
      <p class="cert-info">Certificate No. ${certNumber}</p>
      <p class="cert-info">Issued ${issuedDate}</p>
      <p class="cert-info">ancestorsqr.com</p>
    </div>
  </div>

  <script>
    window.onload = function() { setTimeout(function() { window.print(); }, 700); };
  </script>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}
