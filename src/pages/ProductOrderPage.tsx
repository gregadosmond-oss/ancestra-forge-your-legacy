import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import SectionLabel from "@/components/journey/SectionLabel";
import StripeEmbeddedCheckout from "@/components/StripeEmbeddedCheckout";
import AuthGate from "@/components/AuthGate";
import { usePurchase } from "@/hooks/usePurchase";
import { usePageMeta } from "@/hooks/usePageMeta";
import { COUNTRIES, COUNTRY_LABELS } from "@/lib/countries";

type Step = "details" | "payment";

interface ProductConfig {
  name: string;
  price: string;
  priceId: string;
  emoji: string;
  desc: string;
}

const PRODUCT_CONFIG: Record<string, ProductConfig> = {
  "heirloom":      { name: 'Family Crest Mug',           price: '$49.99', priceId: 'heirloom_mug_once',       emoji: '☕', desc: 'Custom ceramic mug with your family crest, name & QR code — ships worldwide. Includes the full digital Legacy Pack.' },
  "canvas-8x10":   { name: 'Canvas Print 8"×10"',         price: '$34.99', priceId: 'heirloom_canvas_8x10',    emoji: '🖼️', desc: 'Gallery-wrapped canvas of your family crest. Artwork that actually means something. Includes Legacy Pack.' },
  "canvas-12x16":  { name: 'Canvas Print 12"×16"',        price: '$42.99', priceId: 'heirloom_canvas_12x16',   emoji: '🖼️', desc: 'Gallery-wrapped canvas of your family crest. Includes Legacy Pack.' },
  "canvas-18x24":  { name: 'Canvas Print 18"×24"',        price: '$59.99', priceId: 'heirloom_canvas_18x24',   emoji: '🖼️', desc: 'A bold statement piece for the living room or study. Includes Legacy Pack.' },
  "canvas-24x36":  { name: 'Canvas Print 24"×36"',        price: '$89.99', priceId: 'heirloom_canvas_24x36',   emoji: '🖼️', desc: 'Large-format gallery canvas — the centrepiece of any room. Includes Legacy Pack.' },
  "blanket-30x40": { name: 'Throw Blanket 30"×40"',       price: '$39.99', priceId: 'heirloom_blanket_30x40',  emoji: '🛋️', desc: 'Your family crest on a cozy throw blanket. Warmth with a story. Includes Legacy Pack.' },
  "blanket-50x60": { name: 'Throw Blanket 50"×60"',       price: '$49.99', priceId: 'heirloom_blanket_50x60',  emoji: '🛋️', desc: 'Full-size throw with your family crest — the most popular size. Includes Legacy Pack.' },
  "blanket-60x80": { name: 'Throw Blanket 60"×80"',       price: '$59.99', priceId: 'heirloom_blanket_60x80',  emoji: '🛋️', desc: 'Our largest throw — built to be passed down for generations. Includes Legacy Pack.' },
  "coaster":       { name: 'Cork-Back Coaster',            price: '$34.99', priceId: 'heirloom_coaster',        emoji: '🪵', desc: 'Your family crest on a high-quality cork-back coaster. Elegant, personal, used every day. Includes Legacy Pack.' },
};


interface ShippingAddress {
  [key: string]: string;
  first_name: string;
  last_name: string;
  address1: string;
  city: string;
  region: string;
  zip: string;
  country: string;
  email: string;
  phone: string;
}

const empty: ShippingAddress = {
  first_name: "", last_name: "", address1: "", city: "",
  region: "", zip: "", country: "US", email: "", phone: "",
};

