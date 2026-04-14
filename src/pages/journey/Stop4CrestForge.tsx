import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useState } from "react";
import SectionLabel from "@/components/journey/SectionLabel";
import ForgeLoader from "@/components/journey/ForgeLoader";
import CrestHero from "@/components/CrestHero";
import { osmondMock } from "@/data/osmondMock";

const FORGE_MESSAGES = [
  "Consulting the archives…",
  "Melting the gold…",
  "Inscribing the motto…",
];

const Stop4CrestForge = () => {
  const [forged, setForged] = useState(false);
  const d = osmondMock;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-24">
      <SectionLabel>THE FORGE</SectionLabel>

      <AnimatePresence mode="wait">
        {!forged ? (
          <motion.div key="loader" exit={{ opacity: 0 }} className="w-full">
            <ForgeLoader messages={FORGE_MESSAGES} onComplete={() => setForged(true)} />
          </motion.div>
        ) : (
          <motion.div key="reveal" className="flex w-full flex-col items-center">
            {/* Crest reveal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-5xl"
            >
              <div
                className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                style={{
                  width: "900px",
                  height: "900px",
                  background:
                    "radial-gradient(circle at center, hsla(30, 80%, 50%, 0.18) 0%, transparent 60%)",
                }}
              />
              <CrestHero minHeightVh={75} scale={1.7} />
            </motion.div>

            {/* Motto */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="mt-2 text-center"
            >
              <p className="font-serif text-2xl italic text-amber-light">
                {d.mottoLatin}
              </p>
              <p className="mt-2 font-sans text-sm tracking-[2px] text-amber-dim">
                {d.mottoEnglish.toUpperCase()}
              </p>
            </motion.div>

            {/* Symbolism grid */}
            <motion.div
              initial="hidden"
              animate="show"
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: 0.2, delayChildren: 1.2 } },
              }}
              className="mt-12 grid w-full max-w-4xl grid-cols-2 gap-4 md:grid-cols-4"
            >
              {d.symbolism.map((s) => (
                <motion.div
                  key={s.element}
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
                  }}
                  className="rounded-[14px] border border-amber-dim/20 bg-card/50 p-5 text-center"
                >
                  <div className="mx-auto mb-3 h-2 w-2 rounded-full bg-amber" />
                  <h4 className="font-display text-base text-cream-warm">
                    {s.element}
                  </h4>
                  <p className="mt-2 font-serif text-xs italic text-text-body">
                    {s.meaning}
                  </p>
                </motion.div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 2.2 }}
              className="mt-12"
            >
              <Link
                to="/journey/5"
                className="inline-block rounded-pill px-12 py-4 font-sans text-[13px] font-semibold uppercase tracking-[1.5px] text-primary-foreground transition-all duration-300 hover:-translate-y-0.5"
                style={{
                  background: "linear-gradient(135deg, #e8943a, #c47828)",
                  transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
                }}
              >
                Read Your Story
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Stop4CrestForge;
