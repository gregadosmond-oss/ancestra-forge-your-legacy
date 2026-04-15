import { createClient } from "npm:@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { type StripeEnv, verifyWebhook } from "../_shared/stripe.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

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

  // Handle gift: record in gifts table + send gift notification email
  if (isGift && recipientEmail) {
    const { data: gift, error: giftError } = await supabase
      .from("gifts")
      .insert({
        sender_user_id: userId,
        recipient_email: recipientEmail,
        surname: surname || null,
        stripe_session_id: session.id,
        status: "delivered",
        delivered_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (giftError) {
      console.error("Failed to record gift:", giftError);
    } else {
      console.log("Gift recorded:", gift?.id);
      await sendGiftEmail({ recipientEmail, surname, giftId: gift?.id });
    }
  }
}

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
    ? `https://ancestra.com/gift/${giftId}`
    : "https://ancestra.com/journey";

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
      <p style="margin:28px 0 0;font-size:11px;color:#8a7e6e;font-family:Arial,sans-serif;">Forged by Ancestra &nbsp;·&nbsp; ancestra.com</p>
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
      from: "Ancestra <legacy@ancestra.com>",
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
