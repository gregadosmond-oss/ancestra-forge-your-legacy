import { motion } from "framer-motion";

const FAQS = [
  {
    q: "Where did my family come from?",
    a: "Enter your surname and our AI traces its origin, the region it emerged from, the role your ancestors likely held, and the era they lived through — drawing on centuries of naming, migration, and occupational records.",
  },
  {
    q: "Why was my last name changed?",
    a: "Surnames were altered at immigration checkpoints, anglicized for new countries, shortened for trade, or changed to escape persecution. Our AI ancestry stories surface the most likely reason your name shifted across generations.",
  },
  {
    q: "Who were my ancestors before immigration?",
    a: "We build an AI family biography from your surname — the region of origin, the trades your bloodline practiced, and a plausible ancestor profile from the era before your family crossed an ocean.",
  },
  {
    q: "What secrets are hidden in my family tree?",
    a: "Most families carry forgotten name changes, lost trades, and ancestors whose names were never written down. Our AI family tree builder surfaces what oral tradition lost — and turns it into a digital family archive you can pass on.",
  },
  {
    q: "Can QR codes preserve family history?",
    a: "Yes. We print a genealogy QR code on every heirloom — mugs, canvas prints, blankets, coasters — linking to your family's permanent ancestry memory page. Future generations scan it and instantly see your crest, story, and bloodline.",
  },
] as const;

const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" } as const,
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

const FaqSection = () => (
  <motion.section {...reveal} className="py-16">
    <div className="text-center">
      <p className="mb-3 text-[10px] uppercase tracking-[4px] text-amber-dim">
        Questions Families Ask
      </p>
      <h2 className="font-display text-3xl text-cream-warm sm:text-4xl">
        The questions every family eventually asks.
      </h2>
      <p className="mx-auto mt-4 max-w-xl font-serif italic text-foreground">
        We built AncestorsQR to answer them.
      </p>
    </div>

    <div className="mx-auto mt-12 grid max-w-3xl grid-cols-1 gap-4">
      {FAQS.map((item, i) => (
        <motion.details
          key={item.q}
          {...reveal}
          transition={{ ...reveal.transition, delay: i * 0.05 }}
          className="group rounded-lg border border-gold-line bg-card p-6 transition-colors hover:border-amber-dim"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-lg text-cream">
            <span>{item.q}</span>
            <span
              className="flex h-6 w-6 flex-none items-center justify-center rounded-full text-sm text-amber transition-transform group-open:rotate-45"
              style={{
                background: "rgba(232,148,58,0.10)",
                border: "1px solid rgba(232,148,58,0.30)",
              }}
              aria-hidden="true"
            >
              +
            </span>
          </summary>
          <p className="mt-4 text-sm leading-relaxed text-text-dim">{item.a}</p>
        </motion.details>
      ))}
    </div>
  </motion.section>
);

export default FaqSection;
