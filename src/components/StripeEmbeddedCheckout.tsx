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
}: StripeEmbeddedCheckoutProps) => {
  const fetchClientSecret = async (): Promise<string> => {
    const { data, error } = await supabase.functions.invoke("create-checkout", {
      body: { priceId, quantity, customerEmail, userId, returnUrl, environment: getStripeEnvironment(), isGift, recipientEmail, surname, shippingAddress: shippingAddress ? JSON.stringify(shippingAddress) : undefined, productType },
    });
    if (error || !data?.clientSecret) {
      throw new Error(error?.message || "Failed to create checkout session");
    }
    return data.clientSecret;
  };

  return (
    <div id="checkout">
      <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
};

export default StripeEmbeddedCheckout;
