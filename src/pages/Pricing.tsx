import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import WarmDivider from "@/components/journey/WarmDivider";

const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" } as const,
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

const FREE_ITEMS = [
  "Surname lookup",
  "Bloodline quiz",
  "Motto generator",
  "Meet your ancestor",
  "Ancestor chat",
  "1700s you",
];

const LEGACY_ITEMS = [
  "Full crest (high-res PNG)",
  "AI family story (9 chapters)",
  "Visual family tree",
  "Legacy certificate",
  "Family motto in Latin",
  "Ancestor chat unlocked",
];

const DEEP_LEGACY_ITEMS = [
  "Everything in Legacy Pack",
  "15-question guided interview",
  "AI-researched genealogical history",
  "Verified historical sources",
  "Full migration record",
  "Confirmation email with research summary",
];

const FAQ = [
  {
    q: "What do I get with the Legacy Pack?",
    a: "Your full 9-chapter family story written by AI using real historical records, a high-resolution coat of arms, a visual bloodline tree, and a legacy certificate — all delivered to your email as a PDF.",
  },
  {
    q: "How fast do I receive it?",
    a: "The Legacy Pack is delivered within minutes of payment. Physical heirlooms ship within 5–7 business days.",
  },
  {
    q: "Do heirlooms include the Legacy Pack?",
    a: "Yes — every physical heirloom purchase includes the full digital Legacy Pack at no extra cost.",
  },
  {
    q: "Can I gift this to someone?",
    a: "Absolutely. At checkout you can enter a recipient's email and a personal message. We'll deliver it straight to them.",
  },
  {
    q: "Is this a subscription?",
    a: "No. Everything is a one-time payment. No recurring charges.",
  },
  {
    q: "Is there a refund policy?",
    a: "Digital Legacy Packs are non-refundable once delivered (you'll have the PDF within minutes). For physical heirlooms, we'll replace anything damaged or misprinted at no cost. Email gregadosmond@gmail.com if something's wrong.",
  },
  {
    q: "What happens to my surname data?",
    a: "Your surname is used only to generate your legacy. We cache each surname result so we don't regenerate from scratch — but we don't share, sell, or attach it to any marketing list. Your email is used only to deliver your order. Full details on our Privacy page.",
  },
  {
    q: "Can I re-download my Legacy Pack later?",
    a: "Yes. Sign in with the same email you used at checkout and your legacy lives at /my-legacy forever. You can also forward the delivery email to anyone.",
  },
];

