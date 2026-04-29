import { useStripePrice } from "./useStripePrice";

/**
 * Returns the live Family Crest Mug price (e.g. "$39.99") fetched once
 * from Stripe via the get-stripe-price edge function and cached process-wide.
 *
 * Use this everywhere the mug price is displayed so price changes happen
 * ONLY in Stripe — no source edits required.
 *
 * Lookup key: "heirloom_mug_once"
 * Fallback: "$39.99" (shown only until the Stripe response resolves)
 */
export function useMugPrice(): string {
  return useStripePrice("heirloom_mug_once", "$39.99");
}
