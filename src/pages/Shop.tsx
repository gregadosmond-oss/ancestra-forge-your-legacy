import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, Crown, Layers, GitBranch } from "lucide-react";
import WarmDivider from "@/components/journey/WarmDivider";
import StripeEmbeddedCheckout from "@/components/StripeEmbeddedCheckout";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useStripePrice } from "@/hooks/useStripePrice";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { COUNTRY_LABELS } from "@/lib/countries";

const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" } as const,
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

type FormState = {
  surname: string;
  firstName: string;
  lastName: string;
  email: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postCode: string;
  country: string;
};

const EMPTY: FormState = {
  surname: "",
  firstName: "",
  lastName: "",
  email: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postCode: "",
  country: "US",
};

const INSIDE_CELLS = [
  { Icon: Crown, label: "Your Coat of Arms", body: "Custom heraldic crest, gold foil cover stamp." },
  { Icon: BookOpen, label: "9 Chapters", body: "Origin story, ancestral migration, legacy threads." },
  { Icon: GitBranch, label: "Your Full Bloodline Tree", body: "Your real family tree, traced generation by generation, as far back as the records reach." },
  { Icon: Layers, label: "Heirloom Binding", body: "Matte-laminated hardcover, archival paper." },
];

const FAQ = [
  { q: "How long does shipping take?", a: "7–10 business days within US/Canada. International 10–14 days." },
  { q: "Can I see a sample before ordering?", a: "The book is custom-generated from your family's story. See sample spreads above." },
  { q: "Returns?", a: "Custom printed for you, so no returns. We do reprint any defect or shipping damage at no cost." },
];

const inputCls = "w-full font-sans text-[15px]";
const inputStyle: React.CSSProperties = {
  background: "#161210",
  border: "1px solid #3d3020",
  borderRadius: 14,
  padding: "14px 16px",
  color: "#d0c4b4",
  outline: "none",
  transition: "border-color 0.2s",
};

