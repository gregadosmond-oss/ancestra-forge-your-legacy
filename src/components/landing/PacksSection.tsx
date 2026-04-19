import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" } as const,
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

const FREE_ITEMS = [
  "Surname meaning & origin",
  "Bloodline personality quiz",
  "Motto generator",
  "Meet your ancestor",
  "The 1700s you",
  "Ancestor chat",
];

const LEGACY_ITEMS = [
  "Custom coat of arms (hi-res)",
  "AI-written family story",
  "Visual bloodline tree",
  "Legacy certificate (PDF)",
  "Full ancestor chat access",
  "Shareable legacy page",
];

const HEIRLOOM_ITEMS = [
  "Custom crest mug — printed & shipped",
  "Full Legacy Pack included ($29 value)",
  "\"HOUSE OF [NAME]\" wrap-around design",
  "QR code linking to your legacy page",
  "Ships worldwide in 5–7 days",
];

const PacksSection = () => (
  <motion.section {...reveal} className="py-16 text-center">
    <p className="mb-3 text-[10px] uppercase tracking-[4px] text-amber-dim">
      Choose Your Legacy
    </p>
    <h2 className="font-display text-3xl text-cream-warm sm:text-4xl">
      Pick the pack that's right for you
    </h2>
    <p className="mx-auto mt-4 max-w-md font-serif italic text-foreground">
      Start free, or unlock your full family legacy today.
    </p>

    <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-3">

      {/* ── Free / Explorer ── */}
      <motion.div
        {...reveal}
        transition={{ ...reveal.transition, delay: 0 }}
        className="flex flex-col items-center rounded-[22px] border border-gold-line bg-card p-7 text-center"
      >
        <div className="mb-3 text-3xl">🔍</div>
        <h3 className="font-display text-lg text-cream-warm">Explorer</h3>
        <div className="mt-3 font-display text-3xl text-amber-light">Free</div>
        <p className="mt-1 text-[11px] text-text-dim">No credit card needed</p>
        <ul className="mt-5 w-full space-y-1 text-left text-sm text-foreground">
          {FREE_ITEMS.map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="mt-1 text-[8px] text-amber-dim">✦</span>
              {item}
            </li>
          ))}
        </ul>
        <Link
          to="/journey"
          className="mt-6 w-full rounded-pill py-3 text-[12px] font-semibold uppercase tracking-[1.5px] text-amber transition-all duration-400"
          style={{
            background: "rgba(232,148,58,0.06)",
            border: "1px solid rgba(232,148,58,0.18)",
          }}
        >
          Start Free
        </Link>
      </motion.div>

      {/* ── Legacy Pack (featured) ── */}
      <motion.div
        {...reveal}
        transition={{ ...reveal.transition, delay: 0.08 }}
        className="relative flex flex-col items-center rounded-[22px] p-7 text-center"
        style={{
          background: "#1e1810",
          border: "1px solid rgba(232,148,58,0.35)",
        }}
      >
        <div
          className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-pill px-4 py-1 text-[10px] font-bold uppercase tracking-[1.5px]"
          style={{
            background: "linear-gradient(135deg, #e8943a, #c47828)",
            color: "#1a1208",
          }}
        >
          Most Popular
        </div>
        <div className="mb-3 text-3xl">🛡</div>
        <h3 className="font-display text-lg text-cream-warm">Legacy Pack</h3>
        <div className="mt-3 font-display text-3xl text-amber-light">$29.99</div>
        <p className="mt-1 text-[11px] text-text-dim">
          One-time · Instant delivery
        </p>
        <ul className="mt-5 w-full space-y-1 text-left text-sm text-foreground">
          {LEGACY_ITEMS.map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="mt-1 text-[8px] text-amber-dim">✦</span>
              {item}
            </li>
          ))}
        </ul>
        <Link
          to="/journey"
          className="mt-6 w-full rounded-pill py-3 text-[12px] font-semibold uppercase tracking-[1.5px] transition-all duration-400"
          style={{
            background: "linear-gradient(135deg, #e8943a, #c47828)",
            color: "#1a1208",
          }}
        >
          Unlock My Legacy
        </Link>
      </motion.div>

      {/* ── Heirloom Shop ── */}
      <motion.div
        {...reveal}
        transition={{ ...reveal.transition, delay: 0.16 }}
        className="flex flex-col items-center rounded-[22px] border border-gold-line bg-card p-7 text-center"
      >
        <div className="mb-3 text-3xl">🎁</div>
        <h3 className="font-display text-lg text-cream-warm">Heirloom Shop</h3>
        <div className="mt-3 font-display text-3xl text-amber-light">$49.99</div>
        <p className="mt-1 text-[11px] text-text-dim">Mug · Legacy Pack included · Ships worldwide</p>
        <p className="mt-3 font-serif text-xs italic text-text-dim">
          Your family crest, name & QR code on a ceramic mug — plus the full digital Legacy Pack.
        </p>
        <ul className="mt-4 w-full space-y-1 text-left text-sm text-foreground">
          {HEIRLOOM_ITEMS.map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="mt-1 text-[8px] text-amber-dim">✦</span>
              {item}
            </li>
          ))}
        </ul>
        <Link
          to="/heirloom-order"
          className="mt-6 w-full rounded-pill py-3 text-[12px] font-semibold uppercase tracking-[1.5px] transition-all duration-400"
          style={{
            background: "linear-gradient(135deg, #e8943a, #c47828)",
            color: "#1a1208",
          }}
        >
          Order Now →
        </Link>
      </motion.div>

    </div>
  </motion.section>
);

export default PacksSection;
