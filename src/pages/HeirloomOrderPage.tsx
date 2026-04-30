import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import SectionLabel from "@/components/journey/SectionLabel";
import StripeEmbeddedCheckout from "@/components/StripeEmbeddedCheckout";
import AuthGate from "@/components/AuthGate";
import MugMockup from "@/components/MugMockup";
import { usePurchase } from "@/hooks/usePurchase";
import { getStripeEnvironment } from "@/lib/stripe";
import { usePageMeta } from "@/hooks/usePageMeta";

type Step = "details" | "payment";

// ISO 3166-1 alpha-2 → country name. Sorted alphabetically by country name.
const COUNTRY_LABELS: Record<string, string> = {
  AL: "Albania", DZ: "Algeria", AD: "Andorra", AO: "Angola", AG: "Antigua and Barbuda",
  AR: "Argentina", AM: "Armenia", AU: "Australia", AT: "Austria", AZ: "Azerbaijan",
  BS: "Bahamas", BH: "Bahrain", BD: "Bangladesh", BB: "Barbados", BE: "Belgium",
  BZ: "Belize", BJ: "Benin", BM: "Bermuda", BT: "Bhutan", BO: "Bolivia",
  BA: "Bosnia and Herzegovina", BW: "Botswana", BR: "Brazil", BN: "Brunei", BG: "Bulgaria",
  BF: "Burkina Faso", KH: "Cambodia", CM: "Cameroon", CA: "Canada", CV: "Cape Verde",
  KY: "Cayman Islands", CL: "Chile", CN: "China", CO: "Colombia", CR: "Costa Rica",
  HR: "Croatia", CY: "Cyprus", CZ: "Czech Republic", DK: "Denmark", DM: "Dominica",
  DO: "Dominican Republic", EC: "Ecuador", EG: "Egypt", SV: "El Salvador", EE: "Estonia",
  ET: "Ethiopia", FJ: "Fiji", FI: "Finland", FR: "France", GA: "Gabon",
  GM: "Gambia", GE: "Georgia", DE: "Germany", GH: "Ghana", GI: "Gibraltar",
  GR: "Greece", GL: "Greenland", GD: "Grenada", GT: "Guatemala", GY: "Guyana",
  HT: "Haiti", HN: "Honduras", HK: "Hong Kong", HU: "Hungary", IS: "Iceland",
  IN: "India", ID: "Indonesia", IE: "Ireland", IL: "Israel", IT: "Italy",
  JM: "Jamaica", JP: "Japan", JO: "Jordan", KZ: "Kazakhstan", KE: "Kenya",
  KW: "Kuwait", KG: "Kyrgyzstan", LA: "Laos", LV: "Latvia", LB: "Lebanon",
  LS: "Lesotho", LI: "Liechtenstein", LT: "Lithuania", LU: "Luxembourg", MO: "Macau",
  MK: "Macedonia", MG: "Madagascar", MW: "Malawi", MY: "Malaysia", MV: "Maldives",
  MT: "Malta", MR: "Mauritania", MU: "Mauritius", MX: "Mexico", MD: "Moldova",
  MC: "Monaco", MN: "Mongolia", ME: "Montenegro", MA: "Morocco", MZ: "Mozambique",
  NA: "Namibia", NP: "Nepal", NL: "Netherlands", NZ: "New Zealand", NI: "Nicaragua",
  NE: "Niger", NG: "Nigeria", NO: "Norway", OM: "Oman", PK: "Pakistan",
  PA: "Panama", PG: "Papua New Guinea", PY: "Paraguay", PE: "Peru", PH: "Philippines",
  PL: "Poland", PT: "Portugal", PR: "Puerto Rico", QA: "Qatar", RO: "Romania",
  RW: "Rwanda", KN: "Saint Kitts and Nevis", LC: "Saint Lucia", VC: "Saint Vincent and the Grenadines",
  WS: "Samoa", SM: "San Marino", SA: "Saudi Arabia", SN: "Senegal", RS: "Serbia",
  SC: "Seychelles", SL: "Sierra Leone", SG: "Singapore", SK: "Slovakia", SI: "Slovenia",
  ZA: "South Africa", KR: "South Korea", ES: "Spain", LK: "Sri Lanka", SR: "Suriname",
  SZ: "Swaziland", SE: "Sweden", CH: "Switzerland", TW: "Taiwan", TJ: "Tajikistan",
  TZ: "Tanzania", TH: "Thailand", TG: "Togo", TO: "Tonga", TT: "Trinidad and Tobago",
  TN: "Tunisia", TR: "Turkey", TM: "Turkmenistan", UG: "Uganda", UA: "Ukraine",
  AE: "United Arab Emirates", GB: "United Kingdom", US: "United States", UY: "Uruguay",
  UZ: "Uzbekistan", VU: "Vanuatu", VE: "Venezuela", VN: "Vietnam", ZM: "Zambia",
  ZW: "Zimbabwe",
};
const COUNTRIES = Object.keys(COUNTRY_LABELS).sort((a, b) =>
  COUNTRY_LABELS[a].localeCompare(COUNTRY_LABELS[b])
);

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
              Custom ceramic mug with your family crest, name & QR code — ships worldwide. Includes the full digital Legacy Pack.
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
              <label htmlFor="heirloom-surname" className={labelCls}>Family Surname</label>
              <input
                id="heirloom-surname"
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
                <label htmlFor="heirloom-first-name" className={labelCls}>First Name</label>
                <input id="heirloom-first-name" value={address.first_name} onChange={set("first_name")} placeholder="John" required className={inputCls} />
              </div>
              <div>
                <label htmlFor="heirloom-last-name" className={labelCls}>Last Name</label>
                <input id="heirloom-last-name" value={address.last_name} onChange={set("last_name")} placeholder="Murphy" required className={inputCls} />
              </div>
            </div>

            <div>
              <label htmlFor="heirloom-email" className={labelCls}>Email</label>
              <input id="heirloom-email" type="email" value={address.email} onChange={set("email")} placeholder="you@email.com" required className={inputCls} />
            </div>

            <div>
              <label htmlFor="heirloom-address1" className={labelCls}>Street Address</label>
              <input id="heirloom-address1" value={address.address1} onChange={set("address1")} placeholder="123 Heritage Lane" required className={inputCls} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="heirloom-city" className={labelCls}>City</label>
                <input id="heirloom-city" value={address.city} onChange={set("city")} placeholder="Dublin" required className={inputCls} />
              </div>
              <div>
                <label htmlFor="heirloom-region" className={labelCls}>State / Province</label>
                <input id="heirloom-region" value={address.region} onChange={set("region")} placeholder="CA" required className={inputCls} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="heirloom-zip" className={labelCls}>Postal Code</label>
                <input id="heirloom-zip" value={address.zip} onChange={set("zip")} placeholder="D01 AB23" required className={inputCls} />
              </div>
              <div>
                <label htmlFor="heirloom-country" className={labelCls}>Country</label>
                <select id="heirloom-country" value={address.country} onChange={set("country")} className={inputCls}>
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>{COUNTRY_LABELS[c]}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="heirloom-phone" className={labelCls}>Phone (for shipping)</label>
              <input id="heirloom-phone" type="tel" value={address.phone} onChange={set("phone")} placeholder="+1 555 000 0000" className={inputCls} />
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
              priceId="heirloom_bundle_v1"
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
