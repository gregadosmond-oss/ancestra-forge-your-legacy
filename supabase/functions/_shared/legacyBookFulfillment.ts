// Shared helper used by payments-webhook (Stripe webhook path) and
// confirm-book-order (return-page fallback). Awaits the full fulfillment
// chain: render interior PDF → render cover PDF → submit to Gelato → update
// the legacy_book_orders row to "submitted" with gelato_order_id. On ANY
// failure the row is updated to "failed" with a readable fulfillment_error
// (never silently left at "pending"). Idempotent on stripe_session_id.
import { createClient } from "npm:@supabase/supabase-js@2";
import type { StripeEnv } from "./stripe.ts";

export interface LegacyBookFulfillmentInput {
  surname: string;
  shippingAddress: Record<string, string>;
  buyerEmail?: string;
  sessionId: string;
  paymentIntent?: string;
  amountTotal?: number;
  currency?: string;
  userId?: string;
  env: StripeEnv;
}

export interface LegacyBookFulfillmentResult {
  orderId: string;
  alreadyFulfilled: boolean;
  fulfillmentStatus: string;
  gelatoOrderId?: string | null;
  gelatoOrderRef?: string | null;
  error?: string;
}

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

function serializeError(err: unknown): string {
  if (err == null) return "unknown error";
  if (typeof err === "string") return err;
  if (err instanceof Error) {
    return `${err.name}: ${err.message}${err.stack ? `\n${err.stack}` : ""}`;
  }
  try {
    const s = JSON.stringify(err);
    if (s && s !== "{}") return s;
  } catch { /* ignore */ }
  try { return String(err); } catch { return "unserializable error"; }
}

// Normalize a shipping address to the EXACT shape create-legacy-book-order
// expects (firstName, lastName, addressLine1, addressLine2, city, state,
// postCode, country, email). Accepts both the canonical keys and a few common
// aliases so older sessions still fulfill.
function normalizeShippingAddress(
  raw: Record<string, unknown>,
  fallbackEmail?: string,
): Record<string, string> {
  const pick = (...keys: string[]): string => {
    for (const k of keys) {
      const v = raw[k];
      if (typeof v === "string" && v.trim() !== "") return v.trim();
    }
    return "";
  };
  return {
    firstName: pick("firstName", "first_name", "givenName"),
    lastName: pick("lastName", "last_name", "familyName"),
    addressLine1: pick("addressLine1", "address1", "line1", "street"),
    addressLine2: pick("addressLine2", "address2", "line2"),
    city: pick("city", "town"),
    state: pick("state", "region", "province"),
    postCode: pick("postCode", "postalCode", "postal_code", "zip", "zipCode"),
    country: pick("country", "countryCode", "country_code"),
    email: pick("email") || (fallbackEmail ?? ""),
  };
}

