import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import WarmDivider from "@/components/journey/WarmDivider";

const reveal = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

// Placeholder empty state — cart items will be wired in when cart state is added
export default function Cart() {
  const isEmpty = true; // TODO: replace with actual cart context

  return (
    <div className="relative min-h-screen bg-background">
      <img src="/hero.jpg" alt="" className="pointer-events-none fixed inset-0 h-full w-full object-cover" style={{ objectPosition: "center 30%", opacity: 0.38, filter: "saturate(0.7) brightness(0.95)" }} />
      {/* Grain overlay */}
      <svg className="pointer-events-none fixed inset-0 z-50 h-full w-full opacity-[0.018]">
        <filter id="grain-cart">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain-cart)" />
      </svg>

      <div className="relative z-10 mx-auto max-w-3xl px-6 py-16">
        {/* Header */}
        <motion.div {...reveal} className="mb-10 text-center">
          <p className="mb-3 font-sans text-[10px] uppercase tracking-[4px]" style={{ color: "#a07830" }}>
            Your Selection
          </p>
          <h1 className="font-display text-3xl text-cream-warm sm:text-4xl">Your Cart</h1>
        </motion.div>

        <WarmDivider />

        {isEmpty ? (
          /* ── EMPTY STATE ── */
          <motion.div
            {...reveal}
            transition={{ ...reveal.transition, delay: 0.2 }}
            className="mt-10 flex flex-col items-center text-center"
          >
            {/* Empty icon */}
            <div
              className="mb-6 flex h-20 w-20 items-center justify-center rounded-full"
              style={{
                background: "rgba(212,160,74,0.06)",
                border: "1px solid rgba(212,160,74,0.15)",
              }}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#a07830"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 01-8 0" />
              </svg>
            </div>

            <h2 className="font-display text-2xl text-cream-warm">Your cart is empty</h2>
            <p
              className="mx-auto mt-3 max-w-sm font-serif italic text-[15px] leading-relaxed"
              style={{ color: "#8a7e6e" }}
            >
              Every product is made with your family's unique crest. Begin your journey to forge it first.
            </p>

            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link
                to="/journey"
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
                Begin Your Journey
              </Link>
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
                Browse Shop
              </Link>
            </div>

            <WarmDivider />

            {/* Popular picks */}
            <div className="w-full max-w-2xl">
              <p className="mb-6 font-sans text-[10px] uppercase tracking-[4px]" style={{ color: "#a07830" }}>
                Popular Gifts
              </p>
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { name: "Legacy Pack", price: "$29.99", note: "Instant delivery", path: "/journey" },
                  { name: "Framed Crest Print", price: "from $79", note: "Ships worldwide", path: "/shop" },
                  { name: "Legacy Book", price: "from $59", note: "Softcover or hardcover", path: "/shop" },
                ].map((item) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    className="flex flex-col rounded-[18px] p-5 text-left transition-all duration-300"
                    style={{
                      background: "rgba(26,21,14,0.9)",
                      border: "1px solid rgba(212,160,74,0.08)",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.borderColor =
                        "rgba(212,160,74,0.2)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.borderColor =
                        "rgba(212,160,74,0.08)";
                    }}
                  >
                    <p className="font-display text-base text-cream-warm">{item.name}</p>
                    <p className="mt-1 font-display text-lg" style={{ color: "#d4a04a" }}>
                      {item.price}
                    </p>
                    <p className="mt-1 font-sans text-[11px]" style={{ color: "#5a4e3e" }}>
                      {item.note}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>
        ) : null}
      </div>
    </div>
  );
}
