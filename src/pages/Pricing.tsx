import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import WarmDivider from "@/components/journey/WarmDivider";
import PacksSection from "@/components/landing/PacksSection";
import { usePageMeta } from "@/hooks/usePageMeta";

const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" } as const,
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

const FAQ = [
  {
    q: "What do I get with Legacy?",
    a: "Your full 9-chapter family story written by AI using real historical records, a high-resolution coat of arms, a visual bloodline tree, and a legacy certificate — all delivered to your email within minutes.",
  },
  {
    q: "What's the difference between Legacy and the Physical Book?",
    a: "Legacy is the full digital experience, delivered instantly. The Physical Book is the same story bound as a hardcover heirloom — 9 chapters, 42 pages, matte-laminated cover — printed and shipped worldwide.",
  },
  {
    q: "How fast is delivery?",
    a: "Legacy is delivered within minutes. The Physical Book is printed on demand and ships within 7–10 business days.",
  },
  {
    q: "Can I gift this to someone?",
    a: "Yes. At checkout you can enter a recipient's email and a personal note. We deliver it straight to them.",
  },
  {
    q: "Is this a subscription?",
    a: "No. Everything is a one-time payment. No recurring charges.",
  },
  {
    q: "Refund policy?",
    a: "Digital Legacy purchases are non-refundable once delivered. For the Physical Book, we replace anything damaged or misprinted at no cost. Email greg@ancestorsqr.com if something's wrong.",
  },
];

const FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map(({ q, a }) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: a },
  })),
};

const Pricing = () => {
  usePageMeta({
    title: "Pricing | AncestorsQR",
    description: "Start free. Unlock your full digital legacy for $29.99. Bind it as a hardcover heirloom for $129.",
  });

  return (
    <div className="relative min-h-screen bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSONLD) }} />
      <img
        src="/hero.jpg"
        alt=""
        className="pointer-events-none fixed inset-0 h-full w-full object-cover"
        style={{ objectPosition: "center 30%", opacity: 0.38, filter: "saturate(0.7) brightness(0.95)" }}
      />
      <div className="relative z-10 mx-auto max-w-5xl px-6 py-20">
        {/* Hero */}
        <motion.div {...reveal} className="text-center">
          <p className="mb-3 font-sans text-[10px] uppercase tracking-[4px]" style={{ color: "#a07830" }}>
            Simple Pricing
          </p>
          <h1 className="font-display text-4xl text-cream-warm sm:text-5xl">
            Your legacy, your price.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg italic" style={{ color: "#c4b8a6" }}>
            Start free and discover your family name. Unlock the full story when you're ready. Bind it as an heirloom that lasts forever.
          </p>
        </motion.div>

        <WarmDivider />

        {/* 3-tier grid (shared with landing) */}
        <PacksSection />

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
                <p className="mt-2 text-sm leading-relaxed" style={{ color: "#c4b8a6" }}>
                  {item.a}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <WarmDivider />

        {/* Bottom CTA */}
        <motion.div {...reveal} className="mt-4 text-center">
          <p className="font-display text-2xl text-cream-warm">Ready to discover your legacy?</p>
          <p className="mt-3 italic" style={{ color: "#8a7e6e" }}>
            It takes five minutes. Start free.
          </p>
          <Link
            to="/signup"
            className="mt-8 inline-block rounded-pill px-12 py-4 font-sans text-[13px] font-semibold uppercase tracking-[1.5px] transition-all duration-300 hover:-translate-y-0.5"
            style={{ background: "linear-gradient(135deg, #e8943a, #c47828)", color: "#1a1208" }}
          >
            Begin Your Journey
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default Pricing;

// LEGACY: removed during digital-first revamp May 22 2026
// The previous 3-tier (Free / Legacy Pack / Deep Legacy) grid was inlined here.
// It has been replaced with the shared <PacksSection /> (Free Tools / Legacy Pack / Legacy Book).
// Deep Legacy moved to the trailing footnote with a /deep-legacy link.
