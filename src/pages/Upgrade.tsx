import { useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getStripeEnvironment } from "@/lib/stripe";

const features = [
  "Unlock all 10 legacy tools",
  "Chat with your ancestor",
  "Forge your family crest",
  "Get your full family story",
  "Create your family tree",
  "Collect history from family members",
];

const Upgrade = () => {
  const { user, loading } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading) return null;
  if (!user) return <Navigate to="/" replace />;

  const handleUpgrade = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const { getStripeEnvironment } = await import("@/lib/stripe");
      const { data, error } = await supabase.functions.invoke("create-upgrade-checkout", {
        body: { environment: getStripeEnvironment() },
      });
      if (error) throw error;
      if (!data?.url) throw new Error("No checkout URL returned");
      window.location.href = data.url;
    } catch (e) {
      setError((e as Error).message ?? "Something went wrong");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-6 py-16">
      <div className="mx-auto max-w-2xl text-center">
        <p className="font-serif text-sm uppercase tracking-[0.3em] text-amber-dim">
          Legacy Upgrade
        </p>
        <h1 className="mt-4 font-display text-4xl text-cream-warm md:text-5xl">
          Unlock Your Full Legacy
        </h1>
        <p className="mt-4 font-serif text-lg italic text-amber-light">
          Every tool. Every story. Every chapter of your bloodline.
        </p>

        <div className="mt-10 rounded-[22px] border border-amber/20 bg-card p-8 text-left shadow-[0_12px_40px_rgba(232,148,58,0.08)]">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-2xl text-cream-warm">Legacy Pack</h2>
            <span className="font-display text-3xl text-amber">$29.99</span>
          </div>
          <p className="mt-1 font-serif text-sm italic text-text-dim">One-time payment</p>

          <ul className="mt-6 space-y-3">
            {features.map((f) => (
              <li key={f} className="flex items-start gap-3 font-sans text-text">
                <span className="mt-1 text-amber">✦</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>

          <button
            onClick={handleUpgrade}
            disabled={submitting}
            className="mt-8 w-full rounded-full bg-gradient-to-br from-[#e8943a] to-[#c47828] px-10 py-4 font-sans text-sm font-semibold uppercase tracking-[0.15em] text-[#1a1208] transition hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(232,148,58,0.25)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Redirecting to Stripe…" : "Pay $29.99"}
          </button>

          {error && (
            <p className="mt-4 text-center font-sans text-sm text-red-400">{error}</p>
          )}

          <p className="mt-4 text-center font-sans text-xs text-text-dim">
            Secure checkout via Stripe{getStripeEnvironment() === "sandbox" ? " · Test mode" : ""}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Upgrade;
