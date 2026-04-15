import { useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import SectionLabel from "@/components/journey/SectionLabel";
import PaymentTestModeBanner from "@/components/PaymentTestModeBanner";
import StripeEmbeddedCheckout from "@/components/StripeEmbeddedCheckout";
import { useJourney } from "@/contexts/JourneyContext";
import { usePurchase } from "@/hooks/usePurchase";

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { surname } = useJourney();
  const { user, hasPurchased, loading } = usePurchase();

  // If already purchased, redirect to my-legacy
  useEffect(() => {
    if (!loading && hasPurchased) navigate("/my-legacy", { replace: true });
  }, [loading, hasPurchased, navigate]);

  // If not logged in, redirect back to journey
  useEffect(() => {
    if (!loading && !user) navigate("/journey/5", { replace: true });
  }, [loading, user, navigate]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="font-serif text-sm italic text-amber-dim">Preparing checkout…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center">
      <PaymentTestModeBanner />

      <div className="w-full max-w-2xl px-6 py-16">
        <SectionLabel>UNLOCK YOUR LEGACY</SectionLabel>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mt-6 text-center font-display text-3xl text-cream-warm sm:text-4xl"
        >
          The {surname || ""} Legacy Pack
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-4 text-center font-serif italic text-text-body"
        >
          Full story, high-res crest, family tree, and legacy certificate — yours forever.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-10"
        >
          <StripeEmbeddedCheckout
            priceId="legacy_pack_once"
            customerEmail={user.email ?? undefined}
            userId={user.id}
            returnUrl={`${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`}
          />
        </motion.div>

        <button
          onClick={() => navigate("/journey/5")}
          className="mt-8 block w-full text-center font-sans text-sm text-text-dim transition-colors hover:text-amber-light"
        >
          ← Back to your story
        </button>
      </div>
    </div>
  );
};

export default CheckoutPage;
