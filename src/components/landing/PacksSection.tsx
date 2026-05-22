import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useStripePrice } from "@/hooks/useStripePrice";

const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" } as const,
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

const FREE_ITEMS = [
  "Surname lookup",
  "Motto generator",
  "Bloodline quiz",
  "Meet your ancestor",
  "The 1700s you",
  "Ancestor chat",
];

const LEGACY_ITEMS = [
  "Custom coat of arms (high-res)",
  "9-chapter family story",
  "Visual bloodline tree",
  "Legacy certificate",
  "Ancestor chat",
  "Instant access — no shipping",
];

const BOOK_ITEMS = [
  "Everything in Legacy Pack",
  "Heirloom hardcover, 8×11\"",
  "9 chapters, 42 pages",
  "Legacy Certificate (bound + printable)",
  "5-generation visual tree",
  "Matte-laminated cover",
  "Printed and shipped by Gelato",
];

const BulletList = ({ items }: { items: string[] }) => (
  <ul className="mt-5 w-full space-y-2 text-left" style={{ flex: 1 }}>
    {items.map((item) => (
      <li
        key={item}
        className="flex items-start gap-3 font-sans text-[14px]"
        style={{ color: "#d0c4b4", lineHeight: 2 }}
      >
        <span style={{ color: "#d4a04a", lineHeight: 1.8 }}>·</span>
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

const cardBase: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  height: "100%",
  position: "relative",
  background: "#1a1510",
  border: "1px solid #3d3020",
  borderRadius: 22,
  padding: 40,
  transition: "all 0.3s cubic-bezier(0.22,1,0.36,1)",
};

const hoverIn = (e: React.MouseEvent<HTMLDivElement>) => {
  e.currentTarget.style.background = "#221c14";
  e.currentTarget.style.transform = "translateY(-4px)";
};
const hoverOut = (e: React.MouseEvent<HTMLDivElement>, bg = "#1a1510") => {
  e.currentTarget.style.background = bg;
  e.currentTarget.style.transform = "";
};

const PacksSection = () => {
  const legacyPrice = useStripePrice("legacy_pack_once", "$29.99");
  const bookPrice = useStripePrice("legacy_book_once", "$129");

  // Split $29.99 into dollars + cents
  const [dollars, cents] = legacyPrice.split(".");
  const bookDollars = bookPrice.split(".")[0];

  return (
    <motion.section {...reveal} className="py-16">
      <div className="text-center">
        <p className="mb-3 font-sans text-[10px] uppercase tracking-[4px]" style={{ color: "#a07830" }}>
          Choose Your Legacy
        </p>
        <h2 className="font-display text-3xl text-cream-warm sm:text-4xl">
          Pick the pack that's right for you
        </h2>
        <p className="mx-auto mt-4 max-w-md font-serif italic" style={{ color: "#c4b8a6" }}>
          Start free, or unlock your full family legacy today.
        </p>
      </div>

      <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3" style={{ alignItems: "stretch" }}>
        {/* TIER 1 — Free Tools */}
        <div
          style={cardBase}
          onMouseEnter={hoverIn}
          onMouseLeave={(e) => hoverOut(e)}
          className="flex flex-col"
        >
          <p className="font-sans text-[13px] uppercase" style={{ color: "#8a7e6e", letterSpacing: "2px" }}>
            Always Free
          </p>
          <h3 className="mt-6 font-display" style={{ fontSize: 28, color: "#f0e8da" }}>
            Free Tools
          </h3>
          <p className="mt-2 font-serif italic" style={{ fontSize: 15, color: "#c4b8a6" }}>
            Start with curiosity.
          </p>
          <BulletList items={FREE_ITEMS} />
          <Link
            to="/tools"
            className="block w-full rounded-pill py-3 text-center font-sans text-[12px] font-semibold uppercase tracking-[1.5px]"
            style={{
              marginTop: "auto",
              background: "rgba(232,148,58,0.06)",
              border: "1px solid rgba(232,148,58,0.18)",
              color: "#d4a04a",
            }}
          >
            Try Free
          </Link>
        </div>

        {/* TIER 2 — Legacy Pack (featured) */}
        <div className="relative h-full">
          <div
            className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 rounded-pill font-sans font-bold uppercase"
            style={{
              background: "#d4a04a",
              color: "#1a1208",
              fontSize: 11,
              letterSpacing: "3px",
              padding: "6px 18px",
            }}
          >
            Most Popular
          </div>
          <div
            style={{ ...cardBase, border: "1px solid #d4a04a" }}
            onMouseEnter={hoverIn}
            onMouseLeave={(e) => hoverOut(e)}
            className="flex h-full flex-col"
          >
            <div className="font-display" style={{ fontSize: 48, color: "#e8b85c", lineHeight: 1 }}>
              {dollars}
              {cents && (
                <span style={{ fontSize: "60%", verticalAlign: "0.4em", marginLeft: 2 }}>
                  .{cents}
                </span>
              )}
            </div>
            <p className="mt-2 font-sans uppercase" style={{ fontSize: 12, letterSpacing: "2px", color: "#8a7e6e" }}>
              One-Time
            </p>
            <h3 className="mt-6 font-display" style={{ fontSize: 28, color: "#f0e8da" }}>
              Legacy Pack
            </h3>
            <p className="mt-2 font-serif italic" style={{ fontSize: 15, color: "#c4b8a6" }}>
              Your full digital legacy.
            </p>
            <BulletList items={LEGACY_ITEMS} />
            <Link
              to="/journey/1"
              className="block w-full rounded-pill py-3 text-center font-sans text-[12px] font-semibold uppercase tracking-[1.5px]"
              style={{
                marginTop: "auto",
                background: "linear-gradient(135deg, #e8943a, #c47828)",
                color: "#1a1208",
              }}
            >
              Unlock Your Legacy
            </Link>
          </div>
        </div>

        {/* TIER 3 — Legacy Book */}
        <div className="relative h-full">
          <div
            className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 rounded-pill font-sans uppercase"
            style={{
              background: "transparent",
              border: "1px solid #d4a04a",
              color: "#d4a04a",
              fontSize: 11,
              letterSpacing: "3px",
              padding: "6px 18px",
            }}
          >
            Heirloom
          </div>
          <div
            style={cardBase}
            onMouseEnter={hoverIn}
            onMouseLeave={(e) => hoverOut(e)}
            className="flex h-full flex-col"
          >
            <div className="font-display" style={{ fontSize: 48, color: "#e8b85c", lineHeight: 1 }}>
              {bookDollars}
            </div>
            <p className="mt-2 font-sans uppercase" style={{ fontSize: 12, letterSpacing: "2px", color: "#8a7e6e" }}>
              One-Time · Shipped Worldwide
            </p>
            <h3 className="mt-6 font-display" style={{ fontSize: 28, color: "#f0e8da" }}>
              Legacy Book
            </h3>
            <p className="mt-2 font-serif italic" style={{ fontSize: 15, color: "#c4b8a6" }}>
              Bound and shipped to your shelf.
            </p>
            <BulletList items={BOOK_ITEMS} />
            <Link
              to="/shop"
              className="block w-full rounded-pill py-3 text-center font-sans text-[12px] font-semibold uppercase tracking-[1.5px]"
              style={{
                marginTop: "auto",
                background: "rgba(232,148,58,0.06)",
                border: "1px solid rgba(232,148,58,0.18)",
                color: "#d4a04a",
              }}
            >
              Order the Book
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-10 max-w-[600px] text-center">
        <p className="font-sans italic" style={{ fontSize: 13, color: "#8a7e6e" }}>
          Looking for the premium tier? Our Deep Legacy research package includes a 15-question AI interview, deep historical records, and 24-hour turnaround.{" "}
          <Link
            to="/deep-legacy"
            style={{ color: "#d4a04a", textDecoration: "none" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.textDecoration = "underline")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.textDecoration = "none")}
          >
            Learn about Deep Legacy →
          </Link>
        </p>
      </div>
    </motion.section>
  );
};

export default PacksSection;
