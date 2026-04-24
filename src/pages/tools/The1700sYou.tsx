import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Share2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Life1700s = {
  name: string;
  occupation: string;
  location: string;
  homeDescription: string;
  dailyRoutine: string;
  diet: string;
  dangers: string;
  lifeExpectancy: string;
  legacyLine: string;
};

const reveal = {
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
};

const DETAIL_CARDS = [
  { key: "occupation" as const, label: "Your Occupation" },
  { key: "location" as const, label: "Where You Lived" },
  { key: "homeDescription" as const, label: "Your Home" },
  { key: "dailyRoutine" as const, label: "Your Daily Routine" },
  { key: "diet" as const, label: "What You Ate" },
  { key: "dangers" as const, label: "Dangers You Faced" },
];

export default function The1700sYou() {
  const [surname, setSurname] = useState("");
  const [country, setCountry] = useState("");
  const [result, setResult] = useState<Life1700s | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!surname.trim() || loading) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        "the-1700s-you",
        { body: { surname: surname.trim(), country: country.trim() } },
      );
      if (fnError) throw new Error(fnError.message);
      if (!data || data.error) {
        setError(data?.error || "Something went wrong. Please try again.");
        return;
      }
      setResult(data as Life1700s);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!result) return;
    const text = `AncestorsQR just showed me my life in the 1700s:\n\n${result.name} — ${result.occupation} in ${result.location}\n\n"${result.legacyLine}"\n\nDiscover yours → ancestorsqr.com/tools/1700s`;
    if (navigator.share) {
      try { await navigator.share({ text }); } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    }
  };

  return (
    <div className="relative min-h-screen bg-background">
      {/* Video background */}
            <img src="/hero.jpg" alt="" className="pointer-events-none fixed inset-0 h-full w-full object-cover" style={{ objectPosition: "center 30%", opacity: 0.38, filter: "saturate(0.7) brightness(0.95)" }} />
      <div
        className="pointer-events-none fixed inset-0"
        style={{ background: "rgba(13,10,7,0.45)" }}
      />

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center px-4 pb-16 pt-24 text-center">
        <motion.p
          {...reveal}
          className="mb-3 font-sans text-[10px] uppercase tracking-[4px] text-amber-dim"
        >
          Free Tool
        </motion.p>
        <motion.h1
          {...reveal}
          transition={{ ...reveal.transition, delay: 0.1 }}
          className="font-display text-[clamp(28px,5vw,48px)] leading-tight text-cream-warm"
        >
          The 1700s You
        </motion.h1>
        <motion.p
          {...reveal}
          transition={{ ...reveal.transition, delay: 0.2 }}
          className="mt-4 max-w-md font-serif italic text-text-body"
          style={{ fontSize: "17px" }}
        >
          What would your life look like 300 years ago? Enter your surname and
          step back into history.
        </motion.p>

        {/* Form */}
        <motion.form
          {...reveal}
          transition={{ ...reveal.transition, delay: 0.3 }}
          onSubmit={handleSubmit}
          className="mt-10 flex w-full max-w-md flex-col gap-4"
        >
          <input
            type="text"
            value={surname}
            onChange={(e) => setSurname(e.target.value)}
            placeholder="Enter your surname"
            maxLength={60}
            className="rounded-pill border border-gold-line bg-input px-6 py-4 font-sans text-foreground placeholder:text-text-dim focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            type="text"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="Country of origin (optional)"
            maxLength={60}
            className="rounded-pill border border-gold-line bg-input px-6 py-4 font-sans text-foreground placeholder:text-text-dim focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="submit"
            disabled={loading || !surname.trim()}
            className="self-center rounded-pill px-10 py-4 font-sans text-[13px] font-semibold uppercase tracking-[1.5px] transition-all duration-[400ms] hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
            style={{ background: "linear-gradient(135deg, #e8943a, #c47828)", color: "#1a1208" }}
          >
            {loading ? "Stepping back in time…" : "Show Me My 1700s Life"}
          </button>
        </motion.form>

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 font-sans text-sm text-rose"
          >
            {error}
          </motion.p>
        )}
      </section>

      {/* Results */}
      <div className="relative z-10">
        <AnimatePresence>
          {result && (
            <motion.section
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="mx-auto max-w-2xl px-4 pb-12"
            >
              {/* Hero card */}
              <div
                className="rounded-[22px] p-8 text-center"
                style={{
                  background: "rgba(26,21,14,0.95)",
                  border: "1px solid rgba(232,148,58,0.2)",
                  boxShadow: "0 0 60px rgba(232,148,58,0.04)",
                }}
              >
                <p className="mb-2 font-sans text-[10px] uppercase tracking-[4px] text-amber-dim">
                  Your Life · circa 1720
                </p>
                <h2
                  className="font-display leading-tight text-cream-warm"
                  style={{ fontSize: "clamp(24px,4vw,36px)" }}
                >
                  {result.name}
                </h2>
                <p className="mt-1 font-sans text-[13px]" style={{ color: "#a07830" }}>
                  {result.occupation} · {result.location}
                </p>
                <div
                  className="mx-auto mt-4 h-px max-w-[120px]"
                  style={{ background: "rgba(212,160,74,0.2)" }}
                />
                <p className="mt-4 font-sans text-[13px]" style={{ color: "#8a7e6e" }}>
                  Life expectancy:{" "}
                  <span style={{ color: "#c4b8a6" }}>{result.lifeExpectancy}</span>
                </p>
              </div>

              {/* Detail cards */}
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {DETAIL_CARDS.map(({ key, label }, i) => (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.12 * i, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="rounded-xl border border-gold-line bg-card p-5"
                  >
                    <p className="mb-2 font-sans text-[10px] uppercase tracking-[3px] text-amber-dim">
                      {label}
                    </p>
                    <p className="font-sans text-sm leading-relaxed text-text-body">
                      {result[key]}
                    </p>
                  </motion.div>
                ))}
              </div>

              {/* Legacy line */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.65, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="mt-5 rounded-xl border border-gold-line bg-card p-6"
                style={{ borderLeft: "3px solid rgba(232,148,58,0.3)" }}
              >
                <p className="font-serif italic leading-relaxed text-cream-soft">
                  {result.legacyLine}
                </p>
              </motion.div>

              {/* Share */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-8 flex justify-center"
              >
                <button
                  onClick={handleShare}
                  className="flex items-center gap-2 rounded-pill px-8 py-3 font-sans text-[12px] font-semibold uppercase tracking-[1.5px] transition-all duration-[400ms] hover:-translate-y-0.5"
                  style={{
                    background: "rgba(232,148,58,0.06)",
                    border: "1px solid rgba(232,148,58,0.18)",
                    color: "#d4a04a",
                  }}
                >
                  <Share2 className="h-4 w-4" />
                  Share My 1700s Life
                </button>
              </motion.div>
            </motion.section>
          )}
        </AnimatePresence>
      </div>

      {/* Journey CTA */}
      <section className="relative z-10 py-20 text-center">
        <motion.p {...reveal} className="mb-4 font-sans text-sm text-text-dim">
          Curious about the real story behind your family name?
        </motion.p>
        <Link
          to="/journey/1"
          className="inline-block rounded-pill px-10 py-4 font-sans text-[13px] font-semibold uppercase tracking-[1.5px] transition-all duration-[400ms] hover:-translate-y-0.5"
          style={{
            background: "rgba(232,148,58,0.06)",
            border: "1px solid rgba(232,148,58,0.18)",
            color: "#d4a04a",
          }}
        >
          Begin Your Journey
        </Link>
      </section>
    </div>
  );
}
