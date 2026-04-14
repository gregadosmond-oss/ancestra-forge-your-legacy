import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import SectionLabel from "@/components/journey/SectionLabel";
import BloodlineTree from "@/components/journey/BloodlineTree";
import { osmondMock } from "@/data/osmondMock";

const Stop3Bloodline = () => {
  const d = osmondMock;
  const totalReveal = d.tree.length * 0.18 + 0.5;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-24">
      <div className="mb-10 text-center">
        <SectionLabel>YOUR BLOODLINE</SectionLabel>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mt-4 font-display text-4xl tracking-tight text-cream-warm sm:text-5xl"
        >
          The line that led to you.
        </motion.h1>
      </div>

      <BloodlineTree generations={d.tree} />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: totalReveal }}
        className="mt-10 rounded-pill border border-amber-dim/40 bg-card/40 px-6 py-3"
      >
        <p className="font-sans text-xs uppercase tracking-[2px] text-amber-light">
          {d.migration.from} → {d.migration.to} · {d.migration.year}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: totalReveal + 0.3 }}
        className="mt-12"
      >
        <Link
          to="/journey/4"
          className="inline-block rounded-pill px-12 py-4 font-sans text-[13px] font-semibold uppercase tracking-[1.5px] text-primary-foreground transition-all duration-300 hover:-translate-y-0.5"
          style={{
            background: "linear-gradient(135deg, #e8943a, #c47828)",
            transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          Forge Your Crest
        </Link>
      </motion.div>
    </div>
  );
};

export default Stop3Bloodline;
