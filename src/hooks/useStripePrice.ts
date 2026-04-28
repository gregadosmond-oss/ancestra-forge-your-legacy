import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getStripeEnvironment } from "@/lib/stripe";

type CacheEntry = { formatted: string; unitAmount: number; currency: string };
const cache = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<CacheEntry | null>>();

async function fetchStripePrice(lookupKey: string): Promise<CacheEntry | null> {
  if (cache.has(lookupKey)) return cache.get(lookupKey)!;
  if (inFlight.has(lookupKey)) return inFlight.get(lookupKey)!;

  const promise = (async () => {
    try {
      const { data, error } = await supabase.functions.invoke("get-stripe-price", {
        body: { priceId: lookupKey, environment: getStripeEnvironment() },
      });
      if (error || !data?.formatted) return null;
      const entry: CacheEntry = {
        formatted: data.formatted,
        unitAmount: data.unitAmount,
        currency: data.currency,
      };
      cache.set(lookupKey, entry);
      return entry;
    } catch {
      return null;
    } finally {
      inFlight.delete(lookupKey);
    }
  })();

  inFlight.set(lookupKey, promise);
  return promise;
}

export function useStripePrice(lookupKey: string, fallback: string): string {
  const [price, setPrice] = useState<string>(() => cache.get(lookupKey)?.formatted ?? fallback);

  useEffect(() => {
    let cancelled = false;
    fetchStripePrice(lookupKey).then((entry) => {
      if (!cancelled && entry) setPrice(entry.formatted);
    });
    return () => {
      cancelled = true;
    };
  }, [lookupKey]);

  return price;
}
