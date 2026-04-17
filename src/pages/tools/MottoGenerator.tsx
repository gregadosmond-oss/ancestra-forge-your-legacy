import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Share2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type BreakdownWord = { latin: string; english: string };

type MottoResult = {
  mottoLatin: string;
  mottoEnglish: string;
  breakdown: BreakdownWord[];
  legacySentence: string;
};

const reveal = {
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
};

const placeholders = ["Courage", "Family", "Loyalty"];
const labels = ["First Value", "Second Value", "Third Value"];

export default function MottoGenerator() {
  const [values, setValues] = useState(["", "", ""]);
  const [result, setResult] = useState<MottoResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateValue = (i: number, v: string) => {
    setValues((prev) => {
      const next = [...prev];
      next[i] = v;
      return next;
    });
  };

  const canSubmit = values.every((v) => v.trim().length > 0) && !loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        "motto-generator",
        { body: { values: values.map((v) => v.trim()) } },
      );
      if (fnError) throw new Error(fnError.message);
      if (!data || data.error) {
        setError(data?.error || "Something went wrong. Please try again.");
        return;
      }
      setResult(data as MottoResult);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!result) return;
    const text = `My family motto, forged by AncestorsQR:\n\n"${result.mottoLatin}"\n${result.mottoEnglish}\n\nDiscover yours → ancestorsqr.com/tools/motto`;
    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch {
        /* user cancelled */
      }
    } else {
      await navigator.clipboard.writeText(text);
      toast.success("Motto copied to clipboard");
    }
  };

  return (
    <div className="relative min-h-screen bg-background">
      {/* Castle video background */}
            <img src="/hero.jpg" alt="" className="pointer-events-none fixed inset-0 h-full w-full object-cover" style={{ objectPosition: "center 30%", opacity: 0.13, filter: "saturate(0.5) brightness(0.7)" }} />
      <div className="pointer-events-none fixed inset-0" style={{ background: "rgba(13,10,7,0.78)" }} />
      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center justify-center px-4 pt-24 pb-16 text-center">
        <motion.p
          {...reveal}
          className="mb-3 text-[10px] uppercase tracking-[4px] text-amber-dim font-sans"
        >
          Motto Generator
        </motion.p>
        <motion.h1
          {...reveal}
          transition={{ ...reveal.transition, delay: 0.1 }}
          className="font-display text-cream-warm text-[clamp(28px,5vw,48px)] leading-tight"
        >
          Your values. Your words. Your legacy.
        </motion.h1>
        <motion.p
          {...reveal}
          transition={{ ...reveal.transition, delay: 0.2 }}
          className="mt-4 max-w-md font-serif italic text-text-body text-[17px]"
        >
          Enter 3 values that define you — we'll forge your Latin motto.
        </motion.p>

        {/* Inputs */}
        <motion.form
          {...reveal}
          transition={{ ...reveal.transition, delay: 0.3 }}
          onSubmit={handleSubmit}
          className="mt-10 flex w-full max-w-lg flex-col gap-5"
        >
          {values.map((val, i) => (
            <div key={i} className="flex flex-col gap-1.5 text-left">
              <label className="text-[10px] uppercase tracking-[3px] text-amber-dim font-sans">
                {labels[i]}
              </label>
              <input
                type="text"
                value={val}
                onChange={(e) => updateValue(i, e.target.value)}
                placeholder={placeholders[i]}
                maxLength={60}
                className="rounded-pill border border-gold-line bg-input px-6 py-4 text-foreground font-sans placeholder:text-text-dim focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          ))}

          <button
            type="submit"
            disabled={!canSubmit}
            className="mt-2 self-center rounded-pill px-10 py-4 text-[13px] font-semibold uppercase tracking-[1.5px] font-sans transition-all duration-[400ms] hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
            style={{
              background: "linear-gradient(135deg, #e8943a, #c47828)",
              color: "#1a1208",
            }}
          >
            {loading ? "Forging…" : "Forge My Motto"}
          </button>
        </motion.form>

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 text-rose font-sans text-sm"
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
            {/* Motto */}
            <div className="text-center">
              <motion.h2
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="font-display text-amber-light text-[clamp(26px,5vw,42px)] leading-tight"
              >
                "{result.mottoLatin}"
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-3 font-serif italic text-cream-soft text-lg"
              >
                {result.mottoEnglish}
              </motion.p>
            </div>

            {/* Word Breakdown Card */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="mt-10 rounded-xl border border-gold-line bg-card p-6"
            >
              <p className="mb-4 text-[10px] uppercase tracking-[3px] text-amber-dim font-sans">
                Word-by-Word Breakdown
              </p>
              <div className="flex flex-col gap-3">
                {result.breakdown.map((word, i) => (
                  <div key={i} className="flex items-baseline gap-3">
                    <span className="font-display text-amber text-lg">
                      {word.latin}
                    </span>
                    <span className="text-text-dim font-sans text-xs">—</span>
                    <span className="text-text-body font-sans text-sm">
                      {word.english}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Legacy Sentence */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="mt-6 rounded-xl border border-gold-line bg-card p-6"
              style={{
                borderLeft: "3px solid rgba(232,148,58,0.3)",
              }}
            >
              <p className="font-serif italic text-cream-soft leading-relaxed">
                {result.legacySentence}
              </p>
            </motion.div>

            {/* Share Button */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.75 }}
              className="mt-8 flex justify-center"
            >
              <button
                onClick={handleShare}
                className="flex items-center gap-2 rounded-pill px-8 py-3 text-[12px] font-semibold uppercase tracking-[1.5px] font-sans transition-all duration-[400ms] hover:-translate-y-0.5"
                style={{
                  background: "rgba(232,148,58,0.06)",
                  border: "1px solid rgba(232,148,58,0.18)",
                  color: "#d4a04a",
                }}
              >
                <Share2 className="h-4 w-4" />
                Share My Motto
              </button>
            </motion.div>
          </motion.section>
        )}
      </AnimatePresence>
      </div>

      {/* Journey CTA */}
      <section className="relative z-10 py-20 text-center">
        <motion.p
          {...reveal}
          className="mb-4 text-text-body font-sans text-base"
        >
          Your motto is forged. Now discover your full legacy.
        </motion.p>
        <Link
          to="/journey"
          className="inline-block rounded-pill px-10 py-4 text-[13px] font-semibold uppercase tracking-[1.5px] font-sans transition-all duration-[400ms] hover:-translate-y-0.5"
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