export default function ProductOrderPage() {
  usePageMeta({ title: "Order Your Heirloom | AncestorsQR" });
  const [searchParams] = useSearchParams();
  const type = searchParams.get("type") ?? "heirloom";
  const config = PRODUCT_CONFIG[type];

  const { user } = usePurchase();
  const [step, setStep] = useState<Step>("details");
  const [surname, setSurname] = useState("");
  const [address, setAddress] = useState<ShippingAddress>(empty);
  const [showAuth, setShowAuth] = useState(false);

  // Transform address for create-printful-order
  const shippingAddress = useMemo(() => ({
    name: `${address.first_name} ${address.last_name}`.trim(),
    address1: address.address1,
    city: address.city,
    state: address.region,
    country: address.country,
    zip: address.zip,
    phone: address.phone,
  }), [address]);

  const set = (k: keyof ShippingAddress) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setAddress((a) => ({ ...a, [k]: e.target.value }));

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { setShowAuth(true); return; }
    setStep("payment");
  };

  const inputCls = "w-full rounded-[12px] border border-amber-dim/25 bg-input px-4 py-3 font-sans text-sm text-cream-warm placeholder:text-text-dim focus:border-amber focus:outline-none";
  const labelCls = "block mb-1 font-sans text-[10px] uppercase tracking-[2px] text-amber-dim";

  // Product not found
  if (!config) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center px-6" style={{ background: "#0d0a07" }}>
        <div className="text-center">
          <h1 className="font-display text-3xl" style={{ color: "#f0e8da" }}>Product not found</h1>
          <p className="mt-3 font-serif italic" style={{ color: "#c4b8a6" }}>
            We couldn't find that heirloom in our shop.
          </p>
          <Link
            to="/shop"
            className="mt-8 inline-block rounded-pill px-10 py-4 font-sans text-[13px] font-semibold uppercase tracking-[1.5px] transition-all duration-300 hover:-translate-y-0.5"
            style={{ background: "linear-gradient(135deg, #e8943a, #c47828)", color: "#1a1208" }}
          >
            Back to Shop
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center" style={{ background: "#0d0a07" }}>
      <img src="/hero.jpg" alt="" className="pointer-events-none fixed inset-0 h-full w-full object-cover"
        style={{ objectPosition: "center 30%", opacity: 0.38, filter: "saturate(0.7) brightness(0.95)" }} />

      <div className="relative z-10 w-full max-w-xl px-6 py-20">
        <SectionLabel>HEIRLOOM ORDER</SectionLabel>

        {/* Product card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mt-6 rounded-[22px] border p-7 text-center"
          style={{
            background: "rgba(26,21,16,0.85)",
            borderColor: "rgba(212,160,74,0.2)",
            backdropFilter: "blur(8px)",
          }}
        >
          <div className="text-5xl">{config.emoji}</div>
          <h1 className="mt-4 font-display text-3xl" style={{ color: "#f0e8da" }}>
            {config.name}
          </h1>
          <p className="mt-2 font-display text-2xl" style={{ color: "#e8b85c" }}>
            {config.price}
          </p>
          <p className="mt-4 font-serif italic text-sm leading-relaxed" style={{ color: "#c4b8a6" }}>
            {config.desc}
          </p>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mt-8 text-center font-serif italic"
          style={{ color: "#c4b8a6" }}
        >
          Where should we send it?
        </motion.p>

        {step === "details" ? (
          <motion.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            onSubmit={handleContinue}
            className="mt-8 space-y-5"
          >
            <div>
              <label className={labelCls}>Family Surname</label>
              <input
                value={surname}
                onChange={(e) => setSurname(e.target.value)}
                placeholder="Murphy"
                required
                className={inputCls}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>First Name</label>
                <input value={address.first_name} onChange={set("first_name")} placeholder="John" required className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Last Name</label>
                <input value={address.last_name} onChange={set("last_name")} placeholder="Murphy" required className={inputCls} />
              </div>
            </div>

            <div>
              <label className={labelCls}>Email</label>
              <input type="email" value={address.email} onChange={set("email")} placeholder="you@email.com" required className={inputCls} />
            </div>

            <div>
              <label className={labelCls}>Street Address</label>
              <input value={address.address1} onChange={set("address1")} placeholder="123 Heritage Lane" required className={inputCls} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>City</label>
                <input value={address.city} onChange={set("city")} placeholder="Dublin" required className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>State / Province</label>
                <input value={address.region} onChange={set("region")} placeholder="CA" required className={inputCls} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Postal Code</label>
                <input value={address.zip} onChange={set("zip")} placeholder="D01 AB23" required className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Country</label>
                <select value={address.country} onChange={set("country")} className={inputCls}>
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>{COUNTRY_LABELS[c]}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className={labelCls}>Phone (for shipping)</label>
              <input type="tel" value={address.phone} onChange={set("phone")} placeholder="+1 555 000 0000" className={inputCls} />
            </div>

            <button
              type="submit"
              className="mt-4 w-full rounded-pill py-4 font-sans text-[13px] font-semibold uppercase tracking-[1.5px] transition-all duration-300 hover:-translate-y-0.5"
              style={{ background: "linear-gradient(135deg, #e8943a, #c47828)", color: "#1a1208" }}
            >
              Continue to Payment
            </button>

            <p className="text-center font-sans text-[10px]" style={{ color: "#8a7e6e" }}>
              Includes Legacy Pack · Ships in 5–7 business days · Worldwide delivery
            </p>
          </motion.form>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mt-8"
          >
            <div
              style={{
                background: "#ffffff",
                borderRadius: 16,
                padding: "32px 24px",
                overflow: "hidden",
              }}
            >
              <StripeEmbeddedCheckout
                priceId={config.priceId}
                customerEmail={user?.email ?? address.email}
                userId={user?.id}
                returnUrl={`${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`}
                surname={surname}
                shippingAddress={shippingAddress}
                productType={type}
              />
            </div>

            <button
              onClick={() => setStep("details")}
              className="mt-6 block w-full text-center font-sans text-sm transition-colors hover:text-amber-light"
              style={{ color: "#8a7e6e" }}
            >
              ← Edit shipping details
            </button>
          </motion.div>
        )}
      </div>

      {showAuth && (
        <AuthGate
          onAuthenticated={() => { setShowAuth(false); setStep("payment"); }}
          onClose={() => setShowAuth(false)}
        />
      )}
    </div>
  );
}
