import { motion } from "framer-motion";

const HIGHLIGHTED = [
  "Father's Day",
  "Christmas",
  "Wedding",
  "Graduation",
] as const;

const STANDARD = [
  "Birthday",
  "Anniversary",
  "New Baby",
  "Mother's Day",
  "Housewarming",
  "Retirement",
  "Family Reunion",
  "Valentine's Day",
] as const;

const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" } as const,
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

const OccasionsSection = () => (
  <motion.section {...reveal} className="py-16 text-center">
    <p className="mb-3 text-[10px] uppercase tracking-[4px] text-amber-dim">
      The Perfect Gift
    </p>
    <h2 className="font-display text-3xl text-cream-warm sm:text-4xl">
      The gift they'll never forget.
    </h2>
    <p className="mx-auto mt-4 max-w-md font-serif italic text-foreground">
      For the people who already have everything — give them something that can
      never be bought twice.
    </p>

    <div className="mt-12 flex flex-wrap justify-center gap-3">
      {HIGHLIGHTED.map((occasion) => (
        <span
          key={occasion}
          className="rounded-pill text-[13px] text-amber-light"
          style={{
            padding: "8px 20px",
            border: "1px solid rgba(232,148,58,0.4)",
            background: "rgba(232,148,58,0.06)",
          }}
        >
          {occasion}
        </span>
      ))}
      {STANDARD.map((occasion) => (
        <span
          key={occasion}
          className="rounded-pill border border-gold-line bg-card text-[13px] text-foreground"
          style={{ padding: "8px 20px" }}
        >
          {occasion}
        </span>
      ))}
    </div>
  </motion.section>
);

export default OccasionsSection;
