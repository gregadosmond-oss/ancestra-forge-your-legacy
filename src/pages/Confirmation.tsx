import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import WarmDivider from "@/components/journey/WarmDivider";

const reveal = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
};

const stagger = (delay: number) => ({
  ...reveal,
  transition: { ...reveal.transition, delay },
});

export default function Confirmation() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const type = searchParams.get("type") ?? "digital"; // "digital" | "physical" | "gift"
  const isGift = type === "gift";
  const isPhysical = type === "physical";

  if (!sessionId) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 py-24 text-center">
        <p className="mb-3 font-sans text-[10px] uppercase tracking-[4px]" style={{ color: "#a07830" }}>
          Hmm
        </p>
        <h1 className="font-display text-3xl text-cream-warm">
          No order found.
        </h1>
        <p className="mx-auto mt-4 max-w-sm font-serif italic" style={{ color: "#8a7e6e" }}>
          We couldn't find a completed order. If you were just checking out, please try again.
        </p>
        <Link
          to="/pricing"
          className="mt-8 inline-block rounded-pill px-10 py-4 font-sans text-[13px] font-semibold uppercase tracking-[1.5px] transition-all duration-300 hover:-translate-y-0.5"
          style={{ background: "linear-gradient(135deg, #e8943a, #c47828)", color: "#1a1208" }}
        >
          View Pricing
        </Link>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center overflow-hidden bg-background">
      <img src="/hero.jpg" alt="" className="pointer-events-none fixed inset-0 h-full w-full object-cover" style={{ objectPosition: "center 30%", opacity: 0.38, filter: "saturate(0.7) brightness(0.95)" }} />
      {/* Grain */}
      <svg className="pointer-events-none fixed inset-0 z-50 h-full w-full opacity-[0.018]">
        <filter id="grain-conf">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain-conf)" />
      </svg>

      {/* Ambient glow */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 20%, rgba(232,148,58,0.07) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 mx-auto w-full max-w-2xl px-6 py-20 text-center">
        {/* Checkmark */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full"
          style={{
            background: "rgba(74,158,106,0.12)",
            border: "1px solid rgba(74,158,106,0.3)",
          }}
        >
          <svg
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#4a9e6a"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </motion.div>

        <motion.p {...reveal} className="mb-3 font-sans text-[10px] uppercase tracking-[4px]" style={{ color: "#a07830" }}>
          Order Confirmed
        </motion.p>

        <motion.h1 {...stagger(0.1)} className="font-display text-3xl text-cream-warm sm:text-4xl">
          {isGift
            ? "Your gift is on its way."
            : isPhysical
            ? "Your heirloom is being crafted."
            : "Your legacy is ready."}
        </motion.h1>

        <motion.p
          {...stagger(0.2)}
          className="mx-auto mt-5 max-w-md font-serif italic leading-relaxed"
          style={{ color: "#c4b8a6", fontSize: "17px" }}
        >
          {isGift
            ? "We've sent your gift to the recipient's inbox. They'll receive a beautifully presented preview of their family legacy."
            : isPhysical
            ? "Your order has been sent to production. We'll email you tracking details once it ships — usually within 5–7 business days."
            : "Your family story, crest, bloodline tree, and legacy certificate have been sent to your email."}
        </motion.p>

        <WarmDivider />

        {/* Next steps */}
        <motion.div {...stagger(0.35)} className="text-left">
          <p className="mb-5 text-center font-sans text-[10px] uppercase tracking-[4px]" style={{ color: "#a07830" }}>
            What's Next
          </p>
          <div className="space-y-3">
            {(isPhysical
              ? [
                  "Check your email for your order confirmation and digital Legacy Pack",
                  "Your physical product is in production — ships within 5–7 business days",
                  "You'll receive tracking info by email once it leaves our production partner",
                  "Share your legacy with family — they'll want one too",
                ]
              : isGift
              ? [
                  "Your recipient will receive a gift email with a personal preview",
                  "They'll follow the link to claim their full family legacy",
                  "Check your email for a copy of your gift confirmation",
                  "Physical gifts ship within 5–7 business days if applicable",
                ]
              : [
                  "Check your inbox — your Legacy Pack has been delivered",
                  "Your coat of arms is in the email as a high-res PNG and SVG",
                  "Share your story with family — there's a shareable link inside",
                  "Ready to make it physical? Browse the heirloom shop",
                ]
            ).map((step, i) => (
              <div
                key={i}
                className="flex items-start gap-4 rounded-[14px] p-4"
                style={{
                  background: "rgba(26,21,14,0.8)",
                  border: "1px solid rgba(212,160,74,0.08)",
                }}
              >
                <span
                  className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-sans text-[10px] font-bold"
                  style={{ background: "rgba(232,148,58,0.12)", color: "#e8943a" }}
                >
                  {i + 1}
                </span>
                <p className="font-sans text-[13px] leading-relaxed" style={{ color: "#c4b8a6" }}>
                  {step}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        <WarmDivider />

        {/* CTAs */}
        <motion.div {...stagger(0.5)} className="flex flex-wrap justify-center gap-4">
          <Link
            to="/my-legacy"
            className="inline-block rounded-pill px-10 py-4 font-sans text-[13px] font-semibold uppercase tracking-[1.5px]"
            style={{
              background: "linear-gradient(135deg, #e8943a, #c47828)",
              color: "#1a1208",
              transition: "all 0.4s cubic-bezier(0.22,1,0.36,1)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-2px)";
              (e.currentTarget as HTMLAnchorElement).style.boxShadow =
                "0 12px 40px rgba(232,148,58,0.25)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.transform = "";
              (e.currentTarget as HTMLAnchorElement).style.boxShadow = "";
            }}
          >
            View My Legacy
          </Link>
          {!isPhysical && (
            <Link
              to="/shop"
              className="inline-block rounded-pill px-8 py-4 font-sans text-[13px] font-semibold uppercase tracking-[1.5px]"
              style={{
                background: "rgba(212,160,74,0.06)",
                border: "1px solid rgba(212,160,74,0.2)",
                color: "#d4a04a",
                transition: "all 0.3s cubic-bezier(0.22,1,0.36,1)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.background = "rgba(212,160,74,0.12)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.background = "rgba(212,160,74,0.06)";
              }}
            >
              Browse Heirloom Shop
            </Link>
          )}
        </motion.div>

        {/* Pass it on nudge */}
        <motion.div
          {...stagger(0.65)}
          className="mt-12 rounded-[22px] p-7"
          style={{
            background: "rgba(26,21,14,0.8)",
            border: "1px solid rgba(212,160,74,0.1)",
          }}
        >
          <p className="mb-2 font-sans text-[10px] uppercase tracking-[4px]" style={{ color: "#a07830" }}>
            Pass It On
          </p>
          <p className="font-display text-xl text-cream-warm">
            Who else in your family needs to see this?
          </p>
          <p className="mt-2 font-sans text-[13px] leading-relaxed" style={{ color: "#8a7e6e" }}>
            Every family member has their own story waiting to be forged. Gift them the Legacy Pack or send a free preview.
          </p>
          <Link
            to="/journey/6"
            className="mt-5 inline-block font-sans text-[11px] uppercase tracking-[1.5px] transition-colors duration-200"
            style={{ color: "#a07830" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#d4a04a")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#a07830")}
          >
            Gift or share a preview →
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
