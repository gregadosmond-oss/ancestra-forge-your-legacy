import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" } as const,
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

const MadeToBeGivenSection = () => (
  <motion.section {...reveal} className="py-16 text-center">
    <p className="mb-3 font-sans text-[10px] uppercase tracking-[4px]" style={{ color: "#a07830" }}>
      The Perfect Gift
    </p>
    <h2 className="font-display text-3xl text-cream-warm sm:text-4xl">
      Made to be given.
    </h2>
    <p className="mx-auto mt-5 max-w-2xl font-serif italic leading-relaxed" style={{ color: "#c4b8a6", fontSize: 16 }}>
      The story you uncover isn't only for you. Give it to the parent who always wondered, or the grandchild who will one day ask. Send it straight to them with a personal note — a gift that reaches back generations, and forward to the ones who come next.
    </p>
    <Link
      to="/signup"
      className="mt-10 inline-block rounded-pill px-10 py-4 font-sans text-[13px] font-semibold uppercase tracking-[1.5px] transition-all duration-300 hover:-translate-y-0.5"
      style={{ background: "linear-gradient(135deg, #e8943a, #c47828)", color: "#1a1208" }}
    >
      Begin Your Journey
    </Link>
  </motion.section>
);

export default MadeToBeGivenSection;
