import type { LegacyFacts, LegacyStory } from "@/types/legacy";

interface CertificateData {
  facts: LegacyFacts;
  story: LegacyStory | null;
  crestUrl: string | null;
}

export function generateCertificate({ facts, story, crestUrl }: CertificateData): void {
  const displaySurname = facts.displaySurname;
  const certNumber = `ANCESTRA-${Date.now().toString(36).toUpperCase().slice(-8)}`;
  const issuedDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const chapterTitles = story
    ? [story.chapterOneTitle, ...story.teaserChapters]
        .map((t, i) => `<li style="margin-bottom:4px;color:${i === 0 ? "#8b6914" : "#7a6040"};">${t.replace(/\*\*/g, "").replace(/\*/g, "")}</li>`)
        .join("")
    : "";

  const crestSection = crestUrl
    ? `<img src="${crestUrl}" alt="${displaySurname} Crest" style="width:180px;height:auto;display:block;margin:0 auto;" />`
    : `<div style="width:180px;height:180px;margin:0 auto;border:2px solid #c9a84c;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:48px;">🛡</div>`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>House ${displaySurname} — Legacy Certificate</title>
  <link href="https://fonts.googleapis.com/css2?family=Libre+Caslon+Display&family=Libre+Caslon+Text:ital@0;1&family=DM+Sans:wght@400;600&display=swap" rel="stylesheet" />
  <style>
    @page {
      size: A4 landscape;
      margin: 0;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: 297mm;
      height: 210mm;
      background: #fdf8f0;
      font-family: 'Libre Caslon Text', Georgia, serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* Outer border frame */
    .frame {
      position: absolute;
      inset: 8mm;
      border: 2px solid #c9a84c;
      background: #fdf8f0;
    }
    .frame-inner {
      position: absolute;
      inset: 4mm;
      border: 1px solid rgba(201,168,76,0.4);
    }

    /* Corner ornaments */
    .corner {
      position: absolute;
      width: 18mm;
      height: 18mm;
      border-color: #c9a84c;
      border-style: solid;
    }
    .corner-tl { top: -1px; left: -1px; border-width: 2px 0 0 2px; }
    .corner-tr { top: -1px; right: -1px; border-width: 2px 2px 0 0; }
    .corner-bl { bottom: -1px; left: -1px; border-width: 0 0 2px 2px; }
    .corner-br { bottom: -1px; right: -1px; border-width: 0 2px 2px 0; }

    /* Layout */
    .content {
      position: absolute;
      inset: 12mm;
      display: flex;
      gap: 10mm;
      align-items: flex-start;
    }

    /* Left column */
    .left {
      flex: 0 0 52mm;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6mm;
      padding-top: 4mm;
    }

    /* Right column */
    .right {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4mm;
    }

    /* Typography */
    .label {
      font-family: 'DM Sans', Arial, sans-serif;
      font-size: 7pt;
      font-weight: 600;
      letter-spacing: 3px;
      text-transform: uppercase;
      color: #a07830;
    }
    .house-name {
      font-family: 'Libre Caslon Display', Georgia, serif;
      font-size: 34pt;
      color: #2c1e08;
      line-height: 1;
      letter-spacing: 1px;
    }
    .motto-latin {
      font-family: 'Libre Caslon Text', Georgia, serif;
      font-style: italic;
      font-size: 13pt;
      color: #8b6914;
      line-height: 1.3;
    }
    .motto-english {
      font-family: 'DM Sans', Arial, sans-serif;
      font-size: 7pt;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: #a07830;
    }
    .body-text {
      font-family: 'Libre Caslon Text', Georgia, serif;
      font-size: 9pt;
      color: #4a3820;
      line-height: 1.7;
    }
    .divider {
      width: 100%;
      height: 1px;
      background: linear-gradient(to right, transparent, #c9a84c, transparent);
      margin: 2mm 0;
    }
    .section-title {
      font-family: 'DM Sans', Arial, sans-serif;
      font-size: 7pt;
      font-weight: 600;
      letter-spacing: 3px;
      text-transform: uppercase;
      color: #a07830;
      margin-bottom: 3mm;
    }
    .chapters-list {
      list-style: none;
      padding: 0;
      columns: 2;
      column-gap: 5mm;
      font-family: 'Libre Caslon Text', Georgia, serif;
      font-size: 7.5pt;
      line-height: 1.6;
    }
    .footer {
      position: absolute;
      bottom: 13mm;
      left: 0;
      right: 0;
      padding: 0 14mm;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .footer-brand {
      font-family: 'Libre Caslon Display', Georgia, serif;
      font-size: 9pt;
      color: #a07830;
      letter-spacing: 2px;
      text-transform: uppercase;
    }
    .footer-cert {
      font-family: 'DM Sans', Arial, sans-serif;
      font-size: 6.5pt;
      color: #a07830;
      letter-spacing: 1px;
      text-align: right;
    }
    .sig-line {
      width: 40mm;
      height: 1px;
      background: #c9a84c;
      margin-bottom: 1mm;
    }
    .sig-name {
      font-family: 'Libre Caslon Text', Georgia, serif;
      font-style: italic;
      font-size: 7.5pt;
      color: #6b4e1a;
    }
    .sig-title {
      font-family: 'DM Sans', Arial, sans-serif;
      font-size: 6pt;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: #a07830;
    }

    @media print {
      body { margin: 0; }
    }
  </style>
</head>
<body>

  <!-- Outer frame -->
  <div class="frame">
    <div class="frame-inner">
      <div class="corner corner-tl"></div>
      <div class="corner corner-tr"></div>
      <div class="corner corner-bl"></div>
      <div class="corner corner-br"></div>
    </div>
  </div>

  <!-- Main content -->
  <div class="content">

    <!-- Left: crest + motto -->
    <div class="left">
      <p class="label">Coat of Arms</p>
      ${crestSection}
      <div class="divider" style="width:40mm;"></div>
      <p class="motto-latin" style="text-align:center;">"${facts.mottoLatin}"</p>
      <p class="motto-english" style="text-align:center;">${facts.mottoEnglish}</p>

      <div style="margin-top:2mm;text-align:center;">
        <p style="font-family:'DM Sans',Arial,sans-serif;font-size:6.5pt;color:#a07830;letter-spacing:1.5px;text-transform:uppercase;">${facts.meaning.origin}</p>
      </div>
    </div>

    <!-- Right: text content -->
    <div class="right">
      <!-- Header -->
      <div>
        <p class="label" style="margin-bottom:2mm;">Legacy Certificate</p>
        <p class="house-name">House ${displaySurname}</p>
      </div>

      <div class="divider"></div>

      <!-- Declaration -->
      <p class="body-text">
        This certificate formally documents the ancestral lineage, heraldic identity, and family legacy of
        <strong style="color:#2c1e08;">House ${displaySurname}</strong>.
        The name originates from <em>${facts.meaning.origin}</em>, where these people served as
        <em>${facts.meaning.role}</em>. ${facts.meaning.etymology}.
      </p>

      <!-- Migration -->
      <div>
        <p class="section-title">Bloodline Journey</p>
        <p class="body-text">
          ${facts.migration.waypoints.map(w => `${w.region} (${w.century})`).join(" → ")}
        </p>
        <p style="font-family:'Libre Caslon Text',Georgia,serif;font-style:italic;font-size:8pt;color:#7a6040;margin-top:1.5mm;">
          ${facts.migration.closingLine}
        </p>
      </div>

      <!-- Symbolism -->
      <div>
        <p class="section-title">Heraldic Symbolism</p>
        <p class="body-text">
          ${facts.symbolism.map(s => `<strong style="color:#5a3e10;">${s.element}</strong> — ${s.meaning}`).join(" &nbsp;·&nbsp; ")}
        </p>
      </div>

      ${story ? `
      <!-- Chapters -->
      <div>
        <p class="section-title">Your Family Story — 9 Chapters</p>
        <ul class="chapters-list">
          ${chapterTitles}
        </ul>
      </div>
      ` : ""}
    </div>
  </div>

  <!-- Footer -->
  <div class="footer">
    <div>
      <div class="sig-line"></div>
      <p class="sig-name">Gregory Osmond</p>
      <p class="sig-title">Founder, AncestorsQR</p>
    </div>

    <div style="text-align:center;">
      <p class="footer-brand">AncestorsQR</p>
      <p style="font-family:'DM Sans',Arial,sans-serif;font-size:6pt;color:#c9a84c;letter-spacing:1px;margin-top:1mm;">
        ✦ &nbsp; An Ancestra Original &nbsp; ✦
      </p>
    </div>

    <div style="text-align:right;">
      <p class="footer-cert">Certificate No. ${certNumber}</p>
      <p class="footer-cert" style="margin-top:1mm;">Issued ${issuedDate}</p>
      <p class="footer-cert" style="margin-top:1mm;">ancestorsqr.com</p>
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 600);
    };
  </script>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}
