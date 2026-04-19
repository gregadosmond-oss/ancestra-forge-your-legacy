import { loadStripe, Stripe } from "@stripe/stripe-js";
import { supabase } from "@/integrations/supabase/client";

// Publishable key is safe to ship in frontend code (public by design).
// Falls back to the live key when no env-injected token is present (e.g. production builds).
const LIVE_PUBLISHABLE_KEY = "pk_live_51TMHXgDErt8rGG8mBlYN6qOxQGKdvpUAQopllZcqxn7cGH5Q8eU8Mfyg9lB60F3l1RdlmZaZ1MuDOVyy22MqwnjI00gMLPjX3y";
const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN || LIVE_PUBLISHABLE_KEY;
const environment = clientToken?.startsWith('pk_test_') ? 'sandbox' : 'live';

let stripePromise: Promise<Stripe | null> | null = null;

export function isStripeConfigured(): boolean {
  return Boolean(clientToken);
}

export function getStripe(): Promise<Stripe | null> {
  if (!clientToken) {
    // Return a resolved null instead of throwing so the app doesn't crash on load
    return Promise.resolve(null);
  }
  if (!stripePromise) {
    stripePromise = loadStripe(clientToken);
  }
  return stripePromise;
}

export async function getStripePriceId(priceId: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke("get-stripe-price", {
    body: { priceId, environment },
  });
  if (error || !data?.stripeId) {
    throw new Error(`Failed to resolve price: ${priceId}`);
  }
  return data.stripeId;
}

export function getStripeEnvironment(): string {
  return environment;
}
