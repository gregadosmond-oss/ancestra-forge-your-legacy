import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import WarmDivider from "@/components/journey/WarmDivider";
import { useCart } from "@/contexts/CartContext";
import { useLegacyPackPrice } from "@/hooks/useLegacyPackPrice";
import { supabase } from "@/integrations/supabase/client";

const reveal = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

export default function Cart() {
  const navigate = useNavigate();
  const { items, removeItem, updateQuantity, totalItems, totalPrice } = useCart();
  const isEmpty = items.length === 0;
  const legacyPrice = useLegacyPackPrice();

  // Legacy Book waitlist (mirrors /shop pattern)
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState("");
  const [notifySurname, setNotifySurname] = useState("");
  const [notifyStatus, setNotifyStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [notifyError, setNotifyError] = useState("");

  const submitNotify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifyEmail.trim()) return;
    setNotifyStatus("loading");
    setNotifyError("");
    try {
      const { data, error } = await supabase.functions.invoke("book-waitlist-signup", {
        body: { email: notifyEmail.trim(), surname: notifySurname.trim() || undefined },
      });
      if (error || data?.error) {
        throw new Error(data?.error || error?.message || "Could not save your signup.");
      }
      setNotifyStatus("success");
    } catch (err) {
      setNotifyError((err as Error).message);
      setNotifyStatus("error");
    }
  };

  const closeNotify = () => {
    setNotifyOpen(false);
    setNotifyEmail("");
    setNotifySurname("");
    setNotifyStatus("idle");
    setNotifyError("");
  };

  return (
    <div className="relative min-h-screen bg-background">
      <img
        src="/hero.jpg"
        alt=""
        className="pointer-events-none fixed inset-0 h-full w-full object-cover"
        style={{ objectPosition: "center 30%", opacity: 0.38, filter: "saturate(0.7) brightness(0.95)" }}
      />
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
                to="/journey/1"
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
                {([
                  { kind: "link" as const, name: "Legacy Pack", price: legacyPrice, note: "Instant delivery", path: "/journey" },
                  { kind: "link" as const, name: "Family Crest Mug", price: "$49.99", note: "Ships in 5–7 days", path: "/product-order" },
                  { kind: "waitlist" as const, name: "The Legacy Book", price: "$129", note: "Coming Soon" },
                ]).map((item) => {
                  const cardStyle: React.CSSProperties = {
                    background: "rgba(26,21,14,0.9)",
                    border: "1px solid rgba(212,160,74,0.08)",
                  };
                  const onEnter = (e: React.MouseEvent<HTMLElement>) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(212,160,74,0.2)";
                  };
                  const onLeave = (e: React.MouseEvent<HTMLElement>) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(212,160,74,0.08)";
                  };
                  const inner = (
                    <>
                      <p className="font-display text-base text-cream-warm">{item.name}</p>
                      <p className="mt-1 font-display text-lg" style={{ color: "#d4a04a" }}>
                        {item.price}
                      </p>
                      <p className="mt-1 font-sans text-[11px]" style={{ color: "#5a4e3e" }}>
                        {item.note}
                      </p>
                      {item.kind === "waitlist" && (
                        <span
                          className="mt-3 inline-block self-start rounded-pill px-3 py-1 font-sans text-[10px] font-semibold uppercase tracking-[1.5px]"
                          style={{
                            background: "rgba(232,148,58,0.08)",
                            border: "1px solid rgba(232,148,58,0.25)",
                            color: "#e8943a",
                          }}
                        >
                          Notify Me When Ready
                        </span>
                      )}
                    </>
                  );
                  if (item.kind === "waitlist") {
                    return (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => setNotifyOpen(true)}
                        className="flex flex-col rounded-[18px] p-5 text-left transition-all duration-300"
                        style={{ ...cardStyle, cursor: "pointer" }}
                        onMouseEnter={onEnter}
                        onMouseLeave={onLeave}
                      >
                        {inner}
                      </button>
                    );
                  }
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      className="flex flex-col rounded-[18px] p-5 text-left transition-all duration-300"
                      style={cardStyle}
                      onMouseEnter={onEnter}
                      onMouseLeave={onLeave}
                    >
                      {inner}
                    </Link>
                  );
                })}
              </div>
            </div>
          </motion.div>
        ) : (
          /* ── CART ITEMS VIEW ── */
          <motion.div
            {...reveal}
            transition={{ ...reveal.transition, delay: 0.2 }}
            className="mt-10 flex flex-col gap-4"
          >
            {/* Items list */}
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-[18px]"
                style={{
                  background: "#1a1510",
                  border: "1px solid rgba(212,160,74,0.18)",
                  padding: 20,
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left: name + unit price */}
                  <div className="flex-1">
                    <p className="font-display text-base" style={{ color: "#f0e8da" }}>
                      {item.name}
                    </p>
                    <p className="mt-1 font-display" style={{ color: "#d4a04a" }}>
                      ${item.price.toFixed(2)}
                    </p>
                  </div>

                  {/* Right: quantity controls */}
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="flex items-center justify-center rounded-full"
                        style={{
                          width: 28,
                          height: 28,
                          background: "rgba(212,160,74,0.08)",
                          border: "1px solid rgba(212,160,74,0.2)",
                          color: "#d4a04a",
                          outline: "none",
                          cursor: "pointer",
                        }}
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span className="font-sans text-[14px]" style={{ color: "#d0c4b4", minWidth: 18, textAlign: "center" }}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="flex items-center justify-center rounded-full"
                        style={{
                          width: 28,
                          height: 28,
                          background: "rgba(212,160,74,0.08)",
                          border: "1px solid rgba(212,160,74,0.2)",
                          color: "#d4a04a",
                          outline: "none",
                          cursor: "pointer",
                        }}
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="font-sans text-[10px] uppercase tracking-[1.5px] transition-colors duration-200"
                      style={{ color: "#5a4e3e", background: "transparent", border: "none", cursor: "pointer" }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#c47070")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#5a4e3e")}
                    >
                      Remove
                    </button>
                  </div>
                </div>

                {/* Line subtotal */}
                <p className="mt-3 text-right font-sans text-[13px]" style={{ color: "#a07830" }}>
                  ${(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
            ))}

            {/* Order summary card */}
            <div
              className="mt-4 rounded-[18px]"
              style={{
                background: "rgba(26,21,14,0.9)",
                border: "1px solid rgba(212,160,74,0.15)",
                padding: 24,
              }}
            >
              <div className="flex items-center justify-between">
                <span className="font-sans text-[13px]" style={{ color: "#8a7e6e" }}>
                  Subtotal ({totalItems} item{totalItems !== 1 ? "s" : ""})
                </span>
                <span className="font-sans text-[13px]" style={{ color: "#8a7e6e" }}>
                  ${totalPrice.toFixed(2)}
                </span>
              </div>

              <div className="my-4" style={{ height: 1, background: "rgba(212,160,74,0.1)" }} />

              <div className="flex items-center justify-between">
                <span className="font-display text-base" style={{ color: "#f0e8da" }}>
                  Order Total
                </span>
                <span className="font-display text-xl" style={{ color: "#d4a04a" }}>
                  ${totalPrice.toFixed(2)}
                </span>
              </div>

              <button
                onClick={() => navigate("/heirloom-order")}
                className="mt-6 w-full rounded-pill font-sans text-[13px] font-semibold uppercase tracking-[1.5px] transition-all duration-300 hover:-translate-y-0.5"
                style={{
                  padding: 16,
                  background: "linear-gradient(135deg, #e8943a, #c47828)",
                  color: "#1a1208",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Proceed to Checkout
              </button>

              <p
                className="mt-4 text-center font-sans text-[10px] uppercase tracking-[3px]"
                style={{ color: "#5a4e3e" }}
              >
                Free to start · Secure checkout
              </p>
            </div>

            {/* Continue shopping */}
            <Link
              to="/shop"
              className="mt-4 text-center font-sans text-[11px] uppercase tracking-[1.5px] transition-colors duration-200"
              style={{ color: "#a07830" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#d4a04a")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#a07830")}
            >
              ← Continue Shopping
            </Link>
          </motion.div>
        )}
      </div>

      {/* Legacy Book Notify Modal */}
      {notifyOpen && (
        <div
          onClick={closeNotify}
          className="fixed inset-0 z-[100] flex items-center justify-center px-6"
          style={{ background: "rgba(8,5,3,0.85)", backdropFilter: "blur(6px)" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-[22px] p-8"
            style={{
              background: "#13100b",
              border: "1px solid rgba(212,160,74,0.2)",
            }}
          >
            <button
              onClick={closeNotify}
              aria-label="Close"
              className="absolute right-4 top-4 font-sans text-[18px]"
              style={{ background: "transparent", border: "none", color: "#a07830", cursor: "pointer" }}
            >
              ×
            </button>
            <p className="mb-2 font-sans text-[10px] uppercase tracking-[3px]" style={{ color: "#a07830" }}>
              Coming Soon
            </p>
            <h3 className="font-display text-2xl text-cream-warm">The Legacy Book</h3>
            <p className="mt-2 font-serif italic text-[14px] leading-relaxed" style={{ color: "#8a7e6e" }}>
              Be the first to know when your family's hardcover is ready.
            </p>

            {notifyStatus === "success" ? (
              <div className="mt-6 text-center">
                <p className="font-display text-lg" style={{ color: "#d4a04a" }}>
                  You're on the list.
                </p>
                <p className="mt-2 font-sans text-[12px]" style={{ color: "#8a7e6e" }}>
                  We'll email you the moment The Legacy Book is ready.
                </p>
                <button
                  onClick={closeNotify}
                  className="mt-6 rounded-pill px-8 py-3 font-sans text-[12px] font-semibold uppercase tracking-[1.5px]"
                  style={{
                    background: "linear-gradient(135deg, #e8943a, #c47828)",
                    color: "#1a1208",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={submitNotify} className="mt-6 flex flex-col gap-3">
                <input
                  type="email"
                  required
                  placeholder="Your email"
                  value={notifyEmail}
                  onChange={(e) => setNotifyEmail(e.target.value)}
                  className="rounded-[14px] px-4 py-3 font-sans text-[14px]"
                  style={{
                    background: "#161210",
                    border: "1px solid rgba(212,160,74,0.18)",
                    color: "#d0c4b4",
                    outline: "none",
                  }}
                />
                <input
                  type="text"
                  placeholder="Surname (optional)"
                  value={notifySurname}
                  onChange={(e) => setNotifySurname(e.target.value)}
                  className="rounded-[14px] px-4 py-3 font-sans text-[14px]"
                  style={{
                    background: "#161210",
                    border: "1px solid rgba(212,160,74,0.18)",
                    color: "#d0c4b4",
                    outline: "none",
                  }}
                />
                {notifyStatus === "error" && (
                  <p className="font-sans text-[12px]" style={{ color: "#c47070" }}>
                    {notifyError || "Something went wrong. Please try again."}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={notifyStatus === "loading"}
                  className="mt-2 rounded-pill py-3 font-sans text-[12px] font-semibold uppercase tracking-[1.5px]"
                  style={{
                    background: "linear-gradient(135deg, #e8943a, #c47828)",
                    color: "#1a1208",
                    border: "none",
                    cursor: notifyStatus === "loading" ? "wait" : "pointer",
                    opacity: notifyStatus === "loading" ? 0.7 : 1,
                  }}
                >
                  {notifyStatus === "loading" ? "Saving…" : "Notify Me When Ready"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
