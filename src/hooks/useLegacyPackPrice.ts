import { useStripePrice } from "./useStripePrice";

/**
 * Returns the live Legacy Pack price (e.g. "$29.99") fetched once from
 * Stripe via the get-stripe-price edge function and cached process-wide.
 *
 * Use this everywhere the Legacy Pack price is displayed so price changes
 * happen ONLY in Stripe — no source edits required.
 *
 * Lookup key: "legacy_pack_once"
 * Fallback: "$29.99" (shown only until the Stripe response resolves)
 */
export function useLegacyPackPrice(): string {
  return useStripePrice("legacy_pack_once", "$29.99");
}
