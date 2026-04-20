import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import SectionLabel from "@/components/journey/SectionLabel";
import StaggerGroup, { staggerItem } from "@/components/journey/StaggerGroup";
import { useJourney } from "@/contexts/JourneyContext";

const Stop1EnterName = () => {
  const navigate = useNavigate();
  const { startJourney, unknownSurname, reset } = useJourney();
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [emailError, setEmailError] = useState(false);

  // Coming back to Stop 1 after an UNKNOWN bounce: clear provider state
  // so the error message only shows once and subsequent submits start clean.
  useEffect(() => {
    if (unknownSurname && surname.length === 0) {
      // show the error, don't wipe yet — user hasn't started typing
      return;
    }
    if (surname.length > 0 && unknownSurname) {
      reset();
    }
  }, [surname, unknownSurname, reset]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || surname.trim().length === 0) return;
    
    // Email is required
    const trimmedEmail = email.trim();
    if (trimmedEmail.length === 0) {
      setEmailError(true);
      return;
    }
    setEmailError(false);
    
    setSubmitting(true);
    
    // Store email in localStorage
    localStorage.setItem("ancestra_email", trimmedEmail);
    
    // Fire in the background and navigate immediately — cinematic reveals
    // on Stops 2-5 absorb the latency.
    void startJourney(surname.trim());
    navigate("/journey/2");
    setSubmitting(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-24">
      <StaggerGroup className="w-full max-w-xl text-center">
        <motion.div variants={staggerItem}>
          <SectionLabel>BEGIN YOUR LEGACY</SectionLabel>
        </motion.div>

        <motion.h1
          variants={staggerItem}
          className="mt-6 font-display text-5xl leading-tight tracking-tight text-cream-warm sm:text-6xl"
        >
          Enter your name.
        </motion.h1>

        <motion.p
          variants={staggerItem}
          className="mt-5 font-serif text-lg italic text-cream-soft"
        >
          Every family has a story. Yours is waiting.
        </motion.p>

        {unknownSurname && (
          <motion.p
            variants={staggerItem}
            className="mt-6 font-serif text-sm italic text-amber-dim"
          >
            We couldn&apos;t find that name in the archives. Try the surname as it
            appears on a birth certificate.
          </motion.p>
        )}

        <motion.form
          variants={staggerItem}
          onSubmit={handleSubmit}
          className="mt-12 flex flex-col items-center gap-5"
        >
          <input
            type="text"
            value={surname}
            onChange={(e) => setSurname(e.target.value)}
            placeholder="e.g. Osmond"
            autoFocus
            disabled={submitting}
            className="w-full rounded-pill border border-amber-dim/30 bg-input px-8 py-5 text-center font-display text-2xl text-cream-warm placeholder:text-text-dim focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/30 disabled:opacity-60"
          />

          {/* Email capture section */}
          <div className="w-full flex flex-col items-center gap-3">
            <p className="font-sans text-[10px] uppercase tracking-[4px] text-amber-dim">
              YOUR EMAIL
            </p>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError(false);
              }}
              placeholder="your@email.com"
              disabled={submitting}
              className="w-full rounded-pill border border-amber-dim/30 bg-input px-8 py-4 text-center font-sans text-base text-cream-warm placeholder:text-text-dim focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/30 disabled:opacity-60"
            />
            {emailError && (
              <p className="font-sans text-xs text-rose-400">
                Enter your email to begin
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting || surname.trim().length === 0 || email.trim().length === 0}
            className="mt-6 rounded-pill px-12 py-4 font-sans text-[13px] font-semibold uppercase tracking-[1.5px] text-primary-foreground transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-60"
            style={{
              background: "linear-gradient(135deg, #e8943a, #c47828)",
              transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          >
            Discover My Legacy
          </button>
        </motion.form>
      </StaggerGroup>
    </div>
  );
};

export default Stop1EnterName;
