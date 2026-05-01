import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";

interface AuthGateProps {
  onAuthenticated: () => void;
  onClose: () => void;
}

const AuthGate = ({ onAuthenticated, onClose }: AuthGateProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) {
        toast.error(error.message);
        setSubmitting(false);
        return;
      }
      // Auto-confirm is enabled, so sign in immediately after signup
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        toast.error(signInError.message);
        setSubmitting(false);
        return;
      }

      // Fire-and-forget journey_subscribers insert + welcome email + audience sync.
      // Only runs on signup (isSignUp), never on sign-in.
      const trimmed = email.trim().toLowerCase();
      const source = "auth-gate";
      supabase
        .from("journey_subscribers")
        .insert({ email: trimmed, source })
        .then(({ error: insertError }) => {
          if (insertError && !insertError.message?.includes("duplicate")) {
            console.error("[auth-gate journey_subscribers insert] FAILED:", insertError);
            return;
          }
          // Fire welcome email
          supabase.functions
            .invoke("send-welcome-email", {
              body: { email: trimmed, first_name: null, source },
            })
            .then(({ data, error }) => {
              if (error) console.error("[send-welcome-email from auth-gate] FAILED:", error);
              else console.log("[send-welcome-email from auth-gate] success:", data);
            })
            .catch((err) => console.error("[send-welcome-email from auth-gate] threw:", err));
          // Fire Resend Audience sync (which also fires the drip automation event)
          supabase.functions
            .invoke("sync-to-resend-audience", {
              body: { email: trimmed, first_name: null, source },
            })
            .then(({ data, error }) => {
              if (error) console.error("[sync-to-resend-audience from auth-gate] FAILED:", error);
              else console.log("[sync-to-resend-audience from auth-gate] success:", data);
            })
            .catch((err) => console.error("[sync-to-resend-audience from auth-gate] threw:", err));
        });

      onAuthenticated();
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error(error.message);
        setSubmitting(false);
        return;
      }
      onAuthenticated();
    }
    setSubmitting(false);
  };

  const handleGoogle = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.href,
    });
    if (result.error) {
      toast.error("Google sign-in failed. Try email instead.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-[22px] border border-amber-dim/25 bg-card p-8">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 font-sans text-sm text-text-dim hover:text-amber-light"
        >
          ✕
        </button>

        <h2 className="text-center font-display text-2xl text-cream-warm">
          {isSignUp ? "Create your account" : "Welcome back"}
        </h2>
        <p className="mt-2 text-center font-serif text-sm italic text-text-dim">
          {isSignUp
            ? "Sign up to unlock your Legacy Pack"
            : "Sign in to continue to checkout"}
        </p>

        <button
          onClick={handleGoogle}
          className="mt-6 flex w-full items-center justify-center gap-3 rounded-pill border border-amber-dim/30 bg-amber/[0.06] px-6 py-4 font-sans text-sm font-medium text-cream-soft transition-colors hover:bg-amber/[0.12]"
        >
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Continue with Google
        </button>

        <div className="my-6 flex items-center gap-4">
          <div className="h-px flex-1 bg-gold-line" />
          <span className="font-sans text-[10px] uppercase tracking-[3px] text-text-dim">or</span>
          <div className="h-px flex-1 bg-gold-line" />
        </div>

        <form onSubmit={handleEmail} className="flex flex-col gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            className="rounded-[14px] border border-amber-dim/30 bg-input px-5 py-4 font-sans text-sm text-cream-warm placeholder:text-text-dim focus:border-amber focus:outline-none"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            minLength={8}
            className="rounded-[14px] border border-amber-dim/30 bg-input px-5 py-4 font-sans text-sm text-cream-warm placeholder:text-text-dim focus:border-amber focus:outline-none"
          />
          <button
            type="submit"
            disabled={submitting}
            className="mt-2 rounded-pill px-8 py-4 font-sans text-[13px] font-semibold uppercase tracking-[1.5px] transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg, #e8943a, #c47828)",
              color: "#1a1208",
            }}
          >
            {submitting ? "…" : isSignUp ? "Create Account" : "Sign In"}
          </button>
        </form>

        <p className="mt-5 text-center font-sans text-sm text-text-dim">
          {isSignUp ? "Already have an account?" : "Need an account?"}{" "}
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-amber-light underline"
          >
            {isSignUp ? "Sign in" : "Sign up"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthGate;