export default function Shop() {
  usePageMeta({
    title: "The Legacy Book — Heirloom Edition | AncestorsQR",
    description: "Your family's story, bound in heirloom hardcover. 9 chapters, custom coat of arms, 5-generation tree. Printed and shipped worldwide.",
  });

  const bookPrice = useStripePrice("legacy_book_once", "$99");
  const { user } = useAuth();

  const [form, setForm] = useState<FormState>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const required: Array<keyof FormState> = ["surname", "firstName", "lastName", "email", "addressLine1", "city", "state", "postCode", "country"];
    for (const k of required) {
      if (!form[k].trim()) {
        setError("Please fill in all required fields.");
        return;
      }
    }
    setSubmitting(true);
    setCheckoutOpen(true);
  };

  const shippingAddress = {
    name: `${form.firstName} ${form.lastName}`.trim(),
    address1: form.addressLine1,
    address2: form.addressLine2,
    city: form.city,
    state: form.state,
    country: form.country,
    zip: form.postCode,
    email: form.email,
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center bg-background">
      <img
        src="/hero.jpg"
        alt=""
        className="pointer-events-none fixed inset-0 h-full w-full object-cover"
        style={{ objectPosition: "center 30%", opacity: 0.32, filter: "saturate(0.7) brightness(0.9)" }}
      />

      {/* ── A. HERO ── */}
      <section className="relative z-10 w-full max-w-6xl px-6 pt-20 pb-16">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <motion.div {...reveal}>
            <p className="mb-5 font-sans text-[11px] font-semibold uppercase" style={{ color: "#a07830", letterSpacing: "4px" }}>
              THE HEIRLOOM EDITION
            </p>
            <h1 className="font-display leading-[1.05] text-cream-warm" style={{ fontSize: "clamp(40px, 6vw, 56px)" }}>
              The Legacy Book
            </h1>
            <p className="mt-5 font-serif italic" style={{ color: "#c4b8a6", fontSize: 20, lineHeight: 1.6 }}>
              Your family's story, bound in heirloom hardcover.
            </p>
            <p className="mt-5 font-sans uppercase" style={{ color: "#8a7e6e", fontSize: 13, letterSpacing: "2px" }}>
              9 CHAPTERS · 42 PAGES · 8×11 HARDCOVER
            </p>
            <a
              href="#order"
              className="mt-10 inline-block rounded-pill px-10 py-4 font-sans text-[13px] font-semibold uppercase tracking-[1.5px] transition-all duration-300 hover:-translate-y-0.5"
              style={{ background: "linear-gradient(135deg, #e8943a, #c47828)", color: "#1a1208" }}
            >
              Order Your Legacy Book — {bookPrice}
            </a>
          </motion.div>

          <motion.div {...reveal} transition={{ ...reveal.transition, delay: 0.15 }}>
            <div
              className="overflow-hidden rounded-[22px]"
              style={{ background: "#1a1510", border: "1px solid #3d3020", aspectRatio: "4 / 5" }}
            >
              <img src="/legacy-book-hero.png" alt="The Legacy Book hardcover" className="h-full w-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/og-default.jpg"; }} />
            </div>
          </motion.div>
        </div>
      </section>

      <WarmDivider />

      {/* ── B. WHAT'S INSIDE ── */}
      <section className="relative z-10 w-full max-w-6xl px-6 py-12">
        <motion.div
          {...reveal}
          className="rounded-[22px] p-8 sm:p-12"
          style={{ background: "#1a1510" }}
        >
          <p className="mb-3 text-center font-sans text-[11px] uppercase" style={{ color: "#a07830", letterSpacing: "4px" }}>
            What's Inside
          </p>
          <h2 className="text-center font-display text-3xl text-cream-warm sm:text-4xl">A book worth keeping forever.</h2>
          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {INSIDE_CELLS.map(({ Icon, label, body }) => (
              <div key={label} className="text-center">
                <Icon size={28} color="#d4a04a" strokeWidth={1.5} className="mx-auto" />
                <p className="mt-4 font-sans text-[14px] font-semibold uppercase" style={{ color: "#e8b85c", letterSpacing: "1.5px" }}>
                  {label}
                </p>
                <p className="mt-3 font-serif text-[15px] leading-relaxed" style={{ color: "#c4b8a6" }}>
                  {body}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── C. WHY A BOOK ── */}
      <section className="relative z-10 w-full" style={{ background: "#13100b" }}>
        <div className="mx-auto max-w-5xl px-6 py-20">
          <motion.div {...reveal} className="grid grid-cols-1 gap-10 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <p className="mb-6 font-sans text-[11px] uppercase" style={{ color: "#a07830", letterSpacing: "4px" }}>
                Why a book?
              </p>
              <p className="font-serif italic" style={{ color: "#e8b85c", fontSize: 22, lineHeight: 1.5 }}>
                "Every family deserves a book on the shelf that says: we were here."
              </p>
              <div className="mt-8 space-y-4 font-sans text-[15px]" style={{ color: "#d0c4b4", lineHeight: 1.75 }}>
                <p>A digital pack lives on a screen. A book lives on a shelf — held, opened, gifted, inherited. The Legacy Book exists so your family's story has a permanent home.</p>
                <p>One copy for you. One for the parent who wondered. One for the grandchild who will ask.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* LEGACY: original sample spreads with og-default.jpg placeholders — removed May 22 2026
      <section className="relative z-10 w-full max-w-6xl px-6 py-16">
        <motion.p {...reveal} className="mb-8 text-center font-sans text-[11px] uppercase" style={{ color: "#a07830", letterSpacing: "4px" }}>
          Sample Spreads
        </motion.p>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              {...reveal}
              transition={{ ...reveal.transition, delay: i * 0.08 }}
              className="overflow-hidden"
              style={{ borderRadius: 14, border: "1px solid #3d3020", background: "#1a1510", aspectRatio: "4 / 3" }}
            >
              <img src="/og-default.jpg" alt={`Sample spread ${i}`} className="h-full w-full object-cover" />
            </motion.div>
          ))}
        </div>
      </section>
      */}

      {/* ── D. SAMPLE PAGES ── */}
      <section className="relative z-10 w-full max-w-6xl px-6 py-16">
        <motion.div {...reveal} className="text-center">
          <p className="mb-3 font-sans text-[11px] font-semibold uppercase" style={{ color: "#a07830", letterSpacing: "4px" }}>
            SAMPLE PAGES
          </p>
          <h2 className="font-display text-cream-warm" style={{ fontSize: 36, lineHeight: 1.1 }}>
            From inside the book
          </h2>
          <p className="mx-auto mt-4 max-w-[600px] font-serif italic" style={{ color: "#c4b8a6", fontSize: 16, lineHeight: 1.5 }}>
            Every Legacy Book is custom-written from your family's story. Here's a feel for the writing.
          </p>
        </motion.div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {/* Card 1 */}
          <motion.div
            {...reveal}
            transition={{ ...reveal.transition, delay: 0.08 }}
            whileHover={{ rotate: -1 }}
            className="flex flex-col overflow-hidden sm:aspect-[3/4]"
            style={{
              background: "#f0e8da",
              border: "1px solid rgba(212, 160, 74, 0.2)",
              borderRadius: 14,
              padding: "36px 32px",
              boxShadow: "inset 0 8px 24px rgba(0,0,0,0.04)",
            }}
          >
            <p className="font-sans text-[10px] uppercase" style={{ color: "#8a7e6e", letterSpacing: "3px" }}>
              CHAPTER I · PAGE 7
            </p>
            <h3 className="mt-3 font-display" style={{ color: "#1a1208", fontSize: 22, lineHeight: 1.2 }}>
              The First to Bear the Name
            </h3>
            <div className="my-4 h-px" style={{ background: "rgba(212, 160, 74, 0.4)", width: 40 }} />
            <div className="flex-1" style={{ fontFamily: "'Libre Caslon Text', serif", color: "#3d3020", fontSize: 14, lineHeight: 1.7 }}>
              <p>
                <span style={{ float: "left", fontFamily: "'Libre Caslon Display', serif", fontSize: 40, color: "#8a4a1a", lineHeight: 0.9, margin: "4px 8px 0 0" }}>
                  L
                </span>
                ong before the family knew its own name, there was a man who carried it. He worked the land, kept his word, and chose the syllables that would be repeated for a thousand years.
              </p>
              <p className="mt-3">
                History records him only by trade and place. But every descendant since has carried what he set in motion — a name, a posture, a quiet refusal to disappear.
              </p>
              <p className="mt-3">
                This is where it begins.
              </p>
            </div>
          </motion.div>

          {/* Card 2 */}
          <motion.div
            {...reveal}
            transition={{ ...reveal.transition, delay: 0.16 }}
            whileHover={{ rotate: 0 }}
            className="flex flex-col overflow-hidden sm:aspect-[3/4]"
            style={{
              background: "#f0e8da",
              border: "1px solid rgba(212, 160, 74, 0.2)",
              borderRadius: 14,
              padding: "36px 32px",
              boxShadow: "inset 0 8px 24px rgba(0,0,0,0.04)",
            }}
          >
            <p className="font-sans text-[10px] uppercase" style={{ color: "#8a7e6e", letterSpacing: "3px" }}>
              CHAPTER IV · PAGE 23
            </p>
            <h3 className="mt-3 font-display" style={{ color: "#1a1208", fontSize: 22, lineHeight: 1.2 }}>
              The Crossing
            </h3>
            <div className="my-4 h-px" style={{ background: "rgba(212, 160, 74, 0.4)", width: 40 }} />
            <div className="flex-1" style={{ fontFamily: "'Libre Caslon Text', serif", color: "#3d3020", fontSize: 14, lineHeight: 1.7 }}>
              <p>
                <span style={{ float: "left", fontFamily: "'Libre Caslon Display', serif", fontSize: 40, color: "#8a4a1a", lineHeight: 1.0, margin: "4px 8px 0 0" }}>
                  T
                </span>
                hey sold what they could not carry. The crossing took eleven weeks. The youngest child did not speak for a month after they made land.
              </p>
              <p className="mt-3">
                What they brought with them fit in a single trunk: a Bible, two wool blankets, a handful of seeds wrapped in linen, and the name. The name was the only thing the ocean could not weather.
              </p>
              <p className="mt-3">
                Everything that came after was built on what survived the passage.
              </p>
            </div>
          </motion.div>

          {/* Card 3 */}
          <motion.div
            {...reveal}
            transition={{ ...reveal.transition, delay: 0.24 }}
            whileHover={{ rotate: 1 }}
            className="flex flex-col overflow-hidden sm:aspect-[3/4]"
            style={{
              background: "#f0e8da",
              border: "1px solid rgba(212, 160, 74, 0.2)",
              borderRadius: 14,
              padding: "36px 32px",
              boxShadow: "inset 0 8px 24px rgba(0,0,0,0.04)",
            }}
          >
            <p className="font-sans text-[10px] uppercase" style={{ color: "#8a7e6e", letterSpacing: "3px" }}>
              CHAPTER IX · PAGE 67
            </p>
            <h3 className="mt-3 font-display" style={{ color: "#1a1208", fontSize: 22, lineHeight: 1.2 }}>
              What You Inherit
            </h3>
            <div className="my-4 h-px" style={{ background: "rgba(212, 160, 74, 0.4)", width: 40 }} />
            <div className="flex-1" style={{ fontFamily: "'Libre Caslon Text', serif", color: "#3d3020", fontSize: 14, lineHeight: 1.7 }}>
              <p>
                <span style={{ float: "left", fontFamily: "'Libre Caslon Display', serif", fontSize: 40, color: "#8a4a1a", lineHeight: 0.9, margin: "4px 8px 0 0" }}>
                  Y
                </span>
                ou are the result of every choice they made. Every harvest, every hardship, every refusal to give in. Their patience runs in your blood. Their stubbornness shows up when you least expect it.
              </p>
              <p className="mt-3">
                Most families forget. That is the ordinary fate of a name. But you are reading this — which means yours does not have to.
              </p>
              <p className="mt-3">
                The Legacy continues with you.
              </p>
            </div>
          </motion.div>
        </div>

        <p className="mx-auto mt-10 max-w-[500px] text-center font-sans italic" style={{ color: "#8a7e6e", fontSize: 13 }}>
          Placeholder text shown above — your book is generated from your actual surname, lineage, and historical records.
        </p>
      </section>

      <WarmDivider />

      {/* ── E. ORDER FORM ── */}
      <section id="order" className="relative z-10 w-full max-w-3xl px-6 py-16">
        <motion.div
          {...reveal}
          className="rounded-[22px] p-6 sm:p-12"
          style={{ background: "#1a1510" }}
        >
          <h2 className="font-display text-3xl text-cream-warm" style={{ fontSize: 32 }}>
            Order Your Legacy Book
          </h2>
          <p className="mt-2 font-serif italic" style={{ color: "#c4b8a6", fontSize: 16 }}>
            Printed and shipped by Gelato. 7–10 business days.
          </p>
          <p className="mt-3 font-serif italic" style={{ color: "#c4b8a6", fontSize: 14 }}>
            Includes a printable Legacy Certificate — bound as page 42 of your book and available digitally on your dashboard.
          </p>

          {!checkoutOpen ? (
            <form onSubmit={handleSubmit} className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-2 block font-sans text-[10px] uppercase tracking-[2px]" style={{ color: "#a07830" }}>Surname *</label>
                <input value={form.surname} onChange={set("surname")} className={inputCls} style={inputStyle} placeholder="Osmond" required />
              </div>
              <div>
                <label className="mb-2 block font-sans text-[10px] uppercase tracking-[2px]" style={{ color: "#a07830" }}>First Name *</label>
                <input value={form.firstName} onChange={set("firstName")} className={inputCls} style={inputStyle} required />
              </div>
              <div>
                <label className="mb-2 block font-sans text-[10px] uppercase tracking-[2px]" style={{ color: "#a07830" }}>Last Name *</label>
                <input value={form.lastName} onChange={set("lastName")} className={inputCls} style={inputStyle} required />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-2 block font-sans text-[10px] uppercase tracking-[2px]" style={{ color: "#a07830" }}>Email *</label>
                <input type="email" value={form.email} onChange={set("email")} className={inputCls} style={inputStyle} required />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-2 block font-sans text-[10px] uppercase tracking-[2px]" style={{ color: "#a07830" }}>Address Line 1 *</label>
                <input value={form.addressLine1} onChange={set("addressLine1")} className={inputCls} style={inputStyle} required />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-2 block font-sans text-[10px] uppercase tracking-[2px]" style={{ color: "#a07830" }}>Address Line 2</label>
                <input value={form.addressLine2} onChange={set("addressLine2")} className={inputCls} style={inputStyle} />
              </div>
              <div>
                <label className="mb-2 block font-sans text-[10px] uppercase tracking-[2px]" style={{ color: "#a07830" }}>City *</label>
                <input value={form.city} onChange={set("city")} className={inputCls} style={inputStyle} required />
              </div>
              <div>
                <label className="mb-2 block font-sans text-[10px] uppercase tracking-[2px]" style={{ color: "#a07830" }}>State / Province *</label>
                <input value={form.state} onChange={set("state")} className={inputCls} style={inputStyle} required />
              </div>
              <div>
                <label className="mb-2 block font-sans text-[10px] uppercase tracking-[2px]" style={{ color: "#a07830" }}>Postal Code *</label>
                <input value={form.postCode} onChange={set("postCode")} className={inputCls} style={inputStyle} required />
              </div>
              <div>
                <label className="mb-2 block font-sans text-[10px] uppercase tracking-[2px]" style={{ color: "#a07830" }}>Country *</label>
                <select value={form.country} onChange={set("country")} className={inputCls} style={inputStyle} required>
                  {Object.entries(COUNTRY_LABELS)
                    .sort(([, a], [, b]) => a.localeCompare(b))
                    .map(([code, name]) => (
                      <option key={code} value={code}>{name}</option>
                    ))}
                </select>
              </div>

              {error && (
                <div className="sm:col-span-2 flex items-center gap-2 font-sans text-[14px]" style={{ color: "#e8b85c" }}>
                  <span style={{ color: "#d4a04a" }}>⚠</span> {error}
                </div>
              )}

              <div className="sm:col-span-2 mt-4 flex flex-col items-center gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-pill py-4 font-sans text-[13px] font-semibold uppercase tracking-[1.5px] transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 sm:w-[320px]"
                  style={{ background: "linear-gradient(135deg, #e8943a, #c47828)", color: "#1a1208", border: "none", cursor: "pointer" }}
                >
                  {submitting ? "Preparing…" : `Pay ${bookPrice} — Forge My Book`}
                </button>
                <p className="text-center font-sans text-[11px]" style={{ color: "#8a7e6e" }}>
                  One-time purchase · Secure Stripe checkout · No subscription
                </p>
                <p className="text-center font-sans text-[11px] italic" style={{ color: "#8a7e6e" }}>
                  Sending it as a gift? Enter the recipient's shipping address and we'll send the heirloom straight to them, ready to open.
                </p>
              </div>
            </form>
          ) : (
            <div className="mt-8">
              <div style={{ background: "#ffffff", borderRadius: 16, padding: "24px 16px", overflow: "hidden" }}>
                <StripeEmbeddedCheckout
                  priceId="legacy_book_once"
                  customerEmail={user?.email ?? form.email}
                  userId={user?.id}
                  returnUrl={`${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`}
                  surname={form.surname}
                  shippingAddress={shippingAddress}
                  productType="legacy-book"
                />
              </div>
              <button
                onClick={() => { setCheckoutOpen(false); setSubmitting(false); }}
                className="mt-6 block w-full text-center font-sans text-[13px] transition-colors hover:text-amber-light"
                style={{ color: "#8a7e6e", background: "transparent", border: "none", cursor: "pointer" }}
              >
                ← Edit shipping details
              </button>
            </div>
          )}
        </motion.div>
      </section>

      {/* ── F. FAQ ── */}
      <section className="relative z-10 w-full" style={{ background: "#13100b" }}>
        <div className="mx-auto max-w-[700px] px-6 py-16">
          <motion.p {...reveal} className="mb-8 text-center font-sans text-[11px] uppercase" style={{ color: "#a07830", letterSpacing: "4px" }}>
            Frequently Asked
          </motion.p>
          <div className="space-y-4">
            {FAQ.map((item) => (
              <details
                key={item.q}
                className="group rounded-[14px] p-5"
                style={{ background: "#1a1510", border: "1px solid #3d3020" }}
              >
                <summary className="cursor-pointer font-display text-[18px] text-cream-warm">{item.q}</summary>
                <p className="mt-3 font-sans text-[14px] leading-relaxed" style={{ color: "#c4b8a6" }}>{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── G. FOOTER CTA ── */}
      <section className="relative z-10 w-full" style={{ background: "#221c14" }}>
        <div className="mx-auto max-w-3xl px-6 py-16 text-center">
          <h3 className="font-display text-cream-warm" style={{ fontSize: 28 }}>Not ready for the book yet?</h3>
          <p className="mt-3 font-serif italic" style={{ color: "#c4b8a6", fontSize: 16 }}>
            Start with the digital Legacy Pack — $29.99 instant access.
          </p>
          <Link
            to="/pricing"
            className="mt-8 inline-block rounded-pill px-8 py-3 font-sans text-[12px] font-semibold uppercase tracking-[1.5px] transition-all duration-300 hover:-translate-y-0.5"
            style={{ background: "rgba(232,148,58,0.06)", border: "1px solid rgba(232,148,58,0.4)", color: "#d4a04a" }}
          >
            Explore the Legacy Pack
          </Link>
        </div>
      </section>
    </div>
  );
}

// LEGACY: removed during digital-first revamp May 22 2026
// The previous Shop page rendered a grid of physical products (mug, canvas,
// blankets, coaster, charcuterie, etc.) sourced from SHOP_PRODUCTS, plus a
// Legacy Book waitlist modal. That code lived here and used:
//   - useCart, useMugPrice, useLegacyPackPrice
//   - SHOP_PRODUCTS / CATEGORY_LABELS from @/data/shopProducts
//   - book-waitlist-signup edge function
// All of that has been retired in favor of this single-product Legacy Book
// sales page. The shopProducts.ts data file is still imported by other pages
// (e.g. Cart, Stop6) so it is intentionally left in place.