const Pricing = () => (
  <div className="relative min-h-screen bg-background">
    <img src="/hero.jpg" alt="" className="pointer-events-none fixed inset-0 h-full w-full object-cover" style={{ objectPosition: "center 30%", opacity: 0.38, filter: "saturate(0.7) brightness(0.95)" }} />
  <div className="relative z-10 mx-auto max-w-5xl px-6 py-20">
    {/* Header */}
    <motion.div {...reveal} className="text-center">
      <p className="mb-3 font-sans text-[10px] uppercase tracking-[4px]" style={{ color: "#a07830" }}>
        Simple Pricing
      </p>
      <h1 className="font-display text-4xl text-cream-warm sm:text-5xl">
        Your legacy, your price.
      </h1>
      <p className="mx-auto mt-5 max-w-xl text-lg italic" style={{ color: "#c4b8a6" }}>
        Start free and discover your family name. Unlock the full story when you're ready. Add an heirloom to make it last forever.
      </p>
    </motion.div>

    <WarmDivider />

    {/* 3-tier cards */}
    <motion.div {...reveal} className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-3">

      {/* Free Tools */}
      <div className="flex flex-col rounded-[22px] border bg-card p-8" style={{ borderColor: "rgba(232,148,58,0.1)" }}>
        <p className="mb-3 font-sans text-[10px] font-semibold uppercase tracking-[3px]" style={{ color: "#a07830" }}>
          Free Tools
        </p>
        <h2 className="font-display text-xl text-cream-warm">Explorer</h2>
        <div className="mt-3 font-display text-4xl" style={{ color: "#e8b85c" }}>$0</div>
        <p className="mt-1 font-sans text-[11px]" style={{ color: "#8a7e6e" }}>No credit card needed</p>
        <ul className="mt-6 flex-1 space-y-2">
          {FREE_ITEMS.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm" style={{ color: "#c4b8a6" }}>
              <span className="mt-1 font-sans text-[8px]" style={{ color: "#a07830" }}>✦</span>
              {item}
            </li>
          ))}
        </ul>
        <Link
          to="/journey/1"
          className="mt-8 block rounded-pill py-3 text-center font-sans text-[12px] font-semibold uppercase tracking-[1.5px] transition-all duration-300 hover:opacity-80"
          style={{ background: "rgba(232,148,58,0.08)", border: "1px solid rgba(232,148,58,0.2)", color: "#d4a04a" }}
        >
          Start Free
        </Link>
      </div>

      {/* Legacy Pack — featured */}
      <div className="relative flex flex-col rounded-[22px] p-8" style={{ background: "#1e1810", border: "1px solid rgba(232,148,58,0.4)" }}>
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-pill px-4 py-1 font-sans text-[10px] font-bold uppercase tracking-[1.5px]"
          style={{ background: "linear-gradient(135deg, #e8943a, #c47828)", color: "#1a1208" }}>
          Most Popular
        </div>
        <p className="mb-3 font-sans text-[10px] font-semibold uppercase tracking-[3px]" style={{ color: "#a07830" }}>
          Legacy Pack
        </p>
        <h2 className="font-display text-xl text-cream-warm">Your Full Story</h2>
        <div className="mt-3 font-display text-4xl" style={{ color: "#e8b85c" }}>
          $19.99
        </div>
        <p className="mt-1 font-sans text-[11px]" style={{ color: "#8a7e6e" }}>One-time · Instant delivery</p>
        <ul className="mt-6 flex-1 space-y-2">
          {LEGACY_ITEMS.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm" style={{ color: "#c4b8a6" }}>
              <span className="mt-1 font-sans text-[8px]" style={{ color: "#a07830" }}>✦</span>
              {item}
            </li>
          ))}
        </ul>
        <Link
          to="/journey/1"
          className="mt-8 block rounded-pill py-3 text-center font-sans text-[12px] font-semibold uppercase tracking-[1.5px] transition-all duration-300 hover:-translate-y-0.5"
          style={{ background: "linear-gradient(135deg, #e8943a, #c47828)", color: "#1a1208" }}
        >
          Get Your Legacy
        </Link>
      </div>

      {/* Deep Legacy — premium */}
      <div
        className="relative flex flex-col rounded-[22px] p-8"
        style={{
          background: "linear-gradient(180deg, #1a1208 0%, #13100b 100%)",
          border: "1px solid rgba(212,160,74,0.5)",
          boxShadow: "0 0 40px rgba(232,148,58,0.08)",
        }}
      >
        <p className="mb-3 font-sans text-[10px] font-semibold uppercase tracking-[3px]" style={{ color: "#d4a04a" }}>
          Deep Legacy
        </p>
        <h2 className="font-display text-xl text-cream-warm">Premium Research</h2>
        <div className="mt-3 font-display text-4xl" style={{ color: "#f0e8da" }}>$79</div>
        <p className="mt-1 font-sans text-[11px]" style={{ color: "#8a7e6e" }}>One-time · Delivered within 24 hours</p>
        <ul className="mt-6 flex-1 space-y-2">
          {DEEP_LEGACY_ITEMS.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm" style={{ color: "#c4b8a6" }}>
              <span className="mt-1 font-sans text-[8px]" style={{ color: "#d4a04a" }}>✦</span>
              {item}
            </li>
          ))}
        </ul>
        <Link
          to="/deep-legacy"
          className="mt-8 block rounded-pill py-3 text-center font-sans text-[12px] font-semibold uppercase tracking-[1.5px] transition-all duration-300 hover:-translate-y-0.5"
          style={{ background: "linear-gradient(135deg, #e8943a, #c47828)", color: "#1a1208" }}
        >
          Begin Deep Research
        </Link>
      </div>

    </motion.div>

    {/* Deep Legacy promo — horizontal card */}
    <motion.div {...reveal} className="mt-12">
      <div
        className="mx-auto max-w-4xl rounded-[22px] flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between"
        style={{
          border: "1px solid rgba(232,148,58,0.18)",
          background: "linear-gradient(135deg, rgba(26,21,16,0.9), rgba(30,24,16,0.9))",
          padding: "36px 40px",
        }}
      >
        <div className="sm:flex-1">
          <p className="font-sans text-[10px] uppercase tracking-[3px]" style={{ color: "#a07830" }}>
            FOR THE DEEP ROOTS
          </p>
          <h3 className="mt-2 font-display text-2xl text-cream-warm">Deep Legacy Research</h3>
          <p className="mt-3 text-sm leading-relaxed" style={{ color: "#c4b8a6" }}>
            An extended research report powered by Perplexity + Claude — historical context, rare records, lineage deep-dives, and a 20+ page document built from multiple real-world sources. For when the standard Legacy Pack isn't enough.
          </p>
        </div>
        <div className="flex flex-col items-start gap-3 sm:w-auto sm:items-end">
          <div className="font-display text-4xl" style={{ color: "#e8b85c" }}>$79</div>
          <p className="font-sans text-[11px]" style={{ color: "#8a7e6e" }}>One-time · Delivered in 24–48 hrs</p>
          <Link
            to="/deep-legacy"
            className="rounded-pill px-8 py-3 font-sans text-[12px] font-semibold uppercase tracking-[1.5px] transition-all duration-300 hover:-translate-y-0.5"
            style={{ background: "linear-gradient(135deg, #e8943a, #c47828)", color: "#1a1208" }}
          >
            Begin Research
          </Link>
        </div>
      </div>
    </motion.div>

    <WarmDivider />

    {/* FAQ */}
    <motion.div {...reveal} className="mt-4">
      <h2 className="mb-10 text-center font-display text-2xl text-cream-warm sm:text-3xl">
        Common questions
      </h2>
      <div className="space-y-6">
        {FAQ.map((item) => (
          <motion.div
            key={item.q}
            {...reveal}
            className="rounded-[18px] border p-6"
            style={{ borderColor: "rgba(232,148,58,0.1)", background: "rgba(26,21,16,0.6)" }}
          >
            <h3 className="font-display text-base text-cream-warm">{item.q}</h3>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: "#c4b8a6" }}>{item.a}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>

    <WarmDivider />

    {/* Bottom CTA */}
    <motion.div {...reveal} className="mt-4 text-center">
      <p className="font-display text-2xl text-cream-warm">Ready to discover your legacy?</p>
      <p className="mt-3 italic" style={{ color: "#8a7e6e" }}>It takes five minutes. Start free.</p>
      <Link
        to="/journey/1"
        className="mt-8 inline-block rounded-pill px-12 py-4 font-sans text-[13px] font-semibold uppercase tracking-[1.5px] transition-all duration-300 hover:-translate-y-0.5"
        style={{ background: "linear-gradient(135deg, #e8943a, #c47828)", color: "#1a1208" }}
      >
        Begin Your Journey
      </Link>
    </motion.div>
  </div>
  </div>
);

export default Pricing;
