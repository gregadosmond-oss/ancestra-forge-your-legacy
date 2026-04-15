import { motion } from "framer-motion";

const PRODUCTS = [
  {
    icon: "🛡",
    heading: "Custom Coat of Arms",
    body: "A unique crest forged from your surname's history, symbolism, and ancestral role. High-res PNG + SVG.",
  },
  {
    icon: "📖",
    heading: "AI Family Story",
    body: "Chapter I of your family narrative — written by Claude AI using real historical context from your bloodline.",
  },
  {
    icon: "🌳",
    heading: "Bloodline Tree",
    body: "Your ancestral migration mapped visually — where your family came from, and how they got here.",
  },
  {
    icon: "📜",
    heading: "Legacy Certificate",
    body: "A frameable certificate bearing your crest, motto, and lineage. Print it. Hang it. Own it.",
  },
] as const;

const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" } as const,
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

const ProductPreviewSection = () => (
  <motion.section {...reveal} className="py-16 text-center">
    <p className="mb-3 text-[10px] uppercase tracking-[4px] text-amber-dim">
      What You Get
    </p>
    <h2 className="font-display text-3xl text-cream-warm sm:text-4xl">
      Your complete family legacy, delivered instantly.
    </h2>
    <p className="mx-auto mt-4 max-w-md font-serif italic text-foreground">
      Everything in the Legacy Pack — one price, yours forever.
    </p>

    <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
      {PRODUCTS.map((product, i) => (
        <motion.div
          key={product.heading}
          {...reveal}
          transition={{ ...reveal.transition, delay: i * 0.08 }}
          className="rounded-lg border border-gold-line bg-card p-6 text-left"
        >
          <div className="mb-3 text-2xl">{product.icon}</div>
          <h3 className="mb-2 font-display text-base text-cream-soft">
            {product.heading}
          </h3>
          <p className="text-sm leading-relaxed text-text-dim">
            {product.body}
          </p>
        </motion.div>
      ))}
    </div>

    {/* Price badge */}
    <div
      className="mt-8 rounded-lg px-8 py-5 text-center"
      style={{
        background: "rgba(232,148,58,0.06)",
        border: "1px solid rgba(232,148,58,0.18)",
      }}
    >
      <span className="font-display text-4xl text-amber-light">$29.99</span>
      <p className="mt-1 text-sm text-text-dim">
        One-time · Instant digital delivery · No subscription
      </p>
    </div>
  </motion.section>
);

export default ProductPreviewSection;
