import { motion } from "framer-motion";

const STEPS = [
  {
    num: "1",
    heading: "Start With Your Name",
    body: "Enter your surname and instantly see your origin, your crest, and the era your line began.",
  },
  {
    num: "2",
    heading: "Bring Your Family In",
    body: "Add the ancestors you know — we search the records to reach further back — and capture family memories in their own words.",
  },
  {
    num: "3",
    heading: "Receive Your Legacy",
    body: "A personalized nine-chapter novel starring your real ancestors, your family crest, and an heirloom book to gift and pass on.",
  },
] as const;

const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" } as const,
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

const HowItWorksSection = () => (
  <motion.section {...reveal} className="py-16 text-center">
    <p className="mb-3 text-[10px] uppercase tracking-[4px] text-amber-dim">
      The Journey
    </p>
    <h2 className="font-display text-3xl text-cream-warm sm:text-4xl">
      Five minutes to discover 900 years.
    </h2>
    <p className="mx-auto mt-4 max-w-md font-serif italic text-foreground">
      Start with your surname. Make it yours.
    </p>

    <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
      {STEPS.map((step, i) => (
        <motion.div
          key={step.num}
          {...reveal}
          transition={{ ...reveal.transition, delay: i * 0.08 }}
          className="rounded-lg border border-gold-line bg-card p-6"
        >
          <div
            className="mx-auto mb-4 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-amber"
            style={{
              background: "rgba(232,148,58,0.10)",
              border: "1px solid rgba(232,148,58,0.30)",
            }}
          >
            {step.num}
          </div>
          <h3 className="mb-2 font-display text-lg text-cream">{step.heading}</h3>
          <p
            className="text-sm leading-relaxed text-text-dim"
          >
            {step.body}
          </p>
        </motion.div>
      ))}
    </div>
  </motion.section>
);

export default HowItWorksSection;
