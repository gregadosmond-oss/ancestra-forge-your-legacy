import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import SectionLabel from "@/components/journey/SectionLabel";
import TypewriterText from "@/components/journey/TypewriterText";
import RetryInline from "@/components/journey/RetryInline";
import { useJourney } from "@/contexts/JourneyContext";

const Stop5Story = () => {
  const navigate = useNavigate();
  const { unknownSurname, surname, story } = useJourney();

  useEffect(() => {
    if (unknownSurname) navigate("/journey/1", { replace: true });
    else if (!surname) navigate("/journey/1", { replace: true });
  }, [unknownSurname, surname, navigate]);

  if (!surname) return null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-24">
      <SectionLabel>YOUR STORY</SectionLabel>

      {story.status === "loading" && (
        <p className="mt-10 font-serif text-sm italic text-amber-dim">
          The quill is still writing…
        </p>
      )}

      {story.status === "error" && (
        <div className="mt-10">
          <RetryInline onRetry={story.retry} />
        </div>
      )}

      {story.status === "ready" && story.data && (
        <>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mt-6 max-w-3xl text-center font-display text-3xl text-cream-warm sm:text-4xl"
          >
            {story.data.chapterOneTitle}
          </motion.h1>

          <div className="mt-10 w-full max-w-2xl">
            <TypewriterText
              text={story.data.chapterOneBody}
              className="font-serif text-lg leading-relaxed text-text-body"
            />
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, delay: 2 }}
            className="mt-14 w-full max-w-xl rounded-[22px] border border-amber-dim/25 bg-card/60 p-8 text-center"
          >
            <p className="font-sans text-[10px] uppercase tracking-[4px] text-amber-dim">
              EIGHT CHAPTERS REMAIN
            </p>
            <ul className="mt-5 space-y-2 font-serif text-sm italic text-text-dim">
              {story.data.teaserChapters.map((t, i) => (
                <li key={`${t}-${i}`}>{t}</li>
              ))}
            </ul>

            <a
              href="https://buy.stripe.com/28EaEWfYM8po1aw76Cbo400"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-block rounded-pill px-12 py-4 font-sans text-[13px] font-semibold uppercase tracking-[1.5px] text-primary-foreground transition-all duration-300 hover:-translate-y-0.5"
              style={{
                background: "linear-gradient(135deg, #e8943a, #c47828)",
                transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
                color: "#1a1208",
              }}
            >
              Unlock Your Legacy Pack — $29
            </a>
          </motion.div>
        </>
      )}
    </div>
  );
};

export default Stop5Story;
