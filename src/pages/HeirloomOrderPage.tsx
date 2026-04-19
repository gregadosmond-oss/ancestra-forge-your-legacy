import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import SectionLabel from "@/components/journey/SectionLabel";
import StripeEmbeddedCheckout from "@/components/StripeEmbeddedCheckout";
import AuthGate from "@/components/AuthGate";
import { usePurchase } from "@/hooks/usePurchase";
import { getStripeEnvironment } from "@/lib/stripe";

type Step = "details" | "payment";

const COUNTRIES = ["US", "CA", "GB", "AU", "NZ", "IE", "DE", "FR", "NL", "SE", "NO", "DK"];
const COUNTRY_LABELS: Record<string, string> = {
  US: "United States", CA: "Canada", GB: "United Kingdom", AU: "Australia",
  NZ: "New Zealand", IE: "Ireland", DE: "Germany", FR: "France",
  NL: "Netherlands", SE: "Sweden", NO: "Norway", DK: "Denmark",
};

interface ShippingAddress {
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

export default function HeirloomOrderPage() {
  const navigate = useNavigate();
  const surname = typeof window !== "undefined" ? sessionStorage.getItem("ancestra_journey_surname") : null;
  const { user } = usePurchase();

  const [step, setStep] = useState<Step>("details");
  const [inputSurname, setInputSurname] = useState(surname ?? "");
  const [address, setAddress] = useState<ShippingAddress>(empty);
  const [showAuth, setShowAuth] = useState(false);

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
    <div className="relative flex min-h-screen flex-col items-center">
      <img src="/hero.jpg" alt="" className="pointer-events-none fixed inset-0 h-full w-full object-cover"
        style={{ objectPosition: "center 30%", opacity: 0.38, filter: "saturate(0.7) brightness(0.95)" }} />

      <div className="relative z-10 w-full max-w-xl px-6 py-20">
        <SectionLabel>HEIRLOOM ORDER</SectionLabel>

        {/* Product card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mt-8 flex items-center gap-5 rounded-[18px] border p-5"
          style={{ background: "#1a1510", borderColor: "rgba(201,168,76,0.3)" }}
        >
          <div className="text-4xl">☕</div>
          <div className="flex-1">
            <p className="font-display text-lg text-cream-warm">Family Crest Mug</p>
            <p className="mt-1 font-serif text-xs italic text-text-dim">
              Custom ceramic mug with your family crest, name & QR code — ships worldwide
            </p>
          </div>
          <div className="font-display text-xl" style={{ color: "#e8b85c" }}>$49.99</div>
        </motion.div>

        {step === "details" ? (
          <motion.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            onSubmit={handleContinue}
            className="mt-8 space-y-5"
          >
            {/* Surname */}
            <div>
              <label className={labelCls}>Family Surname</label>
              <input
                value={inputSurname}
                onChange={(e) => setInputSurname(e.target.value)}
                placeholder="e.g. Murphy"
                required
                className={inputCls}
              />
              <p className="mt-1 font-sans text-[10px] text-text-dim">This name will be printed on the mug</p>
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

            <p className="text-center font-sans text-[10px] text-text-dim">
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
            <StripeEmbeddedCheckout
              priceId="heirloom_mug_once"
              customerEmail={user?.email ?? address.email}
              userId={user?.id}
              returnUrl={`${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`}
              surname={inputSurname}
              shippingAddress={address}
              productType="heirloom"
            />
            <button
              onClick={() => setStep("details")}
              className="mt-6 block w-full text-center font-sans text-sm text-text-dim transition-colors hover:text-amber-light"
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
