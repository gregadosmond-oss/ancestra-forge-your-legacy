import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import WarmDivider from "@/components/journey/WarmDivider";
import { useCart } from "@/contexts/CartContext";
import {
  SHOP_PRODUCTS,
  SHOP_BUNDLES,
  CATEGORY_LABELS,
  type ShopProduct,
} from "@/data/shopProducts";

const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" } as const,
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

const stagger = (i: number) => ({
  ...reveal,
  transition: { ...reveal.transition, delay: i * 0.06 },
});

const CATEGORIES: Array<{ value: ShopProduct["category"] | "all"; label: string }> = [
  { value: "all", label: "All Products" },
  { value: "digital", label: "Digital" },
  { value: "print", label: "Prints & Wall Art" },
  { value: "drinkware", label: "Drinkware" },
  { value: "keepsake", label: "Keepsakes" },
  { value: "book", label: "Legacy Books" },
];

export default function Shop() {
  const [activeCategory, setActiveCategory] = useState<ShopProduct["category"] | "all">("all");
  const { addItem } = useCart();
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  const handleAddToCart = (product: ShopProduct) => {
    const numericPrice = parseFloat(product.price.replace(/[^0-9.]/g, ""));
    addItem({
      id: product.id,
      name: product.name,
      price: numericPrice,
      priceId: product.id,
      productType: product.category,
    });
    setAddedIds(prev => new Set(prev).add(product.id));
    setTimeout(() => {
      setAddedIds(prev => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
    }, 2000);
  };

  const filtered =
    activeCategory === "all"
      ? SHOP_PRODUCTS
      : SHOP_PRODUCTS.filter((p) => p.category === activeCategory);

  return (
    <div className="relative flex min-h-screen flex-col items-center overflow-hidden bg-background">
      <img src="/hero.jpg" alt="" className="pointer-events-none fixed inset-0 h-full w-full object-cover" style={{ objectPosition: "center 30%", opacity: 0.38, filter: "saturate(0.7) brightness(0.95)" }} />
      {/* Grain overlay */}
      <svg className="pointer-events-none fixed inset-0 z-50 h-full w-full opacity-[0.018]">
        <filter id="grain-shop">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.65"
            numOctaves="3"
            stitchTiles="stitch"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain-shop)" />
      </svg>

      {/* ── HERO ── */}
      <section className="relative w-full px-6 py-20 text-center">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 50% 30%, rgba(232,148,58,0.06) 0%, transparent 70%)",
          }}
        />
        <motion.p
          {...reveal}
          className="mb-4 font-sans text-[10px] uppercase tracking-[4px]"
          style={{ color: "#a07830" }}
        >
          Forged by AncestorsQR
        </motion.p>
        <motion.h1
          {...stagger(1)}
          className="font-display leading-tight text-cream-warm"
          style={{ fontSize: "clamp(32px, 5vw, 52px)" }}
        >
          Heirloom Shop
        </motion.h1>
        <motion.p
          {...stagger(2)}
          className="mx-auto mt-5 font-serif italic"
          style={{
            fontSize: "clamp(16px, 2vw, 19px)",
            color: "#c4b8a6",
            maxWidth: 520,
            lineHeight: 1.7,
          }}
        >
          Every product is made with your family's unique crest. Begin your journey
          first — then choose how to hold it forever.
        </motion.p>
        <motion.div {...stagger(3)} className="mt-10 flex flex-wrap items-center justify-center gap-3">
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
          <a
            href="#bundles"
            className="inline-block rounded-pill px-8 py-4 font-sans text-[13px] font-semibold uppercase tracking-[1.5px]"
            style={{
              background: "rgba(212,160,74,0.06)",
              border: "1px solid rgba(212,160,74,0.2)",
              color: "#d4a04a",
              transition: "all 0.3s cubic-bezier(0.22,1,0.36,1)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.background =
                "rgba(212,160,74,0.12)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.background =
                "rgba(212,160,74,0.06)";
            }}
          >
            View Bundles ↓
          </a>
        </motion.div>
      </section>

      <WarmDivider />

      {/* ── CATEGORY FILTER ── */}
      <section className="w-full max-w-5xl px-6 py-8">
        <motion.div {...reveal} className="flex flex-wrap justify-center gap-2">
          {CATEGORIES.map((cat) => {
            const active = activeCategory === cat.value;
            return (
              <button
                key={cat.value}
                onClick={() => setActiveCategory(cat.value)}
                className="rounded-pill font-sans text-[11px] uppercase tracking-[1.5px] transition-all duration-200"
                style={{
                  padding: "8px 18px",
                  border: active
                    ? "1px solid rgba(232,148,58,0.5)"
                    : "1px solid rgba(61,48,32,1)",
                  background: active
                    ? "rgba(232,148,58,0.1)"
                    : "rgba(26,21,14,0.8)",
                  color: active ? "#e8b85c" : "#8a7e6e",
                  cursor: "pointer",
                }}
              >
                {cat.label}
              </button>
            );
          })}
        </motion.div>
      </section>

      {/* ── PRODUCT GRID ── */}
      <section className="w-full max-w-5xl px-6 pb-10">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((product, i) => {
            const isDigital = product.category === "digital";
            const isLive = isDigital || product.live === true;
            const linkHref = product.href ?? "/journey";
            return (
              <motion.div
                key={product.id}
                {...stagger(i % 6)}
                className="relative flex flex-col rounded-[22px] p-6"
                style={{
                  background: "#1a1510",
                  border: `1px solid ${isLive ? "rgba(232,148,58,0.18)" : "rgba(61,48,32,0.6)"}`,
                  opacity: isLive ? 1 : 0.7,
                  transition: "border-color 0.3s ease, background 0.3s ease",
                  cursor: "default",
                }}
                onMouseEnter={(e) => {
                  if (!isLive) return;
                  (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(232,148,58,0.38)";
                  (e.currentTarget as HTMLDivElement).style.background = "#221c14";
                }}
                onMouseLeave={(e) => {
                  if (!isLive) return;
                  (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(232,148,58,0.18)";
                  (e.currentTarget as HTMLDivElement).style.background = "#1a1510";
                }}
              >
                {/* Coming Soon badge for non-live physical products */}
                {!isLive && (
                  <span
                    className="mb-3 self-start rounded-pill font-sans text-[9px] uppercase tracking-[2px]"
                    style={{
                      padding: "4px 12px",
                      background: "rgba(138,126,110,0.1)",
                      border: "1px solid rgba(138,126,110,0.25)",
                      color: "#8a7e6e",
                    }}
                  >
                    Coming Soon
                  </span>
                )}

                {isLive && product.tag && (
                  <span
                    className="mb-3 self-start rounded-pill font-sans text-[9px] uppercase tracking-[2px]"
                    style={{
                      padding: "4px 12px",
                      background: "rgba(232,148,58,0.12)",
                      border: "1px solid rgba(232,148,58,0.3)",
                      color: "#e8943a",
                    }}
                  >
                    {product.tag}
                  </span>
                )}

                {/* Product image */}
                {product.image && (
                  <div className="mb-4 h-[160px] w-full overflow-hidden rounded-[14px]" style={{ background: "#13100b" }}>
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-full w-full object-cover object-bottom"
                    />
                  </div>
                )}

                {/* Category label */}
                <p
                  className="mb-2 font-sans text-[9px] uppercase tracking-[2px]"
                  style={{ color: "#5a4e3e" }}
                >
                  {CATEGORY_LABELS[product.category]}
                </p>

                <h3
                  className="font-display text-xl"
                  style={{ color: isLive ? "#f0e8da" : "#8a7e6e" }}
                >
                  {product.name}
                </h3>

                <p
                  className="mt-1 font-display text-2xl"
                  style={{ color: isLive ? "#d4a04a" : "#5a4e3e" }}
                >
                  {product.price}
                  {product.priceNote && (
                    <span
                      className="ml-2 font-sans text-[11px] font-normal"
                      style={{ color: "#8a7e6e" }}
                    >
                      · {product.priceNote}
                    </span>
                  )}
                </p>

                <p
                  className="mt-3 font-sans text-[13px] leading-relaxed"
                  style={{ color: "#a09280", flexGrow: 1 }}
                >
                  {product.description}
                </p>

                {isLive ? (
                  product.live ? (
                    product.href?.startsWith("/product-order") ? (
                      <Link
                        to={product.href}
                        className="mt-5 self-start rounded-pill font-sans text-[11px] font-semibold uppercase tracking-[1.5px] transition-all duration-300 hover:-translate-y-0.5"
                        style={{
                          padding: "10px 22px",
                          background: "linear-gradient(135deg, #e8943a, #c47828)",
                          color: "#1a1208",
                          textDecoration: "none",
                        }}
                      >
                        Order Now →
                      </Link>
                    ) : (
                      <button
                        onClick={() => handleAddToCart(product)}
                        className="mt-5 self-start rounded-pill font-sans text-[11px] font-semibold uppercase tracking-[1.5px] transition-all duration-300 hover:-translate-y-0.5"
                        style={{
                          padding: "10px 22px",
                          background: addedIds.has(product.id)
                            ? "linear-gradient(135deg, #4a9e6a, #3a7e52)"
                            : "linear-gradient(135deg, #e8943a, #c47828)",
                          color: "#1a1208",
                          border: "none",
                          cursor: "pointer",
                          transition: "background 0.3s ease, transform 0.3s ease",
                        }}
                      >
                        {addedIds.has(product.id) ? "Added ✓" : "Add to Cart"}
                      </button>
                    )
                  ) : (
                    <Link
                      to={linkHref}
                      className="mt-5 self-start font-sans text-[11px] uppercase tracking-[1.5px]"
                      style={{
                        color: "#a07830",
                        textDecoration: "none",
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        transition: "color 0.2s",
                      }}
                      onMouseEnter={(e) =>
                        ((e.currentTarget as HTMLAnchorElement).style.color = "#d4a04a")
                      }
                      onMouseLeave={(e) =>
                        ((e.currentTarget as HTMLAnchorElement).style.color = "#a07830")
                      }
                    >
                      Begin your journey →
                    </Link>
                  )
                ) : (
                  <p
                    className="mt-5 font-sans text-[11px] uppercase tracking-[1.5px]"
                    style={{ color: "#5a4e3e" }}
                  >
                    Available soon
                  </p>
                )}
              </motion.div>
            );
          })}
        </div>
      </section>

      <WarmDivider />

      {/* ── BUNDLES ── */}
      <section id="bundles" className="w-full max-w-5xl px-6 py-10">
        <motion.p
          {...reveal}
          className="mb-2 text-center font-sans text-[10px] uppercase tracking-[4px]"
          style={{ color: "#a07830" }}
        >
          Best Value
        </motion.p>
        <motion.h2
          {...stagger(1)}
          className="mb-10 text-center font-display text-3xl text-cream-warm"
        >
          Gift Bundles
        </motion.h2>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SHOP_BUNDLES.map((bundle, i) => (
            <motion.div
              key={bundle.id}
              {...stagger(i % 3)}
              className="relative flex flex-col rounded-[28px] p-7"
              style={{
                background: "#1a1510",
                border: "1px solid rgba(61,48,32,0.6)",
                opacity: 0.7,
              }}
            >
              <span
                className="mb-3 self-start rounded-pill font-sans text-[9px] uppercase tracking-[2px]"
                style={{
                  padding: "4px 12px",
                  background: "rgba(138,126,110,0.1)",
                  border: "1px solid rgba(138,126,110,0.25)",
                  color: "#8a7e6e",
                }}
              >
                Coming Soon
              </span>

              <h3 className="font-display text-xl" style={{ color: "#f0e8da" }}>
                {bundle.name}
              </h3>
              <p
                className="mt-1 font-display text-2xl"
                style={{ color: "#e8943a" }}
              >
                {bundle.price}
              </p>
              <p
                className="mt-2 font-serif italic text-[13px]"
                style={{ color: "#8a7e6e" }}
              >
                {bundle.tagline}
              </p>

              <ul className="mt-4 flex-1 space-y-2">
                {bundle.includes.map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2 font-sans text-[13px]"
                    style={{ color: "#c4b8a6" }}
                  >
                    <span style={{ color: "#d4a04a", fontSize: 8 }}>✦</span>
                    {item}
                  </li>
                ))}
              </ul>

              <p
                className="mt-6 text-center font-sans text-[11px] uppercase tracking-[1.5px]"
                style={{ color: "#5a4e3e" }}
              >
                Available soon
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      <WarmDivider />

      {/* ── HOW IT WORKS NOTE ── */}
      <motion.section
        {...reveal}
        className="w-full max-w-2xl px-6 py-10 text-center"
      >
        <p
          className="mb-4 font-sans text-[10px] uppercase tracking-[4px]"
          style={{ color: "#a07830" }}
        >
          How It Works
        </p>
        <h2
          className="font-display text-2xl text-cream-warm"
          style={{ fontSize: "clamp(20px, 3vw, 30px)" }}
        >
          Every product starts with your surname.
        </h2>
        <p
          className="mx-auto mt-4 font-sans text-[14px] leading-relaxed"
          style={{ color: "#a09280", maxWidth: 460 }}
        >
          Begin your journey — enter your surname and we'll forge your unique coat of arms,
          family story, and bloodline tree. Then choose any product to put your crest on it.
          All physical products include the full digital Legacy Pack.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          {[
            { step: "01", label: "Enter your surname" },
            { step: "02", label: "We forge your crest" },
            { step: "03", label: "Choose your heirloom" },
          ].map(({ step, label }) => (
            <div
              key={step}
              className="flex items-center gap-3 rounded-[14px] px-5 py-3"
              style={{
                background: "rgba(26,21,14,0.8)",
                border: "1px solid rgba(212,160,74,0.1)",
              }}
            >
              <span
                className="font-display text-xl"
                style={{ color: "#e8943a" }}
              >
                {step}
              </span>
              <span className="font-sans text-[12px]" style={{ color: "#c4b8a6" }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </motion.section>

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
          style={{ fontSize: "clamp(24px, 4vw, 42px)", maxWidth: 560 }}
        >
          The gift they'll talk about for years.
        </h2>
        <p
          className="mx-auto mt-4 font-serif italic"
          style={{ color: "#c4b8a6", fontSize: 16, maxWidth: 420 }}
        >
          Enter any surname and we'll build their crest, story, and legacy in minutes.
        </p>
        <Link
          to="/journey"
          className="mt-8 inline-block rounded-pill px-12 py-5 font-sans text-[13px] font-semibold uppercase tracking-[1.5px]"
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
      </motion.section>
    </div>
  );
}
