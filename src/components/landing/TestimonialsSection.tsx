import { motion } from "framer-motion";

interface Testimonial {
  quote: string;
  name: string;
  title: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "There's a quiet pride in being able to say my people's names out loud — the ones who crossed an ocean, who fished those bays, who kept going so that I could be here. My family is so grateful to finally know them. That's the gift I wanted to give everyone.",
    name: "Greg Osmond",
    title: "Founder · Playa del Carmen, Mexico",
  },
];

const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" } as const,
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

const TestimonialsSection = () => (
  <motion.section {...reveal} className="py-16 text-center">
    <p className="mb-3 text-[10px] uppercase tracking-[4px] text-amber-dim">
      WHY IT MATTERS
    </p>
    <h2 className="font-display text-3xl text-cream-warm sm:text-4xl">
      From the people who've lived it
    </h2>

    <div className="mx-auto mt-10 max-w-2xl">
      {TESTIMONIALS.map((t, i) => (
        <motion.div
          key={i}
          {...reveal}
          transition={{ ...reveal.transition, delay: i * 0.08 }}
          className="rounded-lg border border-gold-line bg-card p-8 sm:p-10 text-left"
        >
          <p
            className="font-serif italic leading-relaxed"
            style={{ color: "#d0c4b4", fontSize: "17px" }}
          >
            "{t.quote}"
          </p>
          <div className="mt-6 flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-full flex items-center justify-center font-display text-sm"
              style={{
                background: "rgba(232,148,58,0.10)",
                border: "1px solid rgba(232,148,58,0.30)",
                color: "#d4a04a",
              }}
            >
              {t.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>
            <div>
              <p className="font-sans text-sm font-semibold text-cream">
                {t.name}
              </p>
              <p className="font-sans text-xs text-text-dim">{t.title}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  </motion.section>
);

export default TestimonialsSection;
