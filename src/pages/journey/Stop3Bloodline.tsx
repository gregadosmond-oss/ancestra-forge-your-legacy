import { useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import SectionLabel from "@/components/journey/SectionLabel";
import MigrationPath from "@/components/journey/MigrationPath";
import RetryInline from "@/components/journey/RetryInline";
import ScrollChevron from "@/components/ScrollChevron";
import { useJourney } from "@/contexts/JourneyContext";

const Stop3Bloodline = () => {
  const navigate = useNavigate();
  const { unknownSurname, surname, facts } = useJourney();

  useEffect(() => {
    if (unknownSurname) navigate("/journey/1", { replace: true });
    else if (!surname) navigate("/journey/1", { replace: true });
  }, [unknownSurname, surname, navigate]);

  if (!surname) return null;

  const waypoints = facts.data?.migration.waypoints ?? [];
  const closingLine = facts.data?.migration.closingLine;
  const totalReveal = waypoints.length * 0.18 + 0.5;

  return (
    <div className="relative flex min-h-[72vh] flex-col items-center justify-start px-6 pt-16 pb-32">
      <div className="mb-10 text-center">
        <SectionLabel>WHERE YOUR NAME TRAVELED</SectionLabel>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mt-4 font-display text-4xl tracking-tight text-cream-warm sm:text-5xl"
        >
          From hill to harbour.
        </motion.h1>
      </div>

      {facts.status === "loading" && (
        <p className="font-serif text-sm italic text-amber-dim">
          Tracing the path of your name…
        </p>
      )}

      {facts.status === "error" && <RetryInline onRetry={facts.retry} />}

      {facts.status === "ready" && facts.data && (
        <>
          <MigrationPath waypoints={waypoints} />

          {closingLine && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: totalReveal }}
              className="mt-10 max-w-xl text-center"
            >
              <p className="font-serif text-base italic text-amber-light">
                {closingLine}
              </p>
            </motion.div>
          )}
        </>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: totalReveal + 0.3 }}
        className="mt-12"
      >
        <Link
          to={facts.status === "ready" ? "/journey/4" : "#"}
          onClick={facts.status !== "ready" ? (e) => e.preventDefault() : undefined}
          className="inline-block rounded-pill px-12 py-4 font-sans text-[13px] font-semibold uppercase tracking-[1.5px] text-primary-foreground transition-all duration-300"
          style={{
            background: "linear-gradient(135deg, #e8943a, #c47828)",
            opacity: facts.status === "ready" ? 1 : 0.4,
            cursor: facts.status === "ready" ? "pointer" : "not-allowed",
          }}
        >
          Forge Your Crest
        </Link>
      </motion.div>
    </div>
  );
};

export default Stop3Bloodline;
