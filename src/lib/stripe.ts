import { loadStripe, Stripe } from "@stripe/stripe-js";
import { supabase } from "@/integrations/supabase/client";

const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN;
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
