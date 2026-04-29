import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, Calendar, Shield, ScrollText, User, Compass, Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import JourneyGate from "@/components/JourneyGate";
import ScrollChevron from "@/components/ScrollChevron";
import { useEmailGate } from "@/hooks/useEmailGate";

type SurnameResult = {
  surname: string;
  meaning: string;
  origin: string;
  dateFirstRecorded: string;
  ancestralRole: string;
  motto?: string;
  famousBearers?: string;
  migration?: string;
  coatOfArmsHint?: string;
};

const reveal = {
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
};

const baseCards = [
  { key: "meaning", label: "Meaning", icon: Search },
  { key: "origin", label: "Origin", icon: MapPin },
  { key: "dateFirstRecorded", label: "Date First Recorded", icon: Calendar },
  { key: "ancestralRole", label: "Ancestral Role", icon: Shield },
] as const;

const extraCards = [
  { key: "motto", label: "House Motto", icon: ScrollText },
  { key: "famousBearers", label: "Famous Bearers", icon: User },
  { key: "migration", label: "Migration", icon: Compass },
  { key: "coatOfArmsHint", label: "Coat of Arms", icon: Crown },
] as const;

function MottoDisplay({ value }: { value: string }) {
  const parts = value.split(/\s—\s|\s-\s/);
  if (parts.length >= 2) {
    return (
      <>
        <p className="font-serif italic text-amber-light text-lg leading-relaxed">{parts[0].trim()}</p>
        <p className="text-text-dim font-sans text-sm mt-1">{parts.slice(1).join(" — ").trim()}</p>
      </>
    );
  }
  return <p className="font-serif italic text-amber-light leading-relaxed">{value}</p>;
}

export default function SurnameLookup() {
  const [surname, setSurname] = useState("");
  const [result, setResult] = useState<SurnameResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { gateOpen, requestProceed, handleGateSuccess } = useEmailGate();

  const runLookup = async () => {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!surname.trim() || loading) return;
    requestProceed(() => { void runLookup(); });
  };

  const handleCopy = async () => {
    if (!result) return;
    const shareText = `My surname ${result.surname} means ${result.meaning} first recorded ${result.dateFirstRecorded} in ${result.origin}. Ancestral role: ${result.ancestralRole} What's hiding in your name? ancestorsqr.com`;
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Couldn't copy to clipboard.");
    }
  };

  return (
    <div className="relative min-h-screen bg-background">
      <JourneyGate open={gateOpen} source="tool-surname-lookup" surname={surname} onSuccess={handleGateSuccess} />
      {/* Castle video background */}
            <img src="/hero.jpg" alt="" className="pointer-events-none fixed inset-0 h-full w-full object-cover" style={{ objectPosition: "center 30%", opacity: 0.38, filter: "saturate(0.7) brightness(0.95)" }} />
      <div className="pointer-events-none fixed inset-0" style={{ background: "rgba(13,10,7,0.45)" }} />
      {/* Hero */}
      <section className="relative z-10 flex min-h-[72vh] flex-col items-center justify-center px-4 pt-24 pb-16 text-center">
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
            aria-label="Surname to look up"
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
        <ScrollChevron />
      </section>

      {/* Results */}
      <div className="relative z-10">
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
              {baseCards.map(({ key, label, icon: Icon }, i) => (
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

              {extraCards.map(({ key, label, icon: Icon }, i) => {
                const value = result[key];
                if (!value || value === "UNKNOWN") return null;
                return (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.6,
                      delay: 0.15 * (baseCards.length + i),
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
                    {key === "motto" ? (
                      <MottoDisplay value={value} />
                    ) : (
                      <p className="text-text-body font-sans leading-relaxed whitespace-pre-line">
                        {value}
                      </p>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Share button */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="mt-10 flex justify-center"
            >
              <button
                type="button"
                onClick={handleCopy}
                className="rounded-pill px-10 py-4 text-[13px] font-semibold uppercase tracking-[1.5px] font-sans transition-all duration-[400ms] hover:-translate-y-0.5"
                style={{
                  background: copied ? "rgba(74,158,106,0.12)" : "rgba(232,148,58,0.06)",
                  border: `1px solid ${copied ? "rgba(74,158,106,0.4)" : "rgba(232,148,58,0.18)"}`,
                  color: copied ? "#7fc99a" : "#d4a04a",
                }}
              >
                {copied ? "Copied!" : "Share Your Results"}
              </button>
            </motion.div>
          </motion.section>
        )}
      </AnimatePresence>
      </div>

      {/* Journey CTA */}
      <section className="relative z-10 px-4 py-20 text-center">
        <motion.p
          {...reveal}
          className="mb-4 text-text-dim font-sans text-sm"
        >
          Want the full picture — crest, story, and bloodline?
        </motion.p>
        <Link
          to="/journey/1"
          className="block w-full max-w-2xl mx-auto rounded-pill px-10 py-5 text-[13px] font-semibold uppercase tracking-[1.5px] font-sans transition-all duration-[400ms] hover:-translate-y-0.5"
          style={{
            background: "linear-gradient(135deg, #e8943a, #c47828)",
            color: "#1a1208",
          }}
        >
          {result ? `Forge Your ${result.surname} Crest →` : "Begin Your Journey →"}
        </Link>
      </section>
    </div>
  );
}
