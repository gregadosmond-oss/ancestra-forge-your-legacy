import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      recipientEmail,
      surname,
      facts,
      chapterOneTitle,
      chapterOneBody,
      crestUrl,
    } = await req.json();

    if (!recipientEmail || typeof recipientEmail !== "string" || !recipientEmail.includes("@")) {
      return new Response(JSON.stringify({ error: "Valid recipientEmail is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!surname || typeof surname !== "string") {
      return new Response(JSON.stringify({ error: "surname is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: "Email service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const html = buildPreviewEmail({ surname, facts, chapterOneTitle, chapterOneBody, crestUrl });

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "AncestorsQR <legacy@ancestorsqr.com>",
        to: [recipientEmail],
        subject: `The ${surname} Family Legacy`,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Resend error: ${err}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function buildPreviewEmail({
  surname,
  facts,
  chapterOneTitle,
  chapterOneBody,
  crestUrl,
}: {
  surname: string;
  facts?: { meaning?: { role?: string; origin?: string }; mottoEnglish?: string; mottoLatin?: string };
  chapterOneTitle?: string;
  chapterOneBody?: string;
  crestUrl?: string;
}): string {
  const bodyPreview = chapterOneBody ? chapterOneBody.slice(0, 420) + (chapterOneBody.length > 420 ? "…" : "") : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>The ${surname} Family Legacy</title>
</head>
<body style="margin:0;padding:0;background:#0d0a07;font-family:Georgia,serif;">
  <div style="max-width:600px;margin:0 auto;background:#13100b;border:1px solid #3d3020;">

    <!-- Header -->
    <div style="padding:48px 40px 32px;text-align:center;border-bottom:1px solid #3d3020;">
      <p style="margin:0 0 16px;font-size:11px;letter-spacing:4px;color:#a07830;text-transform:uppercase;font-family:Arial,sans-serif;">AN ANCESTORSQR ORIGINAL</p>
      <h1 style="margin:0 0 12px;font-size:38px;color:#f0e8da;font-weight:400;line-height:1.2;">The ${surname} Legacy</h1>
      <p style="margin:0;font-size:16px;font-style:italic;color:#c4b8a6;">Someone thought you should see this.</p>
    </div>

    ${crestUrl ? `
    <!-- Crest -->
    <div style="padding:32px 40px;text-align:center;border-bottom:1px solid #3d3020;">
      <img src="${crestUrl}" alt="${surname} Coat of Arms" width="180" style="max-width:180px;border-radius:8px;" />
    </div>
    ` : ""}

    ${facts ? `
    <!-- Surname Facts -->
    <div style="padding:32px 40px;border-bottom:1px solid #3d3020;">
      <p style="margin:0 0 10px;font-size:10px;letter-spacing:4px;color:#a07830;text-transform:uppercase;font-family:Arial,sans-serif;">YOUR SURNAME</p>
      ${facts.meaning?.role ? `<p style="margin:0 0 8px;font-size:15px;color:#d0c4b4;"><strong style="color:#e8ddd0;">${facts.meaning.role}</strong></p>` : ""}
      ${facts.meaning?.origin ? `<p style="margin:0 0 8px;font-size:14px;color:#c4b8a6;">Origin: <strong style="color:#d0c4b4;">${facts.meaning.origin}</strong></p>` : ""}
      ${facts.mottoLatin ? `<p style="margin:12px 0 0;font-size:15px;font-style:italic;color:#d4a04a;">"${facts.mottoLatin}" — ${facts.mottoEnglish || ""}</p>` : ""}
    </div>
    ` : ""}

    ${chapterOneTitle ? `
    <!-- Story Preview -->
    <div style="padding:32px 40px;border-bottom:1px solid #3d3020;">
      <p style="margin:0 0 10px;font-size:10px;letter-spacing:4px;color:#a07830;text-transform:uppercase;font-family:Arial,sans-serif;">CHAPTER I</p>
      <h3 style="margin:0 0 16px;font-size:20px;color:#e8ddd0;font-weight:400;">${chapterOneTitle}</h3>
      ${bodyPreview ? `<p style="margin:0;font-size:15px;line-height:1.75;color:#c4b8a6;">${bodyPreview}</p>` : ""}
    </div>
    ` : ""}

    <!-- CTA -->
    <div style="padding:40px;text-align:center;">
      <p style="margin:0 0 8px;font-size:16px;color:#d0c4b4;">Every family has a story worth telling.</p>
      <p style="margin:0 0 28px;font-size:14px;font-style:italic;color:#8a7e6e;">Discover yours in five minutes.</p>
      <a href="https://ancestorsqr.com/journey" style="display:inline-block;padding:16px 40px;background:linear-gradient(135deg,#e8943a,#c47828);color:#1a1208;text-decoration:none;font-family:Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;border-radius:60px;">
        Discover My Legacy
      </a>
      <p style="margin:28px 0 0;font-size:11px;color:#8a7e6e;font-family:Arial,sans-serif;">Forged by AncestorsQR &nbsp;·&nbsp; ancestorsqr.com</p>
    </div>

  </div>
</body>
</html>`;
}
