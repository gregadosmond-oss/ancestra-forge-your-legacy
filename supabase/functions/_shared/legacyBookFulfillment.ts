// Shared helper used by payments-webhook (Stripe webhook path) and
// confirm-book-order (return-page fallback) so the Legacy Book is fulfilled
// reliably regardless of which path completes first. Idempotent on
// stripe_session_id — safe to call twice.
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
}

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

export async function triggerLegacyBookFulfillment(
  input: LegacyBookFulfillmentInput,
): Promise<LegacyBookFulfillmentResult> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const normalized = input.surname.trim().toLowerCase();
  const displaySurname = input.surname.trim().replace(/\b\w/g, (c: string) => c.toUpperCase());

  // Idempotency: if a row already exists for this Stripe session, return it.
  const { data: existing } = await supabase
    .from("legacy_book_orders")
    .select("id, fulfillment_status, gelato_order_id, gelato_order_reference_id")
    .eq("stripe_session_id", input.sessionId)
    .maybeSingle();

  if (existing) {
    console.log("[legacy-book] session already has an order row:", existing.id, "status:", existing.fulfillment_status);
    return {
      orderId: existing.id as string,
      alreadyFulfilled: true,
      fulfillmentStatus: (existing.fulfillment_status as string) ?? "unknown",
      gelatoOrderId: (existing.gelato_order_id as string | null) ?? null,
      gelatoOrderRef: (existing.gelato_order_reference_id as string | null) ?? null,
    };
  }

  const { data: inserted, error: insertError } = await supabase
    .from("legacy_book_orders")
    .insert({
      user_id: input.userId ?? null,
      buyer_email: input.buyerEmail ?? "",
      surname: normalized,
      display_surname: displaySurname,
      stripe_session_id: input.sessionId,
      stripe_payment_intent: input.paymentIntent ?? null,
      amount_total: input.amountTotal ?? null,
      currency: input.currency ?? null,
      shipping_address: input.shippingAddress,
      fulfillment_status: "pending",
    })
    .select("id")
    .single();

  if (insertError || !inserted) {
    console.error("[legacy-book] failed to insert order row:", insertError);
    throw new Error(`Insert failed: ${insertError?.message ?? "unknown"}`);
  }

  const orderId = inserted.id as string;
  console.log("[legacy-book] order row inserted:", orderId);

  const markFailed = async (err: unknown) => {
    const errStr = typeof err === "string" ? err : JSON.stringify(err);
    await supabase
      .from("legacy_book_orders")
      .update({ fulfillment_status: "failed", fulfillment_error: errStr })
      .eq("id", orderId);
  };

  const callFn = async (name: string, body: Record<string, unknown>) => {
    const res = await fetch(`${supabaseUrl}/functions/v1/${name}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceKey}` },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    let parsed: unknown = null;
    try { parsed = JSON.parse(text); } catch { /* keep raw */ }
    if (!res.ok) throw { fn: name, status: res.status, body: parsed ?? text };
    return parsed as Record<string, unknown> | null;
  };

  try {
    await callFn("render-legacy-book-pdf", { surname: normalized, user_id: input.userId ?? undefined });
    await callFn("render-legacy-book-cover-pdf", { surname: normalized, user_id: input.userId ?? undefined });
    const gelatoRes = await callFn("create-legacy-book-order", {
      surname: normalized,
      user_id: input.userId ?? undefined,
      shippingAddress: input.shippingAddress,
      // Safety gate: sandbox/preview NEVER triggers a real print.
      orderType: input.env === "sandbox" ? "draft" : "order",
      quantity: 1,
    });

    const gelatoOrderId =
      (gelatoRes?.orderId ?? gelatoRes?.gelato_order_id ?? null) as string | null;
    const gelatoOrderRef =
      (gelatoRes?.orderReferenceId ?? gelatoRes?.gelato_order_reference_id ?? null) as string | null;

    await supabase
      .from("legacy_book_orders")
      .update({
        gelato_order_id: gelatoOrderId,
        gelato_order_reference_id: gelatoOrderRef,
        fulfillment_status: "submitted",
      })
      .eq("id", orderId);

    console.log("[legacy-book] submitted to Gelato:", gelatoOrderId);

    return {
      orderId,
      alreadyFulfilled: false,
      fulfillmentStatus: "submitted",
      gelatoOrderId,
      gelatoOrderRef,
    };
  } catch (err) {
    console.error("[legacy-book] fulfillment failed:", err);
    await markFailed(err);
    return {
      orderId,
      alreadyFulfilled: false,
      fulfillmentStatus: "failed",
      gelatoOrderId: null,
      gelatoOrderRef: null,
    };
  }
}
