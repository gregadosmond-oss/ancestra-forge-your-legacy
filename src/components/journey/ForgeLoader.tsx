import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

type Props = { messages: string[]; onComplete: () => void; perMessageMs?: number };

const ForgeLoader = ({ messages, onComplete, perMessageMs = 1200 }: Props) => {
  const [index, setIndex] = useState(0);

  // Intentionally omit onComplete from deps — callers often pass an inline
  // arrow that changes every render, which would tear the effect down and
  // restart the message cycle.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (index >= messages.length) {
      const done = setTimeout(onComplete, 300);
      return () => clearTimeout(done);
    }
    const next = setTimeout(() => setIndex((i) => i + 1), perMessageMs);
    return () => clearTimeout(next);
  }, [index, messages.length, perMessageMs]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center">
      <AnimatePresence mode="wait">
        {index < messages.length && (
          <motion.p
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{
              opacity: [0, 1, 1, 0.4],
              y: 0,
            }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: perMessageMs / 1000, times: [0, 0.2, 0.7, 1] }}
            className="font-serif text-xl italic text-amber-light"
          >
            {messages[index]}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ForgeLoader;
