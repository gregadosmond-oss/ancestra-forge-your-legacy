import { useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import SectionLabel from "@/components/journey/SectionLabel";
import FreeCrest from "@/components/FreeCrest";
import { useJourney } from "@/contexts/JourneyContext";

const Stop4CrestForge = () => {
  const navigate = useNavigate();
  const { unknownSurname, surname, facts } = useJourney();

  useEffect(() => {
    if (unknownSurname) navigate("/journey/1", { replace: true });
    else if (!surname) navigate("/journey/1", { replace: true });
  }, [unknownSurname, surname, navigate]);

  if (!surname) return null;

  const normalized = surname.trim().toLowerCase().replace(/\s+/g, "-");
  const legacyUrl = `${window.location.origin}/f/${normalized}`;
  const displaySurname = facts.data?.displaySurname ?? surname;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-24">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="flex w-full flex-col items-center"
      >
        <SectionLabel>YOUR CREST IS FORGED</SectionLabel>

        {/* Family name */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="mb-8 text-center"
        >
          <p className="font-sans text-[10px] uppercase tracking-[4px] text-amber-dim">
            The House of
          </p>
          <h1 className="font-display text-4xl text-cream-warm sm:text-5xl">
            {displaySurname}
          </h1>
        </motion.div>

        {/* Amber glow */}
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            width: "900px",
            height: "900px",
            background:
              "radial-gradient(circle at center, hsla(30, 80%, 50%, 0.18) 0%, transparent 60%)",
          }}
        />

        {/* Crest */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 flex w-full max-w-sm justify-center"
          style={{
            filter: "drop-shadow(0 0 60px rgba(212,160,74,0.3))",
          }}
        >
          <FreeCrest surname={surname} legacyUrl={legacyUrl} />
        </motion.div>

        {/* Legacy Pack upsell */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-4 font-serif text-sm italic text-center"
          style={{ color: "#a07830" }}
        >
          ✦ Your personalised coat of arms is forged when you unlock the Legacy Pack
        </motion.p>

        {/* Motto */}
        {facts.status === "ready" && facts.data && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="mt-6 text-center"
          >
            <p className="font-serif text-xl italic text-amber-light">
              {facts.data.mottoLatin}
            </p>
            <p className="mt-1 font-sans text-[9px] uppercase tracking-[3px] text-amber-dim">
              {facts.data.mottoEnglish}
            </p>
          </motion.div>
        )}

        {/* Symbolism cards */}
        {facts.status === "ready" && facts.data && (
          <motion.div
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.15, delayChildren: 0.9 } },
            }}
            className="mt-10 grid w-full max-w-4xl grid-cols-2 gap-4 md:grid-cols-4"
          >
            {facts.data.symbolism.map((s) => (
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

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.4 }}
          className="mt-12"
        >
          <Link
            to="/journey/5"
            className="inline-block rounded-pill px-12 py-4 font-sans text-[13px] font-semibold uppercase tracking-[1.5px] text-primary-foreground transition-all duration-300 hover:-translate-y-0.5"
            style={{ background: "linear-gradient(135deg, #e8943a, #c47828)" }}
          >
            Read Your Story
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Stop4CrestForge;
