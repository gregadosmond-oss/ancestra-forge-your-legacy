import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Share2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import JourneyGate from "@/components/JourneyGate";
import { useEmailGate } from "@/hooks/useEmailGate";
import { toast } from "sonner";

type QuizResult = {
  archetype: string;
  description: string;
  traits: string[];
  historicalExample: string;
  motto: string;
};

const questions = [
  {
    q: "When faced with a challenge, you...",
    options: [
      { letter: "A", text: "Fight through it head-on" },
      { letter: "B", text: "Build a plan and execute" },
      { letter: "C", text: "Explore every angle first" },
      { letter: "D", text: "Support those around you" },
    ],
  },
  {
    q: "Your family remembers you as...",
    options: [
      { letter: "A", text: "The protector" },
      { letter: "B", text: "The one who built things" },
      { letter: "C", text: "The adventurer" },
      { letter: "D", text: "The one who held everyone together" },
    ],
  },
  {
    q: "In a crisis, your instinct is to...",
    options: [
      { letter: "A", text: "Lead from the front" },
      { letter: "B", text: "Organise and solve" },
      { letter: "C", text: "Find a new path" },
      { letter: "D", text: "Keep people calm" },
    ],
  },
  {
    q: "Your greatest strength is...",
    options: [
      { letter: "A", text: "Courage" },
      { letter: "B", text: "Discipline" },
      { letter: "C", text: "Curiosity" },
      { letter: "D", text: "Empathy" },
    ],
  },
  {
    q: "The legacy you want to leave is...",
    options: [
      { letter: "A", text: "A name people respected" },
      { letter: "B", text: "Something that outlasts you" },
      { letter: "C", text: "Stories of where you went" },
      { letter: "D", text: "A family that stayed together" },
    ],
  },
];

const reveal = {
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
};

