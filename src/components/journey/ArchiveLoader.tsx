import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const MESSAGES = [
  "Searching the archives…",
  "Tracing your bloodline…",
  "Uncovering your ancestry…",
  "Reading the old records…",
  "Forging your motto…",
  "Mapping the migration…",
  "Preparing your story…",
];

const ArchiveLoader = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % MESSAGES.length);
    }, 2800);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="mt-12 flex flex-col items-center gap-6">
      {/* Pulsing amber orb */}
      <div className="relative flex items-center justify-center">
        <span
          className="absolute inline-flex h-10 w-10 animate-ping rounded-full opacity-30"
          style={{ background: "rgba(212,160,74,0.4)" }}
        />
        <span
          className="relative inline-flex h-4 w-4 rounded-full"
          style={{ background: "#d4a04a" }}
        />
      </div>

      {/* Cycling message */}
      <div className="h-6 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.p
            key={index}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4 }}
            className="text-center font-serif text-sm italic text-amber-dim"
          >
            {MESSAGES[index]}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Progress dots */}
      <div className="flex gap-1.5">
        {MESSAGES.map((_, i) => (
          <span
            key={i}
            className="h-1 rounded-full transition-all duration-500"
            style={{
              width: i === index ? "20px" : "6px",
              background: i === index ? "#d4a04a" : "rgba(212,160,74,0.25)",
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default ArchiveLoader;
