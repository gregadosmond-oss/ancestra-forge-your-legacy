import { createClient } from "npm:@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { type StripeEnv, verifyWebhook } from "../_shared/stripe.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const FROM_ADDRESS = "AncestorsQR <legacy@ancestorsqr.com>";

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const url = new URL(req.url);
  const env = (url.searchParams.get('env') || 'sandbox') as StripeEnv;

  try {
    const event = await verifyWebhook(req, env);
    console.log("Received event:", event.type, "env:", env);

    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object, env);
        break;
      default:
        console.log("Unhandled event:", event.type);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Webhook error:", e);
    return new Response("Webhook error", { status: 400 });
  }
});

async function handleCheckoutCompleted(session: any, env: StripeEnv) {
  console.log("Checkout completed:", session.id, "mode:", session.mode);

  const userId = session.metadata?.userId;
  const isGift = session.metadata?.isGift === 'true';
  const recipientEmail = session.metadata?.recipientEmail;
  const surname = session.metadata?.surname;
  const buyerEmail = session.customer_details?.email ?? session.customer_email;

  if (!userId) {
    console.log("No userId in session metadata — anonymous purchase");
    return;
  }

  // Record the purchase so the app can unlock content
  const { error } = await supabase.from("purchases").upsert(
    {
      user_id: userId,
      stripe_session_id: session.id,
      stripe_customer_id: session.customer,
      amount_total: session.amount_total,
      currency: session.currency,
      status: session.payment_status,
      environment: env,
    },
    { onConflict: "stripe_session_id" }
  );

  if (error) {
    console.error("Failed to record purchase:", error);
  } else {
    console.log("Purchase recorded for user:", userId);
  }

  // Save surname to profile so MyLegacy page can load it later
  if (surname && userId) {
    const normalized = surname.trim().toLowerCase();
    const displaySurname = surname.trim().replace(/\b\w/g, (c: string) => c.toUpperCase());
    const { error: profileError } = await supabase.from("profiles").upsert(
      { id: userId, surname: normalized },
      { onConflict: "id" }
    );
    if (profileError) {
      console.error("Failed to save surname to profile:", profileError);
    } else {
      console.log("Surname saved to profile:", displaySurname);
    }
  }

  if (isGift && recipientEmail) {
    // Gift purchase — notify the recipient
    const { data: gift, error: giftError } = await supabase
      .from("gifts")
      .insert({
        user_id: userId,
        recipient_email: recipientEmail,
        surname: surname ?? "",
        status: "delivered",
      })
      .select("id")
      .single();

    if (giftError) {
      console.error("Failed to record gift:", giftError);
    } else {
      console.log("Gift recorded:", gift?.id);
      await sendGiftEmail({ recipientEmail, surname, giftId: gift?.id });
    }
  } else if (buyerEmail) {
    // Regular purchase — send confirmation to buyer
    await sendBuyerConfirmationEmail({ buyerEmail, surname, userId });
  }
}

// ─── Buyer confirmation email ────────────────────────────────────────────────

