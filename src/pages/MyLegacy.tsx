import { useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import SectionLabel from "@/components/journey/SectionLabel";
import { usePurchase } from "@/hooks/usePurchase";

const MyLegacy = () => {
  const navigate = useNavigate();
  const { user, hasPurchased, loading } = usePurchase();

  useEffect(() => {
    if (!loading && !user) navigate("/journey/1", { replace: true });
  }, [loading, user, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="font-serif text-sm italic text-amber-dim">Loading your legacy…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-24 bg-background">
      <SectionLabel>YOUR LEGACY</SectionLabel>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="mt-8 max-w-lg text-center"
      >
        {hasPurchased ? (
          <>
            <h1 className="font-display text-3xl text-cream-warm sm:text-4xl">
              Your Legacy Pack is unlocked.
            </h1>
            <p className="mt-4 font-serif italic text-text-body">
              Your full family story, high-res crest, family tree, and legacy certificate are being prepared. You'll receive them soon.
            </p>
            <button
              onClick={() => navigate("/journey/6")}
              className="mt-10 rounded-pill px-12 py-4 font-sans text-[13px] font-semibold uppercase tracking-[1.5px] transition-all duration-300 hover:-translate-y-0.5"
              style={{
                background: "linear-gradient(135deg, #e8943a, #c47828)",
                color: "#1a1208",
              }}
            >
              Pass It On
            </button>
          </>
        ) : (
          <>
            <h1 className="font-display text-3xl text-cream-warm">
              No Legacy Pack yet.
            </h1>
            <p className="mt-4 font-serif italic text-text-body">
              Start your journey to discover your family legacy.
            </p>
            <button
              onClick={() => navigate("/journey/1")}
              className="mt-10 rounded-pill px-12 py-4 font-sans text-[13px] font-semibold uppercase tracking-[1.5px] transition-all duration-300 hover:-translate-y-0.5"
              style={{
                background: "linear-gradient(135deg, #e8943a, #c47828)",
                color: "#1a1208",
              }}
            >
              Begin Your Journey
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default MyLegacy;