export async function triggerLegacyBookFulfillment(
  input: LegacyBookFulfillmentInput,
): Promise<LegacyBookFulfillmentResult> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const normalized = input.surname.trim().toLowerCase();
  const displaySurname = input.surname.trim().replace(/\b\w/g, (c: string) => c.toUpperCase());
  const shippingAddress = normalizeShippingAddress(
    input.shippingAddress as Record<string, unknown>,
    input.buyerEmail,
  );

  console.log("[legacy-book] start fulfillment session:", input.sessionId, "surname:", normalized, "user:", input.userId ?? "(none)");

  // Idempotency: re-use existing row for this session if present.
  const { data: existing, error: existingErr } = await supabase
    .from("legacy_book_orders")
    .select("id, fulfillment_status, gelato_order_id, gelato_order_reference_id")
    .eq("stripe_session_id", input.sessionId)
    .maybeSingle();

  if (existingErr) {
    console.error("[legacy-book] lookup failed:", existingErr);
  }

  let orderId: string;
  let alreadyFulfilled = false;

  if (existing) {
    orderId = existing.id as string;
    const status = (existing.fulfillment_status as string) ?? "unknown";
    console.log("[legacy-book] existing row:", orderId, "status:", status);
    // If we already submitted, short-circuit. If still pending/failed, retry below.
    if (status === "submitted" || status === "fulfilled" || status === "shipped") {
      return {
        orderId,
        alreadyFulfilled: true,
        fulfillmentStatus: status,
        gelatoOrderId: (existing.gelato_order_id as string | null) ?? null,
        gelatoOrderRef: (existing.gelato_order_reference_id as string | null) ?? null,
      };
    }
    alreadyFulfilled = false;
  } else {
    const { data: inserted, error: insertError } = await supabase
      .from("legacy_book_orders")
      .insert({
        user_id: input.userId ?? null,
        buyer_email: input.buyerEmail ?? shippingAddress.email ?? "",
        surname: normalized,
        display_surname: displaySurname,
        stripe_session_id: input.sessionId,
        stripe_payment_intent: input.paymentIntent ?? null,
        amount_total: input.amountTotal ?? null,
        currency: input.currency ?? null,
        shipping_address: shippingAddress,
        fulfillment_status: "pending",
      })
      .select("id")
      .single();

    if (insertError || !inserted) {
      console.error("[legacy-book] failed to insert order row:", insertError);
      throw new Error(`Insert failed: ${insertError?.message ?? "unknown"}`);
    }
    orderId = inserted.id as string;
    console.log("[legacy-book] inserted row:", orderId);
  }

  const updateRow = async (patch: Record<string, unknown>, opts: { critical?: boolean } = {}) => {
    const { data, error } = await supabase
      .from("legacy_book_orders")
      .update(patch)
      .eq("id", orderId)
      .select("id");
    if (error) {
      console.error("[legacy-book] row update ERROR:", error, "patch:", patch);
      if (opts.critical) throw new Error(`legacy_book_orders update failed: ${error.message}`);
      return;
    }
    const affected = data?.length ?? 0;
    console.log(`[legacy-book] row update affected=${affected} id=${orderId} patch_keys=${Object.keys(patch).join(",")}`);
    if (affected === 0) {
      const msg = `legacy_book_orders update affected 0 rows for id=${orderId}`;
      console.error("[legacy-book]", msg);
      if (opts.critical) throw new Error(msg);
    }
  };

  const callFn = async (name: string, body: Record<string, unknown>) => {
    console.log(`[legacy-book] → ${name}`, JSON.stringify(body).slice(0, 300));
    const res = await fetch(`${supabaseUrl}/functions/v1/${name}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceKey}` },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    let parsed: unknown = null;
    try { parsed = JSON.parse(text); } catch { /* keep raw */ }
    if (!res.ok) {
      const detail = typeof parsed === "object" ? JSON.stringify(parsed).slice(0, 800) : text.slice(0, 800);
      throw new Error(`${name} failed (HTTP ${res.status}): ${detail}`);
    }
    console.log(`[legacy-book] ← ${name} OK`);
    return parsed as Record<string, unknown> | null;
  };

  try {
    // 1. Interior PDF (per-user when user_id provided)
    await updateRow({ fulfillment_status: "rendering_interior", fulfillment_error: null });
    await callFn("render-legacy-book-pdf", {
      surname: normalized,
      user_id: input.userId ?? undefined,
    });

    // 2. Cover PDF
    await updateRow({ fulfillment_status: "rendering_cover" });
    await callFn("render-legacy-book-cover-pdf", {
      surname: normalized,
      user_id: input.userId ?? undefined,
    });

    // 3. Submit to Gelato — exact shape that works in direct call.
    // Sandbox/preview NEVER triggers a real print.
    await updateRow({ fulfillment_status: "submitting_gelato" });
    const gelatoRes = await callFn("create-legacy-book-order", {
      surname: normalized,
      user_id: input.userId ?? undefined,
      shippingAddress,
      orderType: input.env === "sandbox" ? "draft" : "order",
      quantity: 1,
    });

    const gelatoOrderId =
      (gelatoRes?.orderId ?? gelatoRes?.gelato_order_id ?? null) as string | null;
    const gelatoOrderRef =
      (gelatoRes?.orderReferenceId ?? gelatoRes?.gelato_order_reference_id ?? null) as string | null;

    await updateRow({
      gelato_order_id: gelatoOrderId,
      gelato_order_reference_id: gelatoOrderRef,
      fulfillment_status: "submitted",
      fulfillment_error: null,
    });

    console.log("[legacy-book] SUBMITTED gelato_order_id:", gelatoOrderId, "ref:", gelatoOrderRef);

    return {
      orderId,
      alreadyFulfilled,
      fulfillmentStatus: "submitted",
      gelatoOrderId,
      gelatoOrderRef,
    };
  } catch (err) {
    const errStr = serializeError(err);
    console.error("[legacy-book] FAILED:", errStr);
    await updateRow({ fulfillment_status: "failed", fulfillment_error: errStr });
    return {
      orderId,
      alreadyFulfilled,
      fulfillmentStatus: "failed",
      gelatoOrderId: null,
      gelatoOrderRef: null,
      error: errStr,
    };
  }
}
