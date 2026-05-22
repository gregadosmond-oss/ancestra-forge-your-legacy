import { useParams, Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Heart, Hourglass } from "lucide-react";
import { getOccasionBySlug } from "@/data/giftOccasions";
import WarmDivider from "@/components/journey/WarmDivider";
import { useStripePrice } from "@/hooks/useStripePrice";

const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" } as const,
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

const stagger = (i: number) => ({
  ...reveal,
  transition: { ...reveal.transition, delay: i * 0.08 },
});

export default function GiftOccasionPage() {
  const { occasion } = useParams<{ occasion: string }>();
  const config = getOccasionBySlug(occasion ?? "");
  const legacyPrice = useStripePrice("legacy_pack_once", "$29.99");
  const bookPrice = useStripePrice("legacy_book_once", "$129");

  if (!config) return <Navigate to="/" replace />;

  return (
    <div className="relative flex min-h-screen flex-col items-center overflow-hidden bg-background">
      <img src="/hero.jpg" alt="" className="pointer-events-none fixed inset-0 h-full w-full object-cover" style={{ objectPosition: "center 30%", opacity: 0.38, filter: "saturate(0.7) brightness(0.95)" }} />
      {/* Grain overlay */}
      <svg className="pointer-events-none fixed inset-0 z-50 h-full w-full opacity-[0.018]">
        <filter id="grain-gift">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.65"
            numOctaves="3"
            stitchTiles="stitch"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain-gift)" />
      </svg>

      {/* ── HERO ── */}
      <section
        className="relative w-full flex flex-col items-center justify-center px-6 py-24 text-center"
        style={{ minHeight: "60vh" }}
      >
        {/* Ambient glow */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 50% 40%, rgba(232,148,58,0.07) 0%, transparent 70%)",
          }}
        />

        <motion.p
          {...reveal}
          className="mb-4 font-sans text-[10px] uppercase tracking-[4px]"
          style={{ color: "#a07830" }}
        >
          {config.heroLabel}
        </motion.p>

        <motion.h1
          {...stagger(1)}
          className="font-display leading-tight text-cream-warm"
          style={{ fontSize: "clamp(32px, 6vw, 58px)", maxWidth: 700 }}
        >
          {config.heroHeadline}
        </motion.h1>

        <motion.p
          {...stagger(2)}
          className="mt-5 font-serif italic"
          style={{
            fontSize: "clamp(16px, 2vw, 19px)",
            color: "#c4b8a6",
            maxWidth: 540,
            lineHeight: 1.7,
          }}
        >
          {config.heroSubhead}
        </motion.p>

        <motion.div {...stagger(3)} className="mt-10">
          <Link
            to="/journey/1"
            className="inline-block rounded-pill px-10 py-4 font-sans text-[13px] font-semibold uppercase tracking-[1.5px]"
            style={{
              background: "linear-gradient(135deg, #e8943a, #c47828)",
              color: "#1a1208",
              transition: "all 0.4s cubic-bezier(0.22,1,0.36,1)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.transform =
                "translateY(-2px)";
              (e.currentTarget as HTMLAnchorElement).style.boxShadow =
                "0 12px 40px rgba(232,148,58,0.25)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.transform = "";
              (e.currentTarget as HTMLAnchorElement).style.boxShadow = "";
            }}
          >
            Begin Your Journey
          </Link>
        </motion.div>
      </section>

      <WarmDivider />

      {/* ── WHY IT WORKS ── */}
      <motion.section
        {...reveal}
        className="w-full max-w-3xl px-6 py-10 text-center"
      >
        <p
          className="mb-6 font-sans text-[10px] uppercase tracking-[4px]"
          style={{ color: "#a07830" }}
        >
          Why AncestorsQR
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          {[
            { icon: Sparkles, label: "Completely unique" },
            { icon: Heart, label: "Deeply emotional" },
            { icon: Hourglass, label: "Lasts forever" },
          ].map(({ icon: Icon, label }) => (
            <span
              key={label}
              className="flex items-center gap-2 rounded-pill font-sans text-[12px] uppercase tracking-[1.5px]"
              style={{
                padding: "10px 22px",
                border: "1px solid rgba(212,160,74,0.2)",
                background: "rgba(212,160,74,0.05)",
                color: "#d4a04a",
              }}
            >
              <Icon size={14} color="#d4a04a" />
              {label}
            </span>
          ))}
        </div>
      </motion.section>

      <WarmDivider />

      {/* ── PRODUCT CARDS ── */}
      <section className="w-full max-w-4xl px-6 py-10">
        <motion.p
          {...reveal}
          className="mb-2 text-center font-sans text-[10px] uppercase tracking-[4px]"
          style={{ color: "#a07830" }}
        >
          Curated for {config.name}
        </motion.p>
        <motion.h2
          {...stagger(1)}
          className="mb-10 text-center font-display text-3xl text-cream-warm"
        >
          Choose your gift
        </motion.h2>

        {/* LEGACY: removed during digital-first revamp May 22 2026
            The full config.products grid (mug, canvas, coaster, blanket, t-shirt,
            acrylic, charcuterie board, speaker) has been replaced with a 2-card
            row showing only the Legacy Pack and the Legacy Book. */}
        <div className="grid gap-5 sm:grid-cols-2">
          {/* Legacy Pack — digital gift */}
          <motion.div
            {...stagger(0)}
            className="relative flex flex-col rounded-[22px] p-7"
            style={{
              background: "rgba(26,21,14,0.9)",
              border: "1px solid rgba(232,148,58,0.35)",
              transition: "all 0.3s ease",
            }}
          >
            <span
              className="mb-3 self-start rounded-pill font-sans text-[9px] uppercase tracking-[2px]"
              style={{
                padding: "4px 12px",
                background: "rgba(232,148,58,0.12)",
                border: "1px solid rgba(232,148,58,0.3)",
                color: "#e8943a",
              }}
            >
              Instant Gift
            </span>
            <h3 className="font-display text-2xl" style={{ color: "#f0e8da" }}>
              Legacy Pack
            </h3>
            <p className="mt-1 font-sans text-[14px] font-semibold" style={{ color: "#d4a04a" }}>
              {legacyPrice}
            </p>
            <p className="mt-3 font-serif italic text-[14px] leading-relaxed" style={{ color: "#c4b8a6", flexGrow: 1 }}>
              Their full digital legacy — coat of arms, 9-chapter family story, bloodline tree, and certificate. Delivered to their inbox within minutes.
            </p>
            <Link
              to="/checkout?isGift=true&priceId=legacy_pack_once"
              className="mt-6 self-start rounded-pill px-7 py-3 font-sans text-[12px] font-semibold uppercase tracking-[1.5px]"
              style={{
                background: "linear-gradient(135deg, #e8943a, #c47828)",
                color: "#1a1208",
              }}
            >
              Gift the Legacy Pack
            </Link>
          </motion.div>

          {/* Legacy Book — heirloom gift */}
          <motion.div
            {...stagger(1)}
            className="relative flex flex-col rounded-[22px] p-7"
            style={{
              background: "rgba(26,21,14,0.9)",
              border: "1px solid #3d3020",
              transition: "all 0.3s ease",
            }}
          >
            <span
              className="mb-3 self-start rounded-pill font-sans text-[9px] uppercase tracking-[2px]"
              style={{
                padding: "4px 12px",
                background: "transparent",
                border: "1px solid #d4a04a",
                color: "#d4a04a",
              }}
            >
              Heirloom
            </span>
            <h3 className="font-display text-2xl" style={{ color: "#f0e8da" }}>
              Legacy Book
            </h3>
            <p className="mt-1 font-sans text-[14px] font-semibold" style={{ color: "#d4a04a" }}>
              {bookPrice}
            </p>
            <p className="mt-3 font-serif italic text-[14px] leading-relaxed" style={{ color: "#c4b8a6", flexGrow: 1 }}>
              The same story bound as a hardcover heirloom — 12 chapters, 42 pages, matte-laminated cover. Printed and shipped worldwide.
            </p>
            <Link
              to="/shop"
              className="mt-6 self-start rounded-pill px-7 py-3 font-sans text-[12px] font-semibold uppercase tracking-[1.5px]"
              style={{
                background: "rgba(232,148,58,0.06)",
                border: "1px solid rgba(232,148,58,0.18)",
                color: "#d4a04a",
              }}
            >
              Gift the Legacy Book
            </Link>
          </motion.div>
        </div>
      </section>

      {/* LEGACY: removed during digital-first revamp May 22 2026 — Dad Bundle physical product spotlight
      {config.bundle && (
        <>
          <WarmDivider />
          <motion.section
            {...reveal}
            className="w-full max-w-2xl px-6 py-10 text-center"
          >
            <p
              className="mb-4 font-sans text-[10px] uppercase tracking-[4px]"
              style={{ color: "#a07830" }}
            >
              Best Value
            </p>
            <div
              className="rounded-[28px] p-8"
              style={{
                background: "rgba(26,21,14,0.95)",
                border: "1px solid rgba(232,148,58,0.25)",
                boxShadow: "0 0 60px rgba(232,148,58,0.05)",
              }}
            >
              <h2 className="font-display text-3xl" style={{ color: "#f0e8da" }}>
                {config.bundle.name}
              </h2>
              <p
                className="mt-2 font-display text-2xl"
                style={{ color: "#e8943a" }}
              >
                {config.bundle.price}
              </p>
              <ul className="mt-5 space-y-2">
                {config.bundle.includes.map((item) => (
                  <li
                    key={item}
                    className="flex items-center justify-center gap-2 font-sans text-[14px]"
                    style={{ color: "#c4b8a6" }}
                  >
                    <span style={{ color: "#d4a04a" }}>✦</span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                to="/journey/1"
                className="mt-8 inline-block rounded-pill px-10 py-4 font-sans text-[13px] font-semibold uppercase tracking-[1.5px]"
                style={{
                  background: "linear-gradient(135deg, #e8943a, #c47828)",
                  color: "#1a1208",
                  transition: "all 0.4s cubic-bezier(0.22,1,0.36,1)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.transform =
                    "translateY(-2px)";
                  (e.currentTarget as HTMLAnchorElement).style.boxShadow =
                    "0 12px 40px rgba(232,148,58,0.25)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.transform = "";
                  (e.currentTarget as HTMLAnchorElement).style.boxShadow = "";
                }}
              >
                Begin Your Journey
              </Link>
            </div>
          </motion.section>
        </>
      )}
      */}

      <WarmDivider />

      {/* ── BOTTOM CTA ── */}
      <motion.section
        {...reveal}
        className="w-full px-6 py-20 text-center"
        style={{ background: "rgba(20,14,8,0.6)" }}
      >
        <p
          className="mb-3 font-sans text-[10px] uppercase tracking-[4px]"
          style={{ color: "#a07830" }}
        >
          Forged by AncestorsQR
        </p>
        <h2
          className="mx-auto font-display leading-tight text-cream-warm"
          style={{ fontSize: "clamp(24px, 4vw, 42px)", maxWidth: 580 }}
        >
          {config.ctaLine}
        </h2>
        <p
          className="mx-auto mt-4 font-serif italic"
          style={{ color: "#c4b8a6", fontSize: 16, maxWidth: 420 }}
        >
          Enter any surname and we'll build their crest, story, and legacy in
          minutes.
        </p>
        <Link
          to="/journey/1"
          className="mt-8 inline-block rounded-pill px-12 py-5 font-sans text-[13px] font-semibold uppercase tracking-[1.5px]"
          style={{
            background: "linear-gradient(135deg, #e8943a, #c47828)",
            color: "#1a1208",
            transition: "all 0.4s cubic-bezier(0.22,1,0.36,1)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.transform =
              "translateY(-2px)";
            (e.currentTarget as HTMLAnchorElement).style.boxShadow =
              "0 12px 40px rgba(232,148,58,0.25)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.transform = "";
            (e.currentTarget as HTMLAnchorElement).style.boxShadow = "";
          }}
        >
          Begin Your Journey
        </Link>
      </motion.section>
    </div>
  );
}
