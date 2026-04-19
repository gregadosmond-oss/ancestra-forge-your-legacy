import { createClient } from "npm:@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const FROM_ADDRESS = "AncestorsQR <legacy@ancestorsqr.com>";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { surname, email } = await req.json();
    if (!surname || !email) {
      return new Response(JSON.stringify({ error: "surname and email required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const normalized = String(surname).trim().toLowerCase();
    console.log("[resend-legacy-email] surname:", normalized, "email:", email);

    const [crestRow, factsRow] = await Promise.all([
      supabase.from("surname_crests").select("image_url").eq("surname", normalized).maybeSingle(),
      supabase.from("surname_facts").select("payload, story_payload").eq("surname", normalized).maybeSingle(),
    ]);

    const crestUrl = (crestRow as any).data?.image_url ?? null;
    const facts = (factsRow as any).data?.payload ?? null;
    const story = (factsRow as any).data?.story_payload ?? null;

    console.log("[resend-legacy-email] crestUrl present:", !!crestUrl, "facts present:", !!facts, "story present:", !!story);

    const displaySurname =
      facts?.displaySurname ??
      String(surname).trim().replace(/\b\w/g, (c: string) => c.toUpperCase());
    const mottoLatin = facts?.mottoLatin ?? null;
    const mottoEnglish = facts?.mottoEnglish ?? null;

    const teaserChapters: string[] = Array.isArray(story?.teaserChapters)
      ? story.teaserChapters.slice(0, 4)
      : Array.isArray(story?.chapters)
        ? story.chapters.slice(1, 5).map((c: any) => c?.title ?? "")
        : [];
    const chapterOneTitle: string =
      story?.chapterOneTitle ??
      story?.chapters?.[0]?.title ??
      "Chapter I — The Beginning";

    const legacyUrl = "https://ancestorsqr.com/my-legacy";

    const crestSection = crestUrl
      ? `<tr><td align="center" style="padding:32px 0;">
          <img src="${crestUrl}" alt="${displaySurname} Family Crest" width="280" style="display:block;width:280px;max-width:280px;border-radius:8px;" />
        </td></tr>`
      : "";

    const mottoBlock = mottoLatin
      ? `<tr><td align="center" style="padding:0 40px 8px;">
           <p style="margin:0;font-size:22px;font-style:italic;color:#e8b85c;font-family:Georgia,serif;">${mottoLatin}</p>
         </td></tr>
         <tr><td align="center" style="padding:0 40px 32px;">
           <p style="margin:0;font-size:11px;letter-spacing:3px;color:#8a7e6e;text-transform:uppercase;font-family:Arial,sans-serif;">${mottoEnglish ?? ""}</p>
         </td></tr>`
      : "";

    const teaserList = teaserChapters
      .map(
        (title, i) =>
          `<li style="margin:0 0 8px;font-style:italic;color:#8a7e6e;font-size:14px;line-height:1.6;opacity:${(1 - i * 0.15).toFixed(2)};">${title}</li>`
      )
      .join("");

    const remaining = Math.max(0, 9 - 1 - teaserChapters.length);
    const remainingLine = remaining > 0
      ? `<p style="margin:16px 0 0;font-size:13px;font-style:italic;color:#8a7e6e;">…and ${remaining} more chapters inside.</p>`
      : "";

    const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>Your Legacy is Ready</title></head>
<body style="margin:0;padding:0;background:#0d0a07;font-family:Georgia,serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0d0a07;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr><td align="center" style="padding:8px 0 24px;">
          <p style="margin:0;font-size:14px;letter-spacing:6px;color:#d4a04a;font-family:Arial,sans-serif;font-weight:700;">ANCESTRA</p>
        </td></tr>
        <tr><td style="padding:0 0 32px;">
          <div style="height:1px;background:linear-gradient(to right, transparent, #3d3020, transparent);"></div>
        </td></tr>
        <tr><td style="background:#1a1510;padding:40px;border-radius:12px;text-align:center;">
          <h1 style="margin:0 0 16px;font-size:28px;color:#f0e8da;font-family:Georgia,serif;font-weight:400;line-height:1.3;">Your Legacy Has Been Forged.</h1>
          <p style="margin:0;font-size:15px;font-style:italic;color:#c4b8a6;line-height:1.7;">Everything you discovered about the ${displaySurname} family is waiting for you.</p>
        </td></tr>
        ${crestSection}
        ${mottoBlock}
        <tr><td style="padding:24px 40px;">
          <p style="margin:0 0 12px;font-size:10px;letter-spacing:4px;color:#a07830;text-transform:uppercase;font-family:Arial,sans-serif;">YOUR FAMILY STORY</p>
          <h2 style="margin:0 0 20px;font-size:20px;color:#e8b85c;font-family:Georgia,serif;font-weight:400;">${chapterOneTitle}</h2>
          <ul style="margin:0;padding:0 0 0 18px;list-style:none;">${teaserList}</ul>
          ${remainingLine}
        </td></tr>
        <tr><td align="center" style="padding:40px;">
          <a href="${legacyUrl}" style="display:inline-block;padding:16px 40px;background:linear-gradient(135deg,#e8943a,#c47828);color:#1a1208;text-decoration:none;font-family:Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;border-radius:60px;">View Your Full Legacy</a>
        </td></tr>
        <tr><td align="center" style="padding:24px 40px 8px;">
          <p style="margin:0 0 8px;font-size:11px;color:#8a7e6e;font-family:Arial,sans-serif;letter-spacing:1px;">One-time purchase · Instant access · No subscription</p>
          <p style="margin:0 0 8px;font-size:11px;color:#8a7e6e;font-family:Georgia,serif;font-style:italic;">© 2026 Ancestra — Every family has a story worth telling.</p>
          <p style="margin:0;font-size:11px;color:#8a7e6e;font-family:Arial,sans-serif;">You're receiving this because you purchased a Legacy Pack.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [email],
        subject: `Your Legacy is Ready, ${displaySurname} Family`,
        html,
      }),
    });

    const responseText = await res.text();
    console.log("[resend-legacy-email] Resend response:", res.status, responseText);

    if (!res.ok) {
      return new Response(JSON.stringify({ error: "Resend send failed", status: res.status, body: responseText }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, sentTo: email, surname: normalized, crestPresent: !!crestUrl, mottoPresent: !!mottoLatin, chaptersIncluded: teaserChapters.length, resend: JSON.parse(responseText) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[resend-legacy-email] error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
