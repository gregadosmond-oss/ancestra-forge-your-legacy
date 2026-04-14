import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, Calendar, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type SurnameResult = {
  surname: string;
  meaning: string;
  origin: string;
  dateFirstRecorded: string;
  ancestralRole: string;
};

const reveal = {
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
};

const cards = [
  { key: "meaning", label: "Meaning", icon: Search },
  { key: "origin", label: "Origin", icon: MapPin },
  { key: "dateFirstRecorded", label: "Date First Recorded", icon: Calendar },
  { key: "ancestralRole", label: "Ancestral Role", icon: Shield },
] as const;

export default function SurnameLookup() {
  const [surname, setSurname] = useState("");
  const [result, setResult] = useState<SurnameResult | null>(null);
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
        "surname-lookup",
        { body: { surname: surname.trim() } },
      );
      if (fnError) throw new Error(fnError.message);
      if (!data || data.meaning === "UNKNOWN") {
        setError("We couldn't find information for that surname. Try another.");
        return;
      }
      setResult(data as SurnameResult);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center px-4 pt-24 pb-16 text-center">
        <motion.p
          {...reveal}
          className="mb-3 text-[10px] uppercase tracking-[4px] text-amber-dim font-sans"
        >
          Free Tool
        </motion.p>
        <motion.h1
          {...reveal}
          transition={{ ...reveal.transition, delay: 0.1 }}
          className="font-display text-cream-warm text-[clamp(28px,5vw,48px)] leading-tight"
        >
          Surname Lookup
        </motion.h1>
        <motion.p
          {...reveal}
          transition={{ ...reveal.transition, delay: 0.2 }}
          className="mt-4 max-w-md text-text-body font-sans text-base"
        >
          Enter any surname and discover the story hiding inside it.
        </motion.p>

        {/* Input */}
        <motion.form
          {...reveal}
          transition={{ ...reveal.transition, delay: 0.3 }}
          onSubmit={handleSubmit}
          className="mt-10 flex w-full max-w-md flex-col gap-4 sm:flex-row"
        >
          <input
            type="text"
            value={surname}
            onChange={(e) => setSurname(e.target.value)}
            placeholder="Enter a surname"
            maxLength={60}
            className="flex-1 rounded-pill border border-gold-line bg-input px-6 py-4 text-foreground font-sans placeholder:text-text-dim focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="submit"
            disabled={loading || !surname.trim()}
            className="rounded-pill px-10 py-4 text-[13px] font-semibold uppercase tracking-[1.5px] font-sans transition-all duration-[400ms] hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
            style={{
              background: "linear-gradient(135deg, #e8943a, #c47828)",
              color: "#1a1208",
            }}
          >
            {loading ? "Searching…" : "Discover"}
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
      <AnimatePresence>
        {result && (
          <motion.section
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto max-w-4xl px-4 pb-12"
          >
            <h2 className="mb-2 text-center font-display text-cream text-[clamp(22px,4vw,36px)]">
              The House of{" "}
              <span className="text-amber-light italic font-serif">
                {result.surname}
              </span>
            </h2>

            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              {cards.map(({ key, label, icon: Icon }, i) => (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.6,
                    delay: 0.15 * i,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="rounded-xl border border-gold-line bg-card p-6 transition-all duration-[400ms] hover:border-amber-dim/30"
                >
                  <div className="mb-3 flex items-center gap-2">
                    <Icon className="h-4 w-4 text-amber" />
                    <span className="text-[10px] uppercase tracking-[3px] text-amber-dim font-sans">
                      {label}
                    </span>
                  </div>
                  <p className="text-text-body font-sans leading-relaxed">
                    {result[key]}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Journey CTA */}
      <section className="py-20 text-center">
        <motion.p
          {...reveal}
          className="mb-4 text-text-dim font-sans text-sm"
        >
          Want the full picture — crest, story, and bloodline?
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
