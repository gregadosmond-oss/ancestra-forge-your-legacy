import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import SectionLabel from "@/components/journey/SectionLabel";
import PaymentTestModeBanner from "@/components/PaymentTestModeBanner";
import StripeEmbeddedCheckout from "@/components/StripeEmbeddedCheckout";
import { useJourney } from "@/contexts/JourneyContext";

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { surname } = useJourney();

  return (
    <div className="flex min-h-screen flex-col items-center bg-background">
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
