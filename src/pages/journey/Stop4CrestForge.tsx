import { useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import SectionLabel from "@/components/journey/SectionLabel";
import ForgeLoader from "@/components/journey/ForgeLoader";
import RetryInline from "@/components/journey/RetryInline";
import { useJourney } from "@/contexts/JourneyContext";

const FORGE_MESSAGES = [
  "Consulting the archives…",
  "Melting the gold…",
  "Inscribing the motto…",
];

const Stop4CrestForge = () => {
  const navigate = useNavigate();
  const { unknownSurname, surname, facts, crest } = useJourney();

  useEffect(() => {
    if (unknownSurname) navigate("/journey/1", { replace: true });
    else if (!surname) navigate("/journey/1", { replace: true });
  }, [unknownSurname, surname, navigate]);

  if (!surname) return null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-24">
      {(crest.status === "idle" || crest.status === "loading") && (
        <SectionLabel>THE FORGE</SectionLabel>
      )}
      {(crest.status === "idle" || crest.status === "loading") && (
        <ForgeLoader messages={FORGE_MESSAGES} loop />
      )}

      {crest.status === "error" && (
        <div className="mt-10">
          <RetryInline onRetry={crest.retry} />
        </div>
      )}

      {crest.status === "ready" && crest.data && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="flex w-full flex-col items-center"
        >
          {/* Family name */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-6 text-center"
          >
            <p className="font-sans text-[10px] uppercase tracking-[4px] text-amber-dim">
              The House of
            </p>
            <h1 className="font-display text-4xl text-cream-warm sm:text-5xl">
              {facts.data?.displaySurname ?? surname}
            </h1>
          </motion.div>

          {/* Amber glow behind crest */}
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{
              width: "900px",
              height: "900px",
              background:
                "radial-gradient(circle at center, hsla(30, 80%, 50%, 0.18) 0%, transparent 60%)",
            }}
          />

          {/* Crest image + motto ribbon overlay */}
          <div
            className="relative z-10 w-full max-w-2xl rounded-[22px]"
            style={{
              minHeight: "400px",
              boxShadow: "0 0 80px rgba(212,160,74,0.25), 0 0 0 1px rgba(212,160,74,0.15), 0 32px 80px rgba(0,0,0,0.6)",
            }}
          >
            <img
              src={crest.data.imageUrl}
              alt={`${facts.data?.displaySurname ?? surname} family crest`}
              className="w-full rounded-[22px]"
              style={{ maxHeight: "70vh", objectFit: "contain", display: "block" }}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "/crest.png";
                (e.currentTarget as HTMLImageElement).style.padding = "40px";
                (e.currentTarget as HTMLImageElement).style.filter = "drop-shadow(0 0 40px rgba(212,160,74,0.5))";
              }}
            />
            {facts.status === "ready" && facts.data && (
              <div
                className="absolute bottom-0 left-0 right-0 rounded-b-[22px] px-6 pb-5 pt-10 text-center"
                style={{
                  background: "linear-gradient(to top, rgba(13,10,7,0.92) 0%, rgba(13,10,7,0.6) 60%, transparent 100%)",
                }}
              >
                <p className="font-serif text-xl italic text-amber-light drop-shadow-lg">
                  {facts.data.mottoLatin}
                </p>
                <p className="mt-1 font-sans text-[9px] uppercase tracking-[3px] text-amber-dim">
                  {facts.data.mottoEnglish}
                </p>
              </div>
            )}
          </div>

          {/* Symbolism cards */}
          {facts.status === "ready" && facts.data && (
            <>

              <motion.div
                initial="hidden"
                animate="show"
                variants={{
                  hidden: {},
                  show: { transition: { staggerChildren: 0.2, delayChildren: 1.2 } },
                }}
                className="mt-12 grid w-full max-w-4xl grid-cols-2 gap-4 md:grid-cols-4"
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
                    <h4 className="font-display text-base text-cream-warm">
                      {s.element}
                    </h4>
                    <p className="mt-2 font-serif text-xs italic text-text-body">
                      {s.meaning}
                    </p>
                  </motion.div>
                ))}
              </motion.div>
            </>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 2.2 }}
            className="mt-12"
          >
            <Link
              to={crest.status === "ready" ? "/journey/5" : "#"}
              onClick={crest.status !== "ready" ? (e) => e.preventDefault() : undefined}
              className="inline-block rounded-pill px-12 py-4 font-sans text-[13px] font-semibold uppercase tracking-[1.5px] text-primary-foreground transition-all duration-300"
              style={{
                background: "linear-gradient(135deg, #e8943a, #c47828)",
                opacity: crest.status === "ready" ? 1 : 0.4,
                cursor: crest.status === "ready" ? "pointer" : "not-allowed",
              }}
            >
              Read Your Story
            </Link>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default Stop4CrestForge;
