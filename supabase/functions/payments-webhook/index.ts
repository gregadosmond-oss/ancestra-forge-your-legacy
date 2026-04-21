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

interface StripeCheckoutSession {
  id: string;
  mode?: string;
  customer?: string | null;
  customer_email?: string | null;
  customer_details?: { email?: string | null } | null;
  amount_total?: number | null;
  currency?: string | null;
  payment_status?: string | null;
  metadata?: Record<string, string> | null;
}

async function handleCheckoutCompleted(session: StripeCheckoutSession, env: StripeEnv) {
  console.log("Checkout completed:", session.id, "mode:", session.mode);
  console.log("Full session.metadata:", JSON.stringify(session.metadata ?? {}));

  const userId = session.metadata?.user_id || session.metadata?.userId;
  const surname = session.metadata?.surname;
  const metadataEmail = session.metadata?.email;
  const isGift = session.metadata?.isGift === 'true';
  const recipientEmail = session.metadata?.recipientEmail;
  const productType = session.metadata?.productType;
  const shippingAddressRaw = session.metadata?.shippingAddress;
  const buyerEmail = metadataEmail ?? session.customer_details?.email ?? session.customer_email;

  console.log("Parsed metadata — surname:", surname, "user_id:", userId, "email:", buyerEmail, "productType:", productType);

  // Printful physical order — ensure crest exists, then trigger Printful fulfillment
  if (productType && PRINTFUL_VARIANT_MAP[productType] && surname && shippingAddressRaw) {
    console.log("Printful order detected — productType:", productType, "surname:", surname);
    await triggerCrestGeneration(surname);
    await triggerPrintfulOrder({
      productType,
      surname,
      shippingAddress: JSON.parse(shippingAddressRaw),
      buyerEmail,
    });
  }

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

  // Trigger real crest generation server-side — non-fatal if it fails
  // Skip for Printful physical orders (already awaited above)
  if (surname && userId && !(productType && PRINTFUL_VARIANT_IDS[productType])) {
    void triggerCrestGeneration(surname);
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
    await sendBuyerConfirmationEmail({ buyerEmail, surname, userId, sessionId: session.id });
  }
}

// ─── Printful order trigger ──────────────────────────────────────────────────

// Maps productType (set in Stripe checkout metadata) → Printful sync_variant_id.
const PRINTFUL_VARIANT_MAP: Record<string, number> = {
  "heirloom": 5275365052,
  "mug":      5275365052,
  "canvas-8x10":   5275406007,
  "canvas-12x16":  5275406008,
  "canvas-18x24":  5275406009,
  "canvas-24x36":  5275406010,
  "blanket-30x40": 5275420030,
  "blanket-50x60": 5275420031,
  "blanket-60x80": 5275420029,
};

