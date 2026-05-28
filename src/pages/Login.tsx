import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resetting, setResetting] = useState(false);

  const inputClass =
    "w-full rounded-[14px] border border-amber-dim/30 bg-input px-5 py-4 font-sans text-sm text-cream-warm placeholder:text-text-dim focus:border-amber focus:outline-none";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResetMessage(null);
    setSubmitting(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      setError("Invalid email or password.");
      setSubmitting(false);
      return;
    }

    navigate("/dashboard");
  };

  const handleReset = async (e: React.MouseEvent) => {
    e.preventDefault();
    setError(null);
    setResetMessage(null);

    if (!email.trim()) {
      setError("Please enter your email address first.");
      return;
    }

    setResetting(true);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      { redirectTo: window.location.origin }
    );

    if (resetError) {
      setError(resetError.message);
      setResetting(false);
      return;
    }

    setResetMessage("Password reset email sent. Check your inbox.");
    setResetting(false);
  };

  return (
    <div className="min-h-screen bg-background px-6 py-16">
      <div className="mx-auto w-full max-w-md rounded-[22px] border border-amber-dim/25 bg-card p-8">
        <h1 className="text-center font-display text-3xl text-cream-warm">
          Welcome back
        </h1>
        <p className="mt-2 text-center font-serif text-sm italic text-text-dim">
          Continue your family's story
        </p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            className={inputClass}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            className={inputClass}
          />

          {error && (
            <p className="rounded-[10px] border border-red-500/30 bg-red-500/10 px-4 py-3 font-sans text-sm text-red-300">
              {error}
            </p>
          )}

          {resetMessage && (
            <p className="rounded-[10px] border border-amber/30 bg-amber/10 px-4 py-3 font-sans text-sm text-amber-light">
              {resetMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 rounded-pill px-8 py-4 font-sans text-[13px] font-semibold uppercase tracking-[1.5px] transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg, #e8943a, #c47828)",
              color: "#1a1208",
            }}
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="mt-4 flex flex-col items-center gap-2">
          <button
            onClick={handleReset}
            disabled={resetting}
            className="font-sans text-sm text-amber hover:text-honey-light transition-colors disabled:opacity-50"
          >
            {resetting ? "Sending…" : "Forgot password?"}
          </button>

          <p className="font-sans text-sm text-text-dim">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="text-amber hover:text-honey-light transition-colors"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
