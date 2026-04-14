import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useState } from "react";
import SectionLabel from "@/components/journey/SectionLabel";
import TypewriterText from "@/components/journey/TypewriterText";
import { osmondMock } from "@/data/osmondMock";

const Stop5Story = () => {
  const d = osmondMock;
  const firstChapter = d.chapters[0];
  const hiddenChapters = d.chapters.slice(1);
  const [typed, setTyped] = useState(false);

  return (
    <div className="flex min-h-screen flex-col items-center px-6 py-24">
      <div className="w-full max-w-2xl">
        <div className="text-center">
          <SectionLabel>CHAPTER {firstChapter.number}</SectionLabel>
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="mt-4 font-display text-3xl text-amber-light sm:text-4xl"
          >
            {firstChapter.title}
          </motion.h1>
        </div>

        <div className="mt-12">
          {firstChapter.body && (
            <TypewriterText
              text={firstChapter.body}
              onDone={() => setTyped(true)}
              className="font-serif text-lg leading-relaxed text-text-body"
            />
          )}
        </div>

        {/* Fade-to-dark mask + hidden chapter list */}
        {typed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2 }}
            className="relative mt-12"
          >
            <div className="pointer-events-none absolute -top-24 left-0 right-0 h-24 bg-gradient-to-b from-transparent to-background" />
            <ul className="space-y-2 text-center opacity-40">
              {hiddenChapters.map((c) => (
                <li
                  key={c.number}
                  className="font-serif text-sm italic text-text-dim"
                >
                  Chapter {c.number}: {c.title}
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* Paywall */}
        {typed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="mt-16 rounded-[22px] border border-amber-dim/40 bg-card/60 p-10 text-center backdrop-blur-sm"
          >
            <h2 className="font-display text-2xl text-cream-warm sm:text-3xl">
              Unlock your full Legacy Pack
            </h2>
            <ul className="mx-auto mt-6 max-w-sm space-y-2 text-left font-sans text-sm text-text-body">
              <li>· Full 9 chapters of your family story</li>
              <li>· High-resolution crest (print-ready)</li>
              <li>· Legacy certificate (PDF)</li>
              <li>· Visual family tree print</li>
              <li>· Ancestor chat (beta)</li>
            </ul>
            <p className="mt-8 font-display text-5xl text-amber-light">$29</p>
            <Link
              to="/journey/6"
              className="mt-8 inline-block rounded-pill px-12 py-4 font-sans text-[13px] font-semibold uppercase tracking-[1.5px] text-primary-foreground transition-all duration-300 hover:-translate-y-0.5"
              style={{
                background: "linear-gradient(135deg, #e8943a, #c47828)",
                transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
              }}
            >
              See the Full Legacy
            </Link>
            <p className="mt-5 font-serif text-xs italic text-text-dim">
              prototype mode — payment skipped
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Stop5Story;