export default function BloodlineQuiz() {
  const [step, setStep] = useState(0); // 0 = intro, 1-5 = questions, 6 = loading/result
  const [answers, setAnswers] = useState<string[]>([]);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnswer = async (letter: string) => {
    const newAnswers = [...answers, letter];
    setAnswers(newAnswers);

    if (newAnswers.length < 5) {
      setStep(step + 1);
    } else {
      // All answered — submit
      setStep(6);
      setLoading(true);
      setError(null);
      try {
        const { data, error: fnError } = await supabase.functions.invoke(
          "bloodline-quiz",
          { body: { answers: newAnswers } },
        );
        if (fnError) throw new Error(fnError.message);
        if (!data || data.error) {
          setError(data?.error || "Something went wrong. Please try again.");
          return;
        }
        setResult(data as QuizResult);
      } catch {
        setError("Something went wrong. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleShare = async () => {
    if (!result) return;
    const text = `My bloodline archetype is The ${result.archetype}.\n\n"${result.motto}"\n\nDiscover yours → ancestorsqr.com/tools/quiz`;
    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(text);
      toast.success("Result copied to clipboard");
    }
  };

  const restart = () => {
    setStep(0);
    setAnswers([]);
    setResult(null);
    setError(null);
  };

  const questionIndex = step - 1;

  const { gateOpen, requestProceed, handleGateSuccess } = useEmailGate();

  return (
    <div className="relative min-h-screen bg-background">
      <JourneyGate open={gateOpen} source="tool-bloodline-quiz" onSuccess={handleGateSuccess} />
      {/* Castle video background */}
            <img src="/hero.jpg" alt="" className="pointer-events-none fixed inset-0 h-full w-full object-cover" style={{ objectPosition: "center 30%", opacity: 0.38, filter: "saturate(0.7) brightness(0.95)" }} />
      <div className="pointer-events-none fixed inset-0" style={{ background: "rgba(13,10,7,0.45)" }} />
      {/* Content */}
      <div className="relative z-10">

      {/* Intro */}
      {step === 0 && (
        <section className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
          <motion.p
            {...reveal}
            className="mb-3 text-[10px] uppercase tracking-[4px] text-amber-dim font-sans"
          >
            Bloodline Quiz
          </motion.p>
          <motion.h1
            {...reveal}
            transition={{ ...reveal.transition, delay: 0.1 }}
            className="font-display text-cream-warm text-[clamp(28px,5vw,48px)] leading-tight"
          >
            What runs in your blood?
          </motion.h1>
          <motion.p
            {...reveal}
            transition={{ ...reveal.transition, delay: 0.2 }}
            className="mt-4 max-w-md font-serif italic text-text-body text-[17px]"
          >
            5 questions. Centuries of instinct. One archetype.
          </motion.p>
          <motion.button
            {...reveal}
            transition={{ ...reveal.transition, delay: 0.35 }}
            onClick={() => requestProceed(() => setStep(1))}
            className="mt-10 rounded-pill px-10 py-4 text-[13px] font-semibold uppercase tracking-[1.5px] font-sans transition-all duration-[400ms] hover:-translate-y-0.5"
            style={{
              background: "linear-gradient(135deg, #e8943a, #c47828)",
              color: "#1a1208",
            }}
          >
            Begin the Quiz
          </motion.button>
        </section>
      )}

      {/* Questions */}
      <AnimatePresence mode="wait">
        {step >= 1 && step <= 5 && (
          <motion.section
            key={`q-${step}`}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center"
          >
            {/* Progress */}
            <p className="mb-8 text-[10px] uppercase tracking-[4px] text-amber-dim font-sans">
              Question {step} of 5
            </p>

            {/* Progress bar */}
            <div className="mb-10 h-1 w-full max-w-md overflow-hidden rounded-full bg-gold-line">
              <motion.div
                className="h-full rounded-full"
                style={{ background: "linear-gradient(135deg, #e8943a, #c47828)" }}
                initial={{ width: `${((step - 1) / 5) * 100}%` }}
                animate={{ width: `${(step / 5) * 100}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>

            <h2 className="font-display text-cream text-[clamp(20px,4vw,32px)] leading-snug max-w-lg">
              {questions[questionIndex].q}
            </h2>

            <div className="mt-10 flex w-full max-w-lg flex-col gap-3">
              {questions[questionIndex].options.map((opt) => (
                <button
                  key={opt.letter}
                  onClick={() => handleAnswer(opt.letter)}
                  className="group w-full rounded-pill px-8 py-4 text-left font-sans text-sm transition-all duration-[400ms] hover:-translate-y-0.5"
                  style={{
                    background: "rgba(232,148,58,0.04)",
                    border: "1px solid rgba(232,148,58,0.12)",
                    color: "#d0c4b4",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(232,148,58,0.1)";
                    e.currentTarget.style.borderColor = "rgba(232,148,58,0.25)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(232,148,58,0.04)";
                    e.currentTarget.style.borderColor = "rgba(232,148,58,0.12)";
                  }}
                >
                  <span className="mr-3 text-amber-dim font-semibold">{opt.letter})</span>
                  {opt.text}
                </button>
              ))}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Loading / Result */}
      {step === 6 && (
        <section className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-4"
            >
              <div
                className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"
                style={{ borderColor: "rgba(232,148,58,0.3)", borderTopColor: "transparent" }}
              />
              <p className="font-serif italic text-text-body">Reading your bloodline…</p>
            </motion.div>
          )}

          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4">
              <p className="text-rose font-sans text-sm">{error}</p>
              <button
                onClick={restart}
                className="rounded-pill px-8 py-3 text-[12px] font-semibold uppercase tracking-[1.5px] font-sans"
                style={{
                  background: "rgba(232,148,58,0.06)",
                  border: "1px solid rgba(232,148,58,0.18)",
                  color: "#d4a04a",
                }}
              >
                Try Again
              </button>
            </motion.div>
          )}

          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="mx-auto w-full max-w-2xl"
              >
                {/* Archetype Name */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="mb-2 text-[10px] uppercase tracking-[4px] text-amber-dim font-sans"
                >
                  Your Bloodline Archetype
                </motion.p>
                <motion.h2
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, duration: 0.7 }}
                  className="font-display text-amber-light text-[clamp(32px,6vw,56px)] leading-tight"
                >
                  The {result.archetype}
                </motion.h2>

                {/* Description */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="mt-6 text-text-body font-sans text-base leading-relaxed max-w-lg mx-auto"
                >
                  {result.description}
                </motion.p>

                {/* Traits */}
                {result.traits?.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="mt-8 flex flex-wrap justify-center gap-3"
                  >
                    {result.traits.map((trait, i) => (
                      <span
                        key={i}
                        className="rounded-pill px-5 py-2 text-[11px] uppercase tracking-[2px] font-sans font-semibold"
                        style={{
                          background: "rgba(212,160,74,0.08)",
                          border: "1px solid rgba(212,160,74,0.2)",
                          color: "#d4a04a",
                        }}
                      >
                        {trait}
                      </span>
                    ))}
                  </motion.div>
                )}

                {/* Historical Example Card */}
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.65, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="mt-8 rounded-xl border border-gold-line bg-card p-6"
                  style={{ borderLeft: "3px solid rgba(232,148,58,0.3)" }}
                >
                  <p className="mb-2 text-[10px] uppercase tracking-[3px] text-amber-dim font-sans">
                    Historical Example
                  </p>
                  <p className="font-serif italic text-cream-soft leading-relaxed">
                    {result.historicalExample}
                  </p>
                </motion.div>

                {/* Motto */}
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="mt-8"
                >
                  <p className="mb-2 text-[10px] uppercase tracking-[3px] text-amber-dim font-sans">
                    Your ancestral Motto
                  </p>
                  <p className="font-display text-cream-warm text-[clamp(20px,4vw,28px)] leading-snug">
                    "{result.motto}"
                  </p>
                </motion.div>

                {/* Share + Restart */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.85 }}
                  className="mt-10 flex flex-wrap items-center justify-center gap-4"
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
                    Share Result
                  </button>
                  <button
                    onClick={restart}
                    className="rounded-pill px-8 py-3 text-[12px] font-semibold uppercase tracking-[1.5px] font-sans text-text-dim transition-all duration-[400ms] hover:text-text-body"
                  >
                    Retake Quiz
                  </button>
                </motion.div>

                {/* Journey CTA */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="mt-16 text-center"
                >
                  <p className="mb-4 text-text-body font-sans text-base">
                    Your bloodline has spoken. Now discover your full story.
                  </p>
                  <Link
                    to="/journey/1"
                    className="inline-block rounded-pill px-10 py-4 text-[13px] font-semibold uppercase tracking-[1.5px] font-sans transition-all duration-[400ms] hover:-translate-y-0.5"
                    style={{
                      background: "linear-gradient(135deg, #e8943a, #c47828)",
                      color: "#1a1208",
                    }}
                  >
                    Begin Your Journey
                  </Link>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      )}
      </div>
    </div>
  );
}
