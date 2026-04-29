// Send welcome email via Resend for AncestorsQR
// Public endpoint — verify_jwt = false in supabase/config.toml

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const escapeHtml = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const buildPlaintext = (firstName: string) => `Hi ${firstName},

You just stepped into something most people never do — looking back.

Every family has a story worth telling. Names that crossed oceans. Hands that built things we still use. Hardships we'll never know, and triumphs that quietly shaped who we are today.

Yours is in there. Waiting to be found.

Here's what you can do right now (it takes 5 minutes):

- Discover the meaning behind your surname
- Forge your family's coat of arms
- Read your AI-written family story
- See your migration path across the world

Every free tool ends with a story worth sharing.

Begin your journey: https://ancestorsqr.com/journey/1

If you've already started — keep going. If you've finished — share your crest with someone who needs to see it.

— Greg
Founder, AncestorsQR
`;

const buildHtml = (firstName: string) => {
  const name = escapeHtml(firstName);
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Your story is waiting</title>
<style>
  body { margin:0; padding:0; background-color:#f5f0e6; }
  .wrap { width:100%; background-color:#f5f0e6; padding:32px 16px; }
  .container { max-width:600px; margin:0 auto; background-color:#f5f0e6; }
  .wordmark { text-align:center; padding:8px 0 32px; font-family: 'Plus Jakarta Sans', Helvetica, Arial, sans-serif; font-size:14px; letter-spacing:0.2em; color:#c9a86b; font-weight:600; }
  .card { background-color:#ffffff; border-radius:12px; padding:40px 32px; box-shadow: 0 2px 16px rgba(26,20,16,0.06); }
  h1 { font-family: 'Lora', Georgia, serif; font-style: italic; font-weight: 500; font-size:28px; line-height:1.25; color:#1a1410; margin:0 0 20px; }
  p, li { font-family: 'Plus Jakarta Sans', Helvetica, Arial, sans-serif; font-size:16px; line-height:1.65; color:#1a1410; margin:0 0 16px; }
  ul { padding-left: 20px; margin: 0 0 20px; }
  li { margin: 0 0 8px; }
  .cta-wrap { text-align:center; padding: 24px 0 8px; }
  .cta { display:inline-block; background-color:#c9a86b; color:#1a1410 !important; text-decoration:none; padding:16px 36px; border-radius:8px; font-family: 'Plus Jakarta Sans', Helvetica, Arial, sans-serif; font-weight:700; font-size:14px; letter-spacing:0.12em; text-transform:uppercase; }
  .signoff-name { font-family: 'Lora', Georgia, serif; font-style: italic; font-size:20px; color:#1a1410; margin: 28px 0 4px; }
  .signoff-meta { font-family: 'Plus Jakarta Sans', Helvetica, Arial, sans-serif; font-size:12px; letter-spacing:0.12em; text-transform:uppercase; color:#6b5d4f; margin: 0 0 4px; }
  .footer { text-align:center; padding: 28px 16px 8px; font-family: 'Plus Jakarta Sans', Helvetica, Arial, sans-serif; font-size:12px; color:#8a7e6e; line-height:1.6; }
  @media (max-width: 480px) {
    .card { padding: 28px 20px; }
    h1 { font-size: 24px; }
  }
</style>
</head>
<body>
  <div class="wrap">
    <div class="container">
      <div class="wordmark">ANCESTORSQR</div>
      <div class="card">
        <h1>Hi ${name}, your story is waiting.</h1>
        <p>You just stepped into something most people never do — looking back.</p>
        <p>Every family has a story worth telling. Names that crossed oceans. Hands that built things we still use. Hardships we'll never know, and triumphs that quietly shaped who we are today.</p>
        <p>Yours is in there. Waiting to be found.</p>
        <p><strong>Here's what you can do right now (it takes 5 minutes):</strong></p>
        <ul>
          <li>Discover the meaning behind your surname</li>
          <li>Forge your family's coat of arms</li>
          <li>Read your AI-written family story</li>
          <li>See your migration path across the world</li>
        </ul>
        <p>Every free tool ends with a story worth sharing.</p>
        <div class="cta-wrap">
          <a href="https://ancestorsqr.com/journey/1" class="cta">Begin Your Journey</a>
        </div>
        <p style="margin-top:20px;">If you've already started — keep going. If you've finished — share your crest with someone who needs to see it.</p>
        <div class="signoff-name">— Greg</div>
        <div class="signoff-meta">Founder, AncestorsQR</div>
        <div class="signoff-meta">ancestorsqr.com</div>
      </div>
      <div class="footer">
        AncestorsQR · Playa del Carmen, Mexico<br/>
        You're receiving this because you signed up at ancestorsqr.com
      </div>
    </div>
  </div>
</body>
</html>`;
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json(405, { success: false, error: "Method not allowed" });
  }

  try {
    const apiKey = Deno.env.get("RESEND_API_KEY");
    if (!apiKey) {
      console.error("[send-welcome-email] FAILED: RESEND_API_KEY missing");
      return json(500, { success: false, error: "Email not configured" });
    }

    const body = await req.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const firstNameRaw =
      typeof body.first_name === "string" ? body.first_name.trim() : "";
    const source = typeof body.source === "string" ? body.source : "unknown";

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json(400, { success: false, error: "Invalid email" });
    }

    const firstName =
      firstNameRaw && firstNameRaw.length > 0
        ? firstNameRaw
        : email.split("@")[0] || "friend";

    console.log("[send-welcome-email] received request for:", email, "source:", source);

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Greg Osmond <greg@ancestorsqr.com>",
        to: [email],
        reply_to: "greg@ancestorsqr.com",
        subject: "Your story is waiting",
        html: buildHtml(firstName),
        text: buildPlaintext(firstName),
      }),
    });

    const responseBody = await resendRes.text();
    console.log(
      "[send-welcome-email] Resend response status:",
      resendRes.status,
      "body:",
      responseBody,
    );

    if (!resendRes.ok) {
      console.error(
        "[send-welcome-email] FAILED:",
        JSON.stringify({ status: resendRes.status, body: responseBody }),
      );
      return json(502, {
        success: false,
        error: `Resend error ${resendRes.status}: ${responseBody}`,
      });
    }

    let parsed: { id?: string } = {};
    try {
      parsed = JSON.parse(responseBody);
    } catch {
      /* ignore */
    }

    return json(200, { success: true, id: parsed.id ?? null });
  } catch (err) {
    console.error(
      "[send-welcome-email] FAILED:",
      JSON.stringify({ message: (err as Error)?.message, stack: (err as Error)?.stack }),
    );
    return json(500, {
      success: false,
      error: (err as Error)?.message ?? "Unknown error",
    });
  }
});