async function sendBuyerConfirmationEmail({
  buyerEmail,
  surname,
  userId,
}: {
  buyerEmail: string;
  surname?: string;
  userId: string;
}) {
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (!RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not set — skipping buyer confirmation email");
    return;
  }

  // Pull crest URL and motto from DB
  const normalized = surname?.trim().toLowerCase() ?? "";
  const [crestRow, factsRow] = await Promise.all([
    normalized
      ? supabase
          .from("surname_crests")
          .select("image_url")
          .eq("surname", normalized)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    normalized
      ? supabase
          .from("surname_facts")
          .select("payload")
          .eq("surname", normalized)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const crestUrl = (crestRow as any).data?.image_url ?? null;
  const facts = (factsRow as any).data?.payload ?? null;
  const displaySurname = facts?.displaySurname ?? surname ?? "Your Family";
  const mottoLatin = facts?.mottoLatin ?? null;
  const mottoEnglish = facts?.mottoEnglish ?? null;
  const journeyUrl = "https://ancestorsqr.com/my-legacy";

  const crestSection = crestUrl
    ? `<div style="text-align:center;padding:32px 40px;border-bottom:1px solid #3d3020;">
        <img src="${crestUrl}" alt="${displaySurname} Crest" width="220" style="max-width:220px;display:inline-block;" />
      </div>`
    : "";

  const mottoSection = mottoLatin
    ? `<p style="margin:0 0 6px;font-size:20px;font-style:italic;color:#e8b85c;">${mottoLatin}</p>
       <p style="margin:0;font-size:11px;letter-spacing:3px;color:#a07830;text-transform:uppercase;font-family:Arial,sans-serif;">${mottoEnglish}</p>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>Your Legacy is Ready</title></head>
<body style="margin:0;padding:0;background:#0d0a07;font-family:Georgia,serif;">
  <div style="max-width:600px;margin:0 auto;background:#13100b;border:1px solid #3d3020;">

    <div style="padding:48px 40px 32px;text-align:center;border-bottom:1px solid #3d3020;">
      <p style="margin:0 0 16px;font-size:11px;letter-spacing:4px;color:#a07830;text-transform:uppercase;font-family:Arial,sans-serif;">YOUR LEGACY IS READY</p>
      <h1 style="margin:0 0 12px;font-size:38px;color:#f0e8da;font-weight:400;line-height:1.2;">House ${displaySurname}</h1>
      ${mottoSection}
    </div>

    ${crestSection}

    <div style="padding:32px 40px;border-bottom:1px solid #3d3020;">
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#d0c4b4;">Your Legacy Pack includes:</p>
      <ul style="margin:0;padding:0 0 0 20px;color:#c4b8a6;font-size:14px;line-height:2.2;">
        <li>Custom ${displaySurname} Coat of Arms (high-res PNG)</li>
        <li>AI-written family story — 9 chapters</li>
        <li>Full migration history &amp; ancestry</li>
        <li>Family motto in Latin &amp; English</li>
        <li>Heraldic symbolism breakdown</li>
      </ul>
    </div>

    <div style="padding:40px;text-align:center;">
      <p style="margin:0 0 28px;font-size:16px;font-style:italic;color:#c4b8a6;line-height:1.7;">
        Every family has a story worth telling.<br>Yours has been forged.
      </p>
      <a href="${journeyUrl}" style="display:inline-block;padding:16px 40px;background:linear-gradient(135deg,#e8943a,#c47828);color:#1a1208;text-decoration:none;font-family:Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;border-radius:60px;">
        View Your Legacy
      </a>
      <p style="margin:32px 0 0;font-size:11px;color:#8a7e6e;font-family:Arial,sans-serif;line-height:1.8;">
        Forged by AncestorsQR &nbsp;·&nbsp; ancestorsqr.com<br>
        Questions? Reply to this email.
      </p>
    </div>

  </div>
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
      to: [buyerEmail],
      subject: `Your ${displaySurname} Legacy Pack is ready`,
      html,
    }),
  });

  if (!res.ok) {
    console.error("Failed to send buyer confirmation email:", await res.text());
  } else {
    console.log("Buyer confirmation email sent to:", buyerEmail);
  }
}

// ─── Gift notification email ─────────────────────────────────────────────────

async function sendGiftEmail({
  recipientEmail,
  surname,
  giftId,
}: {
  recipientEmail: string;
  surname?: string;
  giftId?: string;
}) {
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (!RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not set — skipping gift email");
    return;
  }

  const surnameLabel = surname ? `the ${surname} ` : "";
  const claimUrl = giftId
    ? `https://ancestorsqr.com/gift/${giftId}`
    : "https://ancestorsqr.com/journey";
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&color=d4a04a&bgcolor=13100b&data=${encodeURIComponent(claimUrl)}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>A Legacy Gift for You</title></head>
<body style="margin:0;padding:0;background:#0d0a07;font-family:Georgia,serif;">
  <div style="max-width:600px;margin:0 auto;background:#13100b;border:1px solid #3d3020;">
    <div style="padding:48px 40px 32px;text-align:center;border-bottom:1px solid #3d3020;">
      <p style="margin:0 0 16px;font-size:11px;letter-spacing:4px;color:#a07830;text-transform:uppercase;font-family:Arial,sans-serif;">A GIFT FOR YOU</p>
      <h1 style="margin:0 0 12px;font-size:36px;color:#f0e8da;font-weight:400;line-height:1.2;">Someone sent you a Legacy Pack</h1>
      <p style="margin:0;font-size:16px;font-style:italic;color:#c4b8a6;">They want you to discover ${surnameLabel}family history.</p>
    </div>
    <div style="padding:32px 40px;border-bottom:1px solid #3d3020;">
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#d0c4b4;">Your gift includes:</p>
      <ul style="margin:0;padding:0 0 0 20px;color:#c4b8a6;font-size:14px;line-height:2;">
        <li>Custom ${surnameLabel}Coat of Arms (high-res)</li>
        <li>AI-written family story (9 chapters)</li>
        <li>Visual family tree</li>
        <li>Legacy certificate</li>
        <li>Ancestor chat</li>
      </ul>
    </div>
    <div style="padding:40px;text-align:center;">
      <p style="margin:0 0 28px;font-size:15px;font-style:italic;color:#c4b8a6;">Every family has a story worth telling.</p>
      <a href="${claimUrl}" style="display:inline-block;padding:16px 40px;background:linear-gradient(135deg,#e8943a,#c47828);color:#1a1208;text-decoration:none;font-family:Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;border-radius:60px;">
        Claim Your Legacy
      </a>
      <div style="margin-top:36px;padding-top:32px;border-top:1px solid #3d3020;">
        <p style="margin:0 0 14px;font-size:11px;letter-spacing:3px;color:#a07830;text-transform:uppercase;font-family:Arial,sans-serif;">Or scan to open on your phone</p>
        <img src="${qrUrl}" alt="Scan to claim your legacy" width="160" height="160" style="display:inline-block;border:2px solid #3d3020;border-radius:8px;" />
      </div>
      <p style="margin:28px 0 0;font-size:11px;color:#8a7e6e;font-family:Arial,sans-serif;">Forged by AncestorsQR &nbsp;·&nbsp; ancestorsqr.com</p>
    </div>
  </div>
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
      to: [recipientEmail],
      subject: `You've received a ${surnameLabel}Legacy Pack`,
      html,
    }),
  });

  if (!res.ok) {
    console.error("Failed to send gift email:", await res.text());
  } else {
    console.log("Gift email sent to:", recipientEmail);
  }
}
