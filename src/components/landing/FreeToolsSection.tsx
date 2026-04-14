import { motion } from "framer-motion";

const TOOLS = [
  {
    icon: "🧬",
    heading: "Bloodline Quiz",
    body: "5 questions → your ancestry archetype. Warrior, Builder, Explorer, Healer, or Scholar.",
  },
  {
    icon: "🔍",
    heading: "Surname Lookup",
    body: "Instant meaning, origin, and historical role for any surname.",
  },
  {
    icon: "⚔️",
    heading: "Motto Generator",
    body: "Enter 3 values → get a Latin motto with English translation.",
  },
] as const;

const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" } as const,
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

const FreeToolsSection = () => (
  <motion.section {...reveal} className="py-16 text-center">
    <p className="mb-3 text-[10px] uppercase tracking-[4px] text-amber-dim">
      Free Tools
    </p>
    <h2 className="font-display text-3xl text-cream-warm sm:text-4xl">
      Curious? Start here — no commitment.
    </h2>
    <p className="mx-auto mt-4 max-w-md font-serif italic text-foreground">
      Six free tools to explore your heritage. No account needed.
    </p>

    <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
      {TOOLS.map((tool, i) => (
        <motion.div
          key={tool.heading}
          {...reveal}
          transition={{ ...reveal.transition, delay: i * 0.08 }}
          className="relative rounded-lg border border-gold-line bg-card p-6 text-left opacity-80"
          style={{ cursor: "default" }}
        >
          <span
            className="absolute right-3 top-3 rounded text-[9px] uppercase tracking-[1px] text-amber-dim"
            style={{ background: "#221c14", padding: "3px 8px" }}
          >
            Coming Soon
          </span>
          <div className="mb-3 text-xl">{tool.icon}</div>
          <h3 className="mb-2 font-display text-base text-cream-soft">
            {tool.heading}
          </h3>
          <p className="text-sm leading-relaxed text-text-dim">
            {tool.body}
          </p>
        </motion.div>
      ))}
    </div>
  </motion.section>
);

export default FreeToolsSection;
