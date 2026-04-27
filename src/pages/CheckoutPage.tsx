import { useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import SectionLabel from "@/components/journey/SectionLabel";
import PaymentTestModeBanner from "@/components/PaymentTestModeBanner";
import StripeEmbeddedCheckout from "@/components/StripeEmbeddedCheckout";
import { useJourney } from "@/contexts/JourneyContext";
import { usePurchase } from "@/hooks/usePurchase";

type GiftState = { isGift?: boolean; recipientEmail?: string };

const CheckoutPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { surname } = useJourney();
  const { user, hasPurchased, loading } = usePurchase();
  const giftState = (location.state as GiftState | null) ?? {};

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
    <div className="relative flex min-h-screen flex-col items-center">
      <img src="/hero.jpg" alt="" className="pointer-events-none fixed inset-0 h-full w-full object-cover" style={{ objectPosition: "center 30%", opacity: 0.38, filter: "saturate(0.7) brightness(0.95)" }} />
      <PaymentTestModeBanner />

      <div className="w-full max-w-2xl px-6 py-16">
        <SectionLabel>{giftState.isGift ? "GIFT A LEGACY" : "UNLOCK YOUR LEGACY"}</SectionLabel>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mt-6 text-center font-display text-3xl text-cream-warm sm:text-4xl"
        >
          The {surname ? surname.charAt(0).toUpperCase() + surname.slice(1).toLowerCase() : ""} Legacy Pack
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-4 text-center font-serif italic text-text-body"
        >
          {giftState.isGift && giftState.recipientEmail
            ? `A gift for ${giftState.recipientEmail} — delivered instantly after payment.`
            : "Full story, high-res crest, migration path, and legacy certificate — yours forever."}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-10"
          style={{
            background: "#ffffff",
            borderRadius: 16,
            padding: "32px 24px",
            overflow: "hidden",
          }}
        >
          <StripeEmbeddedCheckout
            priceId="legacy_pack_once"
            customerEmail={user.email ?? undefined}
            userId={user.id}
            returnUrl={`${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`}
            isGift={giftState.isGift}
            recipientEmail={giftState.recipientEmail}
            surname={surname ?? undefined}
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
