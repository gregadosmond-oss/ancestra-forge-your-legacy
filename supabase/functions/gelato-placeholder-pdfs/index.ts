import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  PDFDocument,
  StandardFonts,
  rgb,
  degrees,
} from "https://esm.sh/pdf-lib@1.17.1";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const MM_TO_PT = 2.83464567;
const mm = (v: number) => v * MM_TO_PT;

const BUCKET = "print-designs";
const INTERIOR_FILENAME = "legacy-book-interior-placeholder.pdf";
const COVER_FILENAME = "legacy-book-cover-placeholder.pdf";

async function buildInteriorPdf(): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);

  const pageWidth = mm(218);
  const pageHeight = mm(288);
  const totalPages = 40;

  for (let i = 1; i <= totalPages; i++) {
    const page = pdf.addPage([pageWidth, pageHeight]);

    // Top center: HOUSE OF OSMOND @ 18pt, ~30mm from top
    const topText = "HOUSE OF OSMOND";
    const topSize = 18;
    const topWidth = font.widthOfTextAtSize(topText, topSize);
    page.drawText(topText, {
      x: (pageWidth - topWidth) / 2,
      y: pageHeight - mm(30) - topSize,
      size: topSize,
      font,
      color: rgb(0, 0, 0),
    });

    // Middle center
    const midText = `Placeholder interior — page ${i} of ${totalPages}`;
    const midSize = 12;
    const midWidth = font.widthOfTextAtSize(midText, midSize);
    page.drawText(midText, {
      x: (pageWidth - midWidth) / 2,
      y: pageHeight / 2 - midSize / 2,
      size: midSize,
      font,
      color: rgb(0, 0, 0),
    });

    // Bottom center: N / 40 @ 10pt, ~20mm from bottom
    const botText = `${i} / ${totalPages}`;
    const botSize = 10;
    const botWidth = font.widthOfTextAtSize(botText, botSize);
    page.drawText(botText, {
      x: (pageWidth - botWidth) / 2,
      y: mm(20),
      size: botSize,
      font,
      color: rgb(0, 0, 0),
    });
  }

  return await pdf.save();
}

async function buildCoverPdf(): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);

  const pageWidth = mm(464.4);
  const pageHeight = mm(325.4);
  const page = pdf.addPage([pageWidth, pageHeight]);

  // BACK COVER panel: x 20..221.2 mm, y 20..305.4 mm
  const backX1 = mm(20);
  const backX2 = mm(221.2);
  const backY1 = mm(20);
  const backY2 = mm(305.4);
  const backText = "BACK COVER";
  const backSize = 24;
  const backWidth = font.widthOfTextAtSize(backText, backSize);
  page.drawText(backText, {
    x: (backX1 + backX2) / 2 - backWidth / 2,
    y: (backY1 + backY2) / 2 - backSize / 2,
    size: backSize,
    font,
    color: rgb(0, 0, 0),
  });

  // SPINE panel: x 229.2..235.2 mm, full height; rotated 90deg
  const spineX1 = mm(229.2);
  const spineX2 = mm(235.2);
  const spineCenterX = (spineX1 + spineX2) / 2;
  const spineCenterY = pageHeight / 2;
  const spineText = "SPINE";
  const spineSize = 10;
  const spineWidth = font.widthOfTextAtSize(spineText, spineSize);
  // When rotated 90deg counter-clockwise, the text baseline runs upward.
  // To center: shift x by +spineSize/2 (height offset), y by -spineWidth/2.
  page.drawText(spineText, {
    x: spineCenterX - spineSize / 2,
    y: spineCenterY - spineWidth / 2,
    size: spineSize,
    font,
    color: rgb(0, 0, 0),
    rotate: degrees(90),
  });

  // FRONT COVER panel: x 243.2..444.4 mm, y 20..305.4 mm
  const frontX1 = mm(243.2);
  const frontX2 = mm(444.4);
  const frontY1 = mm(20);
  const frontY2 = mm(305.4);
  const frontText = "FRONT COVER - HOUSE OF OSMOND";
  const frontSize = 24;
  const frontWidth = font.widthOfTextAtSize(frontText, frontSize);
  page.drawText(frontText, {
    x: (frontX1 + frontX2) / 2 - frontWidth / 2,
    y: (frontY1 + frontY2) / 2 - frontSize / 2,
    size: frontSize,
    font,
    color: rgb(0, 0, 0),
  });

  return await pdf.save();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify(
          {
            ok: false,
            error: "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set",
          },
          null,
          2,
        ),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const interiorBytes = await buildInteriorPdf();
    const coverBytes = await buildCoverPdf();

    const { error: interiorErr } = await supabase.storage
      .from(BUCKET)
      .upload(INTERIOR_FILENAME, interiorBytes, {
        upsert: true,
        contentType: "application/pdf",
      });
    if (interiorErr) throw new Error(`Interior upload: ${interiorErr.message}`);

    const { error: coverErr } = await supabase.storage
      .from(BUCKET)
      .upload(COVER_FILENAME, coverBytes, {
        upsert: true,
        contentType: "application/pdf",
      });
    if (coverErr) throw new Error(`Cover upload: ${coverErr.message}`);

    const interiorUrl = supabase.storage
      .from(BUCKET)
      .getPublicUrl(INTERIOR_FILENAME).data.publicUrl;
    const coverUrl = supabase.storage
      .from(BUCKET)
      .getPublicUrl(COVER_FILENAME).data.publicUrl;

    return new Response(
      JSON.stringify(
        {
          ok: true,
          interiorUrl,
          coverUrl,
        },
        null,
        2,
      ),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    return new Response(
      JSON.stringify(
        { ok: false, error: (err as Error).message },
        null,
        2,
      ),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
