import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import SectionLabel from "@/components/journey/SectionLabel";
import ForgeLoader from "@/components/journey/ForgeLoader";
import ScrollChevron from "@/components/ScrollChevron";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useMarkToolComplete } from "@/hooks/useMarkToolComplete";
import { fetchLegacy, fetchCrest } from "@/lib/legacyClient";
import type { LegacyFacts } from "@/types/legacy";

const FORGE_MESSAGES = [
  "Gathering the embers…",
  "Tracing the bloodline's symbols…",
  "Hammering shield and helm…",
  "Inscribing the motto…",
  "Forging your House crest…",
];

type Phase = "loading" | "ready" | "error";

const ForgeCrest = () => {
  const [phase, setPhase] = useState<Phase>("loading");
  const [error, setError] = useState<string | null>(null);
  const [surname, setSurname] = useState<string>("");
  const [facts, setFacts] = useState<LegacyFacts | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const ranRef = useRef(false);

  const displaySurname = facts?.displaySurname
    ?? (surname ? surname.charAt(0).toUpperCase() + surname.slice(1).toLowerCase() : "");

  usePageMeta({
    title: displaySurname ? `House of ${displaySurname} — Your Crest | AncestorsQR` : "Forge Your Crest — AncestorsQR",
    description: "Your family's coat of arms, motto, and symbolism — forged from history.",
  });

  useMarkToolComplete("crest", phase === "ready" && !!imageUrl);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setError("Please sign in."); setPhase("error"); return; }

        const { data: profile } = await supabase
          .from("profiles")
          .select("surname")
          .eq("id", user.id)
          .maybeSingle();

        const sn = (profile?.surname ?? "").trim();
        if (!sn) { setError("Add a surname to your profile to forge your crest."); setPhase("error"); return; }
        setSurname(sn);

        // 1) Facts (cached by generate-legacy server-side)
        const legacy = await fetchLegacy(sn);
        if (legacy.code !== "OK" || !legacy.facts) {
          setError("We couldn't read this surname's archive. Try again shortly.");
          setPhase("error");
          return;
        }
        setFacts(legacy.facts);

        // 2) Crest (cached by generate-crest server-side)
        const crest = await fetchCrest(sn, legacy.facts, user.id);
        setImageUrl(crest.imageUrl);
        setPhase("ready");
      } catch (e) {
        console.error("ForgeCrest error", e);
        setError("The forge cooled before we finished. Try again.");
        setPhase("error");
      }
    })();
  }, []);

  if (phase === "loading") {
    return (
      <div className="min-h-screen bg-background px-6 py-16">
        <ForgeLoader messages={FORGE_MESSAGES} loop perMessageMs={1400} />
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="min-h-screen bg-background px-6 py-24 text-center">
        <h1 className="font-display text-3xl text-cream-warm">Forge Your Crest</h1>
        <p className="mt-4 font-serif italic text-amber-light">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-[72vh] flex-col items-center justify-start bg-background px-6 pt-16 pb-32">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="flex w-full flex-col items-center"
      >
        <SectionLabel>YOUR CREST IS FORGED</SectionLabel>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="mb-8 text-center"
        >
          <p className="font-sans text-[10px] uppercase tracking-[4px] text-amber-dim">The House of</p>
          <h1 className="font-display text-4xl text-cream-warm sm:text-5xl">{displaySurname}</h1>
        </motion.div>

        {/* Amber glow */}
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            width: "900px",
            height: "900px",
            background: "radial-gradient(circle at center, hsla(30, 80%, 50%, 0.18) 0%, transparent 60%)",
          }}
        />

        {/* AI-generated crest */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 flex w-full max-w-sm justify-center"
          style={{ filter: "drop-shadow(0 0 60px rgba(212,160,74,0.3))" }}
        >
          {imageUrl && (
            <img
              src={imageUrl}
              alt={`${displaySurname} family crest`}
              className="w-full max-w-[420px] select-none"
              draggable={false}
            />
          )}
        </motion.div>

        {/* Motto */}
        {facts && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="mt-8 text-center"
          >
            <p className="font-serif text-xl italic text-amber-light">{facts.mottoLatin}</p>
            <p className="mt-1 font-sans text-[9px] uppercase tracking-[3px] text-amber-dim">
              {facts.mottoEnglish}
            </p>
          </motion.div>
        )}

        {/* Symbolism cards */}
        {facts && (
          <motion.div
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.15, delayChildren: 0.9 } },
            }}
            className="mt-10 grid w-full max-w-4xl grid-cols-2 gap-4 md:grid-cols-4"
          >
            {facts.symbolism.map((s) => (
              <motion.div
                key={s.element}
                variants={{
                  hidden: { opacity: 0, y: 10 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
                }}
                className="rounded-[14px] border border-amber-dim/20 bg-card/50 p-5 text-center"
              >
                <div className="mx-auto mb-3 h-2 w-2 rounded-full bg-amber" />
                <h4 className="font-display text-base text-cream-warm">{s.element}</h4>
                <p className="mt-2 font-serif text-xs italic text-text-body">{s.meaning}</p>
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>
      <ScrollChevron />
    </div>
  );
};

export default ForgeCrest;
