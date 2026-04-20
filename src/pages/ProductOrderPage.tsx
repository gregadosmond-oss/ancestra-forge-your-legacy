import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import SectionLabel from "@/components/journey/SectionLabel";
import StripeEmbeddedCheckout from "@/components/StripeEmbeddedCheckout";
import AuthGate from "@/components/AuthGate";
import { usePurchase } from "@/hooks/usePurchase";

type ProductType = "canvas" | "coaster" | "blanket" | "charcuterie";
type Step = "details" | "payment";

const PRODUCT_CONFIG: Record<ProductType, { label: string; sizes: string[]; defaultSize: string }> = {
  canvas: {
    label: "Satin Canvas Print",
    sizes: ['8" × 10"', '11" × 14"', '18" × 24"', '24" × 36"'],
    defaultSize: '18" × 24"',
  },
  coaster: {
    label: "Corkwood Coaster Set",
    sizes: ['3.75" × 3.75"'],
    defaultSize: '3.75" × 3.75"',
  },
  blanket: {
    label: "Velveteen Plush Blanket",
    sizes: ['30" × 40"', '50" × 60"', '60" × 80"'],
    defaultSize: '50" × 60"',
  },
  charcuterie: {
    label: "Engraved Charcuterie Board",
    sizes: ['12.5" × 7.75"', '13.25" × 7"', '13.75" × 9.75"', '8.25" × 12.25"'],
    defaultSize: '13.75" × 9.75"',
  },
};

const VARIANT_IDS: Record<ProductType, Record<string, number>> = {
  canvas: { '8" × 10"': 77257, '11" × 14"': 77253, '18" × 24"': 77255, '24" × 36"': 77251 },
  coaster: { '3.75" × 3.75"': 72872 },
  blanket: { '30" × 40"': 68322, '50" × 60"': 68323, '60" × 80"': 68324 },
  charcuterie: {
    '12.5" × 7.75"': 123099,
    '13.25" × 7"': 123100,
    '13.75" × 9.75"': 123101,
    '8.25" × 12.25"': 123102,
  },
};

const COUNTRIES = ["US", "CA", "GB", "AU", "NZ", "IE", "DE", "FR", "NL", "SE", "NO", "DK"];
const COUNTRY_LABELS: Record<string, string> = {
  US: "United States", CA: "Canada", GB: "United Kingdom", AU: "Australia",
  NZ: "New Zealand", IE: "Ireland", DE: "Germany", FR: "France",
  NL: "Netherlands", SE: "Sweden", NO: "Norway", DK: "Denmark",
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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rawType = searchParams.get("type") ?? "canvas";
  const productType = (Object.keys(PRODUCT_CONFIG).includes(rawType) ? rawType : "canvas") as ProductType;
  const config = PRODUCT_CONFIG[productType];

  const { user } = usePurchase();
  const [step, setStep] = useState<Step>("details");
  const [address, setAddress] = useState<ShippingAddress>(empty);
  const [selectedSize, setSelectedSize] = useState<string>(config.defaultSize);
  const [showAuth, setShowAuth] = useState(false);

  const variantId = useMemo(
    () => VARIANT_IDS[productType][selectedSize] ?? VARIANT_IDS[productType][config.defaultSize],
    [productType, selectedSize, config.defaultSize],
  );

  const set = (k: keyof ShippingAddress) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setAddress((a) => ({ ...a, [k]: e.target.value }));

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { setShowAuth(true); return; }
    setStep("payment");
  };

  const inputCls = "w-full rounded-[12px] border border-amber-dim/25 bg-input px-4 py-3 font-sans text-sm text-cream-warm placeholder:text-text-dim focus:border-amber focus:outline-none";
  const labelCls = "block mb-1 font-sans text-[10px] uppercase tracking-[2px] text-amber-dim";

  return (
    <div className="relative flex min-h-screen flex-col items-center" style={{ background: "#0d0a07" }}>
      <img src="/hero.jpg" alt="" className="pointer-events-none fixed inset-0 h-full w-full object-cover"
        style={{ objectPosition: "center 30%", opacity: 0.38, filter: "saturate(0.7) brightness(0.95)" }} />

      <div className="relative z-10 w-full max-w-xl px-6 py-20">
        <SectionLabel>HEIRLOOM ORDER</SectionLabel>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mt-6 text-center font-display text-3xl"
          style={{ color: "#f0e8da" }}
        >
          {config.label}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mt-2 text-center font-serif italic"
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
            className="mt-10 space-y-5"
          >
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
              Ships in 5–7 business days · Worldwide delivery
            </p>
          </motion.form>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mt-10"
          >
            {/* Size selector */}
            {config.sizes.length > 1 && (
              <div className="mb-8">
                <p className={labelCls}>Choose Size</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {config.sizes.map((size) => {
                    const selected = size === selectedSize;
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setSelectedSize(size)}
                        className="rounded-pill px-5 py-2.5 font-sans text-[12px] font-semibold uppercase tracking-[1.5px] transition-all duration-300"
                        style={
                          selected
                            ? { background: "linear-gradient(135deg, #e8943a, #c47828)", color: "#1a1208", border: "none" }
                            : { background: "rgba(212,160,74,0.06)", border: "1px solid rgba(212,160,74,0.2)", color: "#d4a04a" }
                        }
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div
              style={{
                background: "#ffffff",
                borderRadius: 16,
                padding: "32px 24px",
                overflow: "hidden",
              }}
            >
              <StripeEmbeddedCheckout
                priceId="heirloom_product_once"
                customerEmail={user?.email ?? address.email}
                userId={user?.id}
                returnUrl={`${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`}
                shippingAddress={{ ...address, variant_id: String(variantId), size: selectedSize }}
                productType={productType}
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
