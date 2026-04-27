import { useCallback, useMemo } from "react";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { getStripe, getStripeEnvironment, isStripeConfigured } from "@/lib/stripe";
import { supabase } from "@/integrations/supabase/client";

interface StripeEmbeddedCheckoutProps {
  priceId: string;
  quantity?: number;
  customerEmail?: string;
  userId?: string;
  returnUrl?: string;
  isGift?: boolean;
  recipientEmail?: string;
  surname?: string;
  shippingAddress?: Record<string, string>;
  productType?: string;
  environment?: 'sandbox' | 'live';
}

const StripeEmbeddedCheckout = ({
  priceId,
  quantity,
  customerEmail,
  userId,
  returnUrl,
  isGift,
  recipientEmail,
  surname,
  shippingAddress,
  productType,
  environment,
}: StripeEmbeddedCheckoutProps) => {
  if (!isStripeConfigured()) {
    return (
      <div className="rounded-[14px] border border-amber-dim/30 bg-bg-card p-6 text-center">
        <p className="font-serif italic text-amber-light">
          Payments aren't configured for this environment yet.
        </p>
        <p className="mt-2 font-sans text-xs text-text-dim">
          Please check back shortly — we're getting things ready.
        </p>
      </div>
    );
  }

  const fetchClientSecret = useCallback(async (): Promise<string> => {
    const { data, error } = await supabase.functions.invoke("create-checkout", {
      body: { priceId, quantity, customerEmail, userId, returnUrl, environment: environment ?? getStripeEnvironment(), isGift, recipientEmail, surname, shippingAddress: shippingAddress ? JSON.stringify(shippingAddress) : undefined, productType },
    });
    if (error || !data?.clientSecret) {
      throw new Error(error?.message || "Failed to create checkout session");
    }
    return data.clientSecret;
  }, [priceId, quantity, customerEmail, userId, returnUrl, environment, isGift, recipientEmail, surname, shippingAddress, productType]);

  const stripePromise = useMemo(() => getStripe(), []);
  const options = useMemo(() => ({ fetchClientSecret }), [fetchClientSecret]);

  return (
    <div id="checkout">
      <EmbeddedCheckoutProvider stripe={stripePromise} options={options}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
};

export default StripeEmbeddedCheckout;
