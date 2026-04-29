import { useState, FormEvent, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface JourneyGateProps {
  open: boolean;
  surname?: string;
  source?: string;
  onSuccess: () => void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const JourneyGate = ({ open, surname, source = "journey-gate", onSuccess }: JourneyGateProps) => {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

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
        .insert({
          email: trimmed,
          surname_searched: surname?.trim() || null,
          source,
        });

      // Treat duplicate email (23505) as success — they've already opted in.
      if (insertError && insertError.code !== "23505") {
        throw insertError;
      }

      try {
        sessionStorage.setItem("journey_email_captured", "true");
      } catch {
        // sessionStorage may be unavailable; continue regardless.
      }
      onSuccess();
    } catch (err) {
      console.error("JourneyGate submit failed", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-6"
      style={{ backgroundColor: "hsl(var(--background) / 0.8)" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="journey-gate-title"
    >
      <div
        className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-2xl"
        style={{
          borderColor: "hsl(var(--amber-dim) / 0.4)",
        }}
      >
        <h2
          id="journey-gate-title"
          className="text-center font-display text-3xl italic text-amber-light"
        >
          Begin Your Journey
        </h2>
        <p className="mt-3 text-center font-serif text-base italic text-cream-soft">
          Enter your email to discover your family's story
        </p>

        <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-4">
          <input
            type="email"
            required
            autoFocus
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
            className="mt-2 rounded-pill px-12 py-4 font-sans text-[13px] font-semibold uppercase tracking-[1.5px] text-primary-foreground transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-60"
            style={{
              background: "linear-gradient(135deg, #e8943a, #c47828)",
              transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          >
            {submitting ? "Continuing..." : "Continue Journey"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default JourneyGate;
