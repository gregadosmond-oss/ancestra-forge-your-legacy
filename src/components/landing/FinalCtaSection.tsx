import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" } as const,
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

const FinalCtaSection = () => (
  <motion.section
    {...reveal}
    className="py-20 text-center"
    style={{ borderTop: "1px solid rgba(232,148,58,0.15)" }}
  >
    <p className="mb-3 text-[10px] uppercase tracking-[4px] text-amber-dim">
      Your Legacy Awaits
    </p>
    <h2 className="font-display text-3xl text-cream-warm sm:text-4xl lg:text-5xl">
      Every family has a story worth telling.
    </h2>
    <p className="mx-auto mt-4 max-w-md font-serif italic text-foreground">
      Yours has been waiting centuries. It takes five minutes to discover it.
    </p>
    <Link
      to="/journey"
      className="mt-10 inline-block rounded-pill px-10 py-4 text-[13px] font-semibold uppercase tracking-[1.5px]"
      style={{
        background: "linear-gradient(135deg, #e8943a, #c47828)",
        color: "#1a1208",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.background =
          "linear-gradient(135deg, #f0a848, #e8943a)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.background =
          "linear-gradient(135deg, #e8943a, #c47828)";
      }}
    >
      Begin Your Journey
    </Link>
  </motion.section>
);

export default FinalCtaSection;
