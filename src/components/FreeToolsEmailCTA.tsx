import { useState, useEffect, FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STORAGE_KEY = "journey_email_captured";

const FreeToolsEmailCTA = () => {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [magicSent, setMagicSent] = useState(false);

  useEffect(() => {
    let captured = false;
    try {
      captured = sessionStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      captured = false;
    }
    if (!captured) setVisible(true);
    setMounted(true);
  }, []);

  if (!mounted || !visible) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);

    const trimmed = email.trim().toLowerCase();
    if (!EMAIL_RE.test(trimmed)) {
      setError("Please enter a valid email address.");
      return;
    }

    setSubmitting(true);
    try {
      const { error: insertError } = await supabase
        .from("journey_subscribers")
        .insert({ email: trimmed, source: "free-tools-page" });

      if (insertError && insertError.code !== "23505") throw insertError;

      // Fire-and-forget Kit.com sync — never block the user.
      supabase.functions
        .invoke("sync-to-kit", { body: { email: trimmed, source: "free-tools-page" } })
        .catch((err) => console.error("Kit sync failed:", err));

      try {
        sessionStorage.setItem(STORAGE_KEY, "true");
      } catch {
        /* sessionStorage unavailable */
      }

      // Fire-and-forget magic link — never block the user.
      supabase.auth
        .signInWithOtp({
          email: trimmed,
          options: {
            shouldCreateUser: true,
            emailRedirectTo: `${window.location.origin}${window.location.pathname}`,
          },
        })
        .then(({ error: otpError }) => {
          if (otpError) console.warn("FreeToolsEmailCTA magic link skipped", otpError);
        })
        .catch((otpErr) => console.warn("FreeToolsEmailCTA magic link error", otpErr));

      setMagicSent(true);
      setTimeout(() => setVisible(false), 4500);
    } catch (err) {
      console.error("FreeToolsEmailCTA submit failed", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.section
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 mx-auto w-full max-w-2xl px-6 pb-12 pt-20 text-center"
        >
          <div
            className="rounded-[28px] border bg-card p-10 shadow-2xl sm:p-14"
            style={{ borderColor: "hsl(var(--amber-dim) / 0.4)" }}
          >
            <p className="mb-3 font-sans text-[10px] uppercase tracking-[4px] text-amber-dim">
              Free Heritage Tools
            </p>
            <h2 className="font-display text-4xl italic text-amber-light sm:text-5xl">
              Unlock All Free Heritage Tools
            </h2>
            <p className="mx-auto mt-5 max-w-lg font-serif text-base italic leading-relaxed text-cream-soft sm:text-lg">
              Enter your email below to instantly access every free heritage
              tool — surname meanings, family crests, ancestor chats, and more.
              One email, full access.
            </p>

            {magicSent && (
              <div
                role="status"
                className="mx-auto mt-6 max-w-md rounded-2xl border px-5 py-4 text-center"
                style={{
                  borderColor: "hsl(var(--amber-dim) / 0.4)",
                  backgroundColor: "hsl(var(--amber) / 0.08)",
                }}
              >
                <p className="font-display text-lg italic text-amber-light">
                  Check your inbox
                </p>
                <p className="mt-1 font-sans text-sm text-cream-soft">
                  We've sent you a magic link to access your account anytime.
                </p>
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="mx-auto mt-8 flex w-full max-w-md flex-col gap-4"
            >
              <input
                type="email"
                required
                disabled={submitting}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                aria-label="Email address"
                className="w-full rounded-pill border border-amber-dim/30 bg-input px-6 py-4 text-center font-sans text-base text-cream-warm placeholder:text-text-dim focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/30 disabled:opacity-60"
              />

              {error && (
                <p
                  className="text-center font-sans text-sm text-destructive"
                  role="alert"
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="mt-1 self-center rounded-pill px-12 py-4 font-sans text-[13px] font-semibold uppercase tracking-[1.5px] text-primary-foreground transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-60"
                style={{
                  background: "linear-gradient(135deg, #e8943a, #c47828)",
                  transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
                }}
              >
                {submitting ? "Unlocking..." : "Unlock Tools"}
              </button>
            </form>
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
};

export default FreeToolsEmailCTA;
