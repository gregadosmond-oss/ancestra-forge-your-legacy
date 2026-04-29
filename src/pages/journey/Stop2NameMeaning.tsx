import { useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import SectionLabel from "@/components/journey/SectionLabel";
import StaggerGroup, { staggerItem } from "@/components/journey/StaggerGroup";
import WarmDivider from "@/components/journey/WarmDivider";
import RetryInline from "@/components/journey/RetryInline";
import ArchiveLoader from "@/components/journey/ArchiveLoader";
import ScrollChevron from "@/components/ScrollChevron";
import { useJourney } from "@/contexts/JourneyContext";

const Stop2NameMeaning = () => {
  const navigate = useNavigate();
  const { unknownSurname, surname, facts } = useJourney();

  useEffect(() => {
    if (unknownSurname) navigate("/journey/1", { replace: true });
    else if (!surname) navigate("/journey/1", { replace: true });
  }, [unknownSurname, surname, navigate]);

  if (!surname) return null;

  return (
    <div className="relative flex min-h-[72vh] items-start justify-center px-6 pt-20 pb-32">
      <StaggerGroup
        delay={0.3}
        stagger={0.4}
        className="w-full max-w-2xl text-center"
      >
        <motion.div variants={staggerItem}>
          <SectionLabel>CHAPTER ONE</SectionLabel>
        </motion.div>

        <motion.h1
          variants={staggerItem}
          className="mt-5 font-display text-6xl tracking-[4px] text-cream-warm sm:text-7xl"
        >
          {(facts.data?.displaySurname ?? surname).toUpperCase()}
        </motion.h1>

        {facts.status === "loading" && (
          <motion.div variants={staggerItem}>
            <ArchiveLoader />
          </motion.div>
        )}

        {facts.status === "error" && (
          <motion.div variants={staggerItem} className="mt-10">
            <RetryInline onRetry={facts.retry} />
          </motion.div>
        )}

        {facts.status === "ready" && facts.data && (
          <>
            <motion.p
              variants={staggerItem}
              className="mt-10 font-serif text-xl italic text-amber-light"
            >
              {facts.data.meaning.etymology}
            </motion.p>

            <motion.p
              variants={staggerItem}
              className="mt-4 font-sans text-base text-foreground"
            >
              {facts.data.meaning.origin}
            </motion.p>

            <motion.p
              variants={staggerItem}
              className="mt-6 font-serif text-lg text-text-body"
            >
              {facts.data.meaning.role}
            </motion.p>

            <motion.div variants={staggerItem}>
              <WarmDivider />
              <p className="font-serif text-base italic text-amber-light">
                &ldquo;{facts.data.meaning.historicalContext}&rdquo;
              </p>
              <WarmDivider />
            </motion.div>
          </>
        )}

        <motion.div variants={staggerItem} className="mt-8">
          <Link
            to={facts.status === "ready" ? "/journey/3" : "#"}
            onClick={facts.status !== "ready" ? (e) => e.preventDefault() : undefined}
            className="inline-block rounded-pill px-12 py-4 font-sans text-[13px] font-semibold uppercase tracking-[1.5px] text-primary-foreground transition-all duration-300"
            style={{
              background: "linear-gradient(135deg, #e8943a, #c47828)",
              opacity: facts.status === "ready" ? 1 : 0.4,
              cursor: facts.status === "ready" ? "pointer" : "not-allowed",
            }}
          >
            {facts.status === "loading" ? "Tracing your bloodline…" : "Meet Your Bloodline"}
          </Link>
        </motion.div>
      </StaggerGroup>
      <ScrollChevron />
    </div>
  );
};

export default Stop2NameMeaning;