async function triggerPrintfulOrder({ productType, surname, shippingAddress, buyerEmail }: {
  productType: string;
  surname: string;
  shippingAddress: Record<string, string>;
  buyerEmail?: string;
}) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) return;

  const variantId = PRINTFUL_VARIANT_IDS[productType];
  if (!variantId) {
    console.warn("triggerPrintfulOrder: no Printful variant mapped for productType:", productType);
    return;
  }

  const normalized = surname.trim().toLowerCase();
  const legacySlug = normalized.replace(/\s+/g, "-");
  const legacyUrl = `https://ancestorsqr.com/f/${legacySlug}`;

  // Get crest URL from DB
  const { data: crestRow } = await supabase
    .from("surname_crests")
    .select("image_url")
    .eq("surname", normalized)
    .maybeSingle();

  const crestUrl = crestRow?.image_url ?? null;
  if (!crestUrl) {
    console.warn("triggerPrintfulOrder: no crest found for", normalized);
    return;
  }

  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/create-printful-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceKey}` },
      body: JSON.stringify({
        variantId,
        crestUrl,
        shippingAddress,
        customerEmail: buyerEmail,
        legacyUrl,
        surname,
      }),
    });
    const body = await res.json();
    if (body.success) {
      console.log("Printful order created:", body.orderId, "productType:", productType);
    } else {
      console.error("Printful order failed:", body.error);
    }
  } catch (err) {
    console.error("triggerPrintfulOrder threw:", (err as Error).message);
  }
}

// ─── Crest generation trigger ────────────────────────────────────────────────

async function triggerCrestGeneration(surname: string) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    console.warn("triggerCrestGeneration: missing env, skipping");
    return;
  }

  const normalized = surname.trim().toLowerCase();

  // Fetch facts — needed by generate-crest for the prompt
  const { data: factsRow, error: factsError } = await supabase
    .from("surname_facts")
    .select("payload")
    .eq("surname", normalized)
    .maybeSingle();

  if (factsError || !factsRow?.payload) {
    console.warn("triggerCrestGeneration: no facts found for", normalized, factsError?.message);
    return;
  }

  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/generate-crest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ surname: normalized, facts: factsRow.payload }),
    });

    const body = await res.json();
    if (body.code === "OK") {
      console.log("Crest generated for", normalized, body.imageUrl);
    } else {
      console.warn("Crest generation failed for", normalized, body.reason);
    }
  } catch (err) {
    console.warn("triggerCrestGeneration threw:", (err as Error).message);
  }
}

// ─── Buyer confirmation email ────────────────────────────────────────────────

async function sendBuyerConfirmationEmail({
  buyerEmail,
  surname,
  userId,
  sessionId,
}: {
  buyerEmail: string;
  surname?: string;
  userId: string;
  sessionId: string;
}) {
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (!RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not set — skipping buyer confirmation email");
    return;
  }

  // Idempotency — only send once per stripe session
  const { data: existing } = await supabase
    .from("purchases")
    .select("id")
    .eq("stripe_session_id", sessionId)
    .maybeSingle();

  if ((existing as { email_sent?: boolean } | null)?.email_sent === true) {
    console.log("Email already sent for session:", sessionId);
    return;
  }

  const normalized = surname?.trim().toLowerCase() ?? "";
  const [crestRow, factsRow] = await Promise.all([
    normalized
      ? supabase.from("surname_crests").select("image_url").eq("surname", normalized).maybeSingle()
      : Promise.resolve({ data: null }),
    normalized
      ? supabase.from("surname_facts").select("payload, story_payload").eq("surname", normalized).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  type FactsPayload = {
    displaySurname?: string;
    mottoLatin?: string;
    mottoEnglish?: string;
  };
  type StoryPayload = {
    teaserChapters?: string[];
    chapters?: Array<{ title?: string }>;
    chapterOneTitle?: string;
  };
  const crestUrl = (crestRow as { data: { image_url?: string | null } | null }).data?.image_url ?? null;
  const factsData = (factsRow as { data: { payload?: FactsPayload | null; story_payload?: StoryPayload | null } | null }).data;
  const facts = factsData?.payload ?? null;
  const story = factsData?.story_payload ?? null;

  const displaySurname =
    facts?.displaySurname ??
    (surname ? surname.trim().replace(/\b\w/g, (c: string) => c.toUpperCase()) : "Your Family");
  const mottoLatin = facts?.mottoLatin ?? null;
  const mottoEnglish = facts?.mottoEnglish ?? null;

  const teaserChapters: string[] = Array.isArray(story?.teaserChapters)
    ? story.teaserChapters.slice(0, 4)
    : Array.isArray(story?.chapters)
      ? story.chapters.slice(1, 5).map((c: { title?: string }) => c?.title ?? "")
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
      to: [buyerEmail],
      subject: `Your Legacy is Ready, ${displaySurname} Family`,
      html,
    }),
  });

  if (!res.ok) {
    console.error("Failed to send buyer confirmation email:", await res.text());
    return;
  }

  console.log("Buyer confirmation email sent to:", buyerEmail);

  // Best-effort idempotency mark — non-fatal if column does not exist
  await supabase
    .from("purchases")
    .update({ email_sent: true })
    .eq("stripe_session_id", sessionId);
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
