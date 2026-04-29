import { useState, FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";

interface JourneyGateProps {
  open: boolean;
  surname?: string;
  onSuccess: () => void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const JourneyGate = ({ open, surname, onSuccess }: JourneyGateProps) => {
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
          source: "journey-gate",
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
      style={{ backgroundColor: "rgba(13, 10, 7, 0.8)" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="journey-gate-title"
    >
      <div
        className="w-full max-w-md rounded-2xl border p-8 shadow-2xl"
        style={{
          backgroundColor: "#065f58",
          borderColor: "#14B8A6",
          borderWidth: 1,
        }}
      >
        <h2
          id="journey-gate-title"
          className="text-center text-3xl italic"
          style={{
            fontFamily: "'Lora', serif",
            color: "#d4a04a",
          }}
        >
          Begin Your Journey
        </h2>
        <p
          className="mt-3 text-center text-sm"
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            color: "#ffffff",
          }}
        >
          Enter your email to discover your family's story
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
          <input
            type="email"
            required
            autoFocus
            disabled={submitting}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            aria-label="Email address"
            className="w-full rounded-lg border px-4 py-3 outline-none focus:ring-2"
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              backgroundColor: "rgba(13, 10, 7, 0.4)",
              borderColor: "#14B8A6",
              color: "#ffffff",
            }}
          />

          {error && (
            <p
              className="text-sm"
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                color: "#ff6b6b",
              }}
              role="alert"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 w-full rounded-lg px-6 py-3 font-semibold transition-opacity disabled:opacity-60"
            style={{
              backgroundColor: "#E85D2C",
              color: "#ffffff",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
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
