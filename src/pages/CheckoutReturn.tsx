import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import SectionLabel from "@/components/journey/SectionLabel";
import { supabase } from "@/integrations/supabase/client";
import { getStripeEnvironment } from "@/lib/stripe";

type ConfirmState =
  | { kind: "loading" }
  | { kind: "book"; fulfillmentStatus?: string }
  | { kind: "legacy" }
  | { kind: "error" };

const CheckoutReturn = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get("session_id");
  const [state, setState] = useState<ConfirmState>(
    sessionId ? { kind: "loading" } : { kind: "error" },
  );

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("confirm-book-order", {
          body: { sessionId, environment: getStripeEnvironment() },
        });
        if (cancelled) return;
        if (error) {
          // Fall back to legacy message rather than blocking the user.
          console.warn("[CheckoutReturn] confirm-book-order error:", error.message);
          setState({ kind: "legacy" });
          return;
        }
        if (data?.productType === "legacy-book") {
          setState({ kind: "book", fulfillmentStatus: data.fulfillmentStatus });
        } else {
          setState({ kind: "legacy" });
        }
      } catch (e) {
        if (cancelled) return;
        console.warn("[CheckoutReturn] confirm-book-order threw:", (e as Error).message);
        setState({ kind: "legacy" });
      }
    })();
    return () => { cancelled = true; };
  }, [sessionId]);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-6 py-24">
      <img src="/hero.jpg" alt="" className="pointer-events-none fixed inset-0 h-full w-full object-cover" style={{ objectPosition: "center 30%", opacity: 0.38, filter: "saturate(0.7) brightness(0.95)" }} />

      {state.kind === "book" ? (
        <>
          <SectionLabel>YOUR LEGACY BOOK IS ON ITS WAY</SectionLabel>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mt-8 max-w-lg text-center"
          >
            <h1 className="font-display text-3xl text-cream-warm sm:text-4xl">
              Your Legacy Book is on its way.
            </h1>
            <p className="mt-4 font-serif italic text-text-body">
              Printed and shipped by Gelato, 7–10 business days. We'll email tracking as soon as it's on the move.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <button
                onClick={() => navigate("/dashboard")}
                className="rounded-pill px-12 py-4 font-sans text-[13px] font-semibold uppercase tracking-[1.5px] transition-all duration-300 hover:-translate-y-0.5"
                style={{ background: "linear-gradient(135deg, #e8943a, #c47828)", color: "#1a1208" }}
              >
                Back to Dashboard
              </button>
              <button
                onClick={() => navigate("/my-legacy")}
                className="rounded-pill border px-10 py-4 font-sans text-[13px] font-semibold uppercase tracking-[1.5px] transition-all duration-300 hover:-translate-y-0.5"
                style={{ borderColor: "rgba(232,148,58,0.45)", color: "#e8b85c", background: "rgba(232,148,58,0.07)" }}
              >
                View Your Legacy
              </button>
            </div>
          </motion.div>
        </>
      ) : state.kind === "legacy" || state.kind === "loading" ? (
        <>
          <SectionLabel>LEGACY UNLOCKED</SectionLabel>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mt-8 max-w-lg text-center"
          >
            <h1 className="font-display text-3xl text-cream-warm sm:text-4xl">
              Your Legacy Pack is ready.
            </h1>
            <p className="mt-4 font-serif italic text-text-body">
              Your full family story, crest, and tree are now unlocked.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <button
                onClick={() => navigate("/my-legacy")}
                className="rounded-pill px-12 py-4 font-sans text-[13px] font-semibold uppercase tracking-[1.5px] transition-all duration-300 hover:-translate-y-0.5"
                style={{ background: "linear-gradient(135deg, #e8943a, #c47828)", color: "#1a1208" }}
              >
                View Your Legacy
              </button>
              <button
                onClick={() => navigate("/journey/6")}
                className="rounded-pill border px-10 py-4 font-sans text-[13px] font-semibold uppercase tracking-[1.5px] transition-all duration-300 hover:-translate-y-0.5"
                style={{ borderColor: "rgba(232,148,58,0.45)", color: "#e8b85c", background: "rgba(232,148,58,0.07)" }}
              >
                Pass It On
              </button>
            </div>
          </motion.div>
        </>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mt-8 max-w-lg text-center"
        >
          <h1 className="font-display text-3xl text-cream-warm">
            Something went wrong.
          </h1>
          <p className="mt-4 font-serif italic text-text-body">
            We couldn't confirm your payment. Please try again.
          </p>
          <button
            onClick={() => navigate("/journey/5")}
            className="mt-10 inline-block rounded-pill px-12 py-4 font-sans text-[13px] font-semibold uppercase tracking-[1.5px] transition-all duration-300 hover:-translate-y-0.5"
            style={{
              background: "linear-gradient(135deg, #e8943a, #c47828)",
              color: "#1a1208",
            }}
          >
            Back to Your Story
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default CheckoutReturn;
