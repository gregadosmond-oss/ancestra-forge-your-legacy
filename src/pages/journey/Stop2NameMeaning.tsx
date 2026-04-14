import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import SectionLabel from "@/components/journey/SectionLabel";
import StaggerGroup, { staggerItem } from "@/components/journey/StaggerGroup";
import WarmDivider from "@/components/journey/WarmDivider";
import { osmondMock } from "@/data/osmondMock";

const Stop2NameMeaning = () => {
  const d = osmondMock;
  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-24">
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
          {d.surname.toUpperCase()}
        </motion.h1>

        <motion.p
          variants={staggerItem}
          className="mt-10 font-serif text-xl italic text-amber-light"
        >
          {d.meaning}
        </motion.p>

        <motion.p
          variants={staggerItem}
          className="mt-4 font-sans text-base text-foreground"
        >
          {d.origin}
        </motion.p>

        <motion.p
          variants={staggerItem}
          className="mt-2 font-sans text-[11px] uppercase tracking-[3px] text-amber-dim"
        >
          {d.originYear}
        </motion.p>

        <motion.p
          variants={staggerItem}
          className="mt-6 font-serif text-lg text-text-body"
        >
          {d.ancestralRole}
        </motion.p>

        <motion.div variants={staggerItem}>
          <WarmDivider />
          <p className="font-serif text-base italic text-amber-light">
            &ldquo;{d.historicalQuote}&rdquo;
          </p>
          <WarmDivider />
        </motion.div>

        <motion.div variants={staggerItem} className="mt-8">
          <Link
            to="/journey/3"
            className="inline-block rounded-pill px-12 py-4 font-sans text-[13px] font-semibold uppercase tracking-[1.5px] text-primary-foreground transition-all duration-300 hover:-translate-y-0.5"
            style={{
              background: "linear-gradient(135deg, #e8943a, #c47828)",
              transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          >
            Meet Your Bloodline
          </Link>
        </motion.div>
      </StaggerGroup>
    </div>
  );
};

export default Stop2NameMeaning;
