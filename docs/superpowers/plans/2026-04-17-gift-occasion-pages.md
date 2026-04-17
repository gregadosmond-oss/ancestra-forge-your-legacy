# Gift Occasion Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build 12 gift occasion landing pages (`/gifts/:occasion`) with curated product listings, emotional copy, and a "Begin Your Journey" CTA funnel.

**Architecture:** Config-driven dynamic route — one `GiftOccasionPage.tsx` template reads from `src/data/giftOccasions.ts`. Each occasion is a typed config object with headline, subhead, products (always including Legacy Book), optional bundle highlight, and CTA copy. App.tsx gets one new route `/gifts/:occasion`. OccasionsSection.tsx tags become clickable links.

**Tech Stack:** React, React Router, Framer Motion, Tailwind, Fireside Luxury design system

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `src/data/giftOccasions.ts` | All 12 occasion configs — slugs, copy, products, bundles |
| Create | `src/pages/gifts/GiftOccasionPage.tsx` | Shared page template — hero, products, bundle, CTA |
| Modify | `src/App.tsx` | Add `/gifts/:occasion` route |
| Modify | `src/components/landing/OccasionsSection.tsx` | Make tags link to `/gifts/[slug]` |

---

## Task 1: Occasion config data

**Files:**
- Create: `src/data/giftOccasions.ts`

- [ ] **Step 1: Create the config file**

```ts
// src/data/giftOccasions.ts

export type OccasionProduct = {
  name: string;
  price: string;
  description: string;
  tag?: string;
};

export type OccasionBundle = {
  name: string;
  price: string;
  includes: string[];
};

export type OccasionConfig = {
  slug: string;
  name: string;
  heroLabel: string;
  heroHeadline: string;
  heroSubhead: string;
  ctaLine: string;
  products: OccasionProduct[];
  bundle?: OccasionBundle;
};

export const GIFT_OCCASIONS: OccasionConfig[] = [
  {
    slug: "fathers-day",
    name: "Father's Day",
    heroLabel: "Father's Day Gifts",
    heroHeadline: "Make this Father's Day unforgettable.",
    heroSubhead:
      "Give him something that traces his bloodline back centuries — a story, a crest, and a legacy built to last.",
    ctaLine: "This Father's Day, give him the story behind his name.",
    products: [
      {
        name: "Legacy Book",
        price: "from $59",
        description:
          "His family's full story in a beautifully printed book — softcover or hardcover.",
        tag: "Most Meaningful",
      },
      {
        name: "Framed Crest Print",
        price: "from $79",
        description:
          "His coat of arms, printed and framed. Ready to hang the day it arrives.",
      },
      {
        name: "Whiskey Glass",
        price: "$39",
        description:
          "His family crest engraved on a whiskey glass. A daily reminder of where he comes from.",
      },
      {
        name: "Metal Wall Sign",
        price: "$149",
        description:
          "Heavy-gauge metal, his crest, his name. The centrepiece of any man cave or study.",
      },
      {
        name: "Legacy Pack",
        price: "$29",
        description:
          "Digital crest, full family story, bloodline tree, and legacy certificate — delivered instantly.",
      },
    ],
    bundle: {
      name: "Dad Bundle",
      price: "$129",
      includes: ["Framed crest print", "Whiskey glass", "Legacy certificate"],
    },
  },
  {
    slug: "mothers-day",
    name: "Mother's Day",
    heroLabel: "Mother's Day Gifts",
    heroHeadline: "The gift she'll treasure forever.",
    heroSubhead:
      "She carried the family forward. Give her the story of where it all began.",
    ctaLine: "Honour the woman who kept the story alive.",
    products: [
      {
        name: "Legacy Book",
        price: "from $59",
        description:
          "Her family's history in a beautifully printed book she'll read and re-read for years.",
        tag: "Most Meaningful",
      },
      {
        name: "Framed Crest Print",
        price: "from $79",
        description:
          "Her family crest, framed and ready to hang — a piece of history for her home.",
      },
      {
        name: "Coaster Set",
        price: "$24",
        description:
          "Four coasters, each bearing the family crest. Elegant, personal, and used every day.",
      },
      {
        name: "Legacy Pack",
        price: "$29",
        description:
          "Digital crest, full family story, bloodline tree, and legacy certificate — delivered to her inbox instantly.",
      },
    ],
    bundle: {
      name: "Mom Bundle",
      price: "$139",
      includes: ["Legacy book", "Family tree print", "Legacy certificate"],
    },
  },
  {
    slug: "christmas",
    name: "Christmas",
    heroLabel: "Christmas Gifts",
    heroHeadline: "The most meaningful gift under the tree.",
    heroSubhead:
      "This Christmas, give your family something that lasts beyond the season — their story, their crest, their legacy.",
    ctaLine: "Give a gift that means something this Christmas.",
    products: [
      {
        name: "Legacy Book",
        price: "from $59",
        description:
          "The family story in print — a gift that gets passed down with the decorations.",
        tag: "Family Favourite",
      },
      {
        name: "Christmas Ornament",
        price: "$29",
        description:
          "The family crest as a keepsake ornament. Goes on the tree every year, forever.",
      },
      {
        name: "Coaster Set",
        price: "$24",
        description: "Four family crest coasters — perfect for holiday gatherings.",
      },
      {
        name: "Legacy Pack",
        price: "$29",
        description:
          "Digital crest, full story, bloodline tree — delivered instantly as a gift.",
      },
    ],
    bundle: {
      name: "Christmas Bundle",
      price: "$129",
      includes: ["3× ornaments", "Legacy book", "Coaster set"],
    },
  },
  {
    slug: "wedding",
    name: "Wedding",
    heroLabel: "Wedding Gifts",
    heroHeadline: "Unite two families. Tell both stories.",
    heroSubhead:
      "A combined wedding crest, their histories woven together — the most unique wedding gift in existence.",
    ctaLine: "The wedding gift they've never seen before.",
    products: [
      {
        name: "Legacy Book",
        price: "from $59",
        description:
          "The story of one family — or commission two books for both families joining together.",
        tag: "Most Personal",
      },
      {
        name: "Combined Wedding Crest",
        price: "$79",
        description:
          "Both family crests merged into one — a digital heirloom for their new life together.",
        tag: "Unique to Ancestra",
      },
      {
        name: "Framed Crest Print",
        price: "from $79",
        description: "Their combined crest, printed and framed for their first home together.",
      },
      {
        name: "Wax Seal Stamp",
        price: "$49",
        description:
          "A wax seal stamp of their family crest — for thank you notes, envelopes, and keepsakes.",
      },
    ],
    bundle: {
      name: "Wedding Bundle",
      price: "$249",
      includes: [
        "Combined wedding crest (digital)",
        "Framed print",
        "Toasting glasses",
        "Wax seal stamp",
      ],
    },
  },
  {
    slug: "graduation",
    name: "Graduation",
    heroLabel: "Graduation Gifts",
    heroHeadline: "They know where they're going. Show them where they came from.",
    heroSubhead:
      "A legacy certificate, a family crest, a story — the perfect graduation gift for someone starting their next chapter.",
    ctaLine: "Send them into the world knowing where they came from.",
    products: [
      {
        name: "Legacy Book",
        price: "from $59",
        description:
          "Their family's history in print — a reminder of the shoulders they stand on.",
        tag: "Most Meaningful",
      },
      {
        name: "Legacy Certificate",
        price: "$49",
        description:
          "A formal, frameable certificate documenting their family lineage and coat of arms.",
      },
      {
        name: "Framed Crest Print",
        price: "from $79",
        description: "Their family crest framed for their first apartment or office.",
      },
      {
        name: "Legacy Pack",
        price: "$29",
        description:
          "Digital crest, full family story, bloodline tree — delivered to their inbox instantly.",
      },
    ],
    bundle: {
      name: "Grad Bundle",
      price: "$119",
      includes: ["Legacy certificate", "Framed crest", "Coffee mug"],
    },
  },
  {
    slug: "birthday",
    name: "Birthday",
    heroLabel: "Birthday Gifts",
    heroHeadline: "The birthday gift no one else thought of.",
    heroSubhead:
      "While others bring flowers and gift cards, you're giving them their family's entire history.",
    ctaLine: "Give them a birthday gift they'll talk about for years.",
    products: [
      {
        name: "Legacy Book",
        price: "from $59",
        description:
          "Their complete family story in print — the most personal birthday gift imaginable.",
        tag: "Most Unique",
      },
      {
        name: "Legacy Pack",
        price: "$29",
        description:
          "Digital crest, full family story, bloodline tree, and certificate — delivered instantly.",
      },
      {
        name: "Framed Crest Print",
        price: "from $79",
        description: "Their family crest, framed and ready to hang.",
      },
      {
        name: "Beer Mug",
        price: "$39",
        description:
          "Their family crest on a quality beer mug. A gift they'll use every celebration.",
      },
    ],
  },
  {
    slug: "anniversary",
    name: "Anniversary",
    heroLabel: "Anniversary Gifts",
    heroHeadline: "Celebrate where your story began.",
    heroSubhead:
      "Two families, one life together. A legacy that grows richer with every passing year.",
    ctaLine: "Mark this anniversary with something that endures.",
    products: [
      {
        name: "Legacy Book",
        price: "from $59",
        description:
          "The story of their family — a beautifully printed keepsake for a milestone anniversary.",
        tag: "Most Romantic",
      },
      {
        name: "Framed Crest Print (16×20)",
        price: "$99",
        description:
          "A large, statement framed crest for the home they've built together.",
      },
      {
        name: "Coaster Set",
        price: "$24",
        description: "Four family crest coasters — for every morning coffee and evening wine.",
      },
      {
        name: "Legacy Pack",
        price: "$29",
        description:
          "Digital crest, full family story, bloodline tree — delivered instantly.",
      },
    ],
    bundle: {
      name: "Wedding Bundle",
      price: "$249",
      includes: [
        "Combined crest (digital)",
        "Framed print",
        "Toasting glasses",
        "Wax seal stamp",
      ],
    },
  },
  {
    slug: "new-baby",
    name: "New Baby",
    heroLabel: "New Baby Gifts",
    heroHeadline: "Welcome them into a story centuries in the making.",
    heroSubhead:
      "The newest member of the family deserves to know where they come from. Start their legacy now.",
    ctaLine: "Give the new arrival their family's greatest inheritance — their story.",
    products: [
      {
        name: "Legacy Book",
        price: "from $59",
        description:
          "Their family history in print — a keepsake they'll read to the baby, and the baby will read to their children.",
        tag: "Heirloom Gift",
      },
      {
        name: "Legacy Pack",
        price: "$29",
        description:
          "Digital crest, full family story, bloodline tree — a digital legacy for a new life.",
      },
      {
        name: "Framed Crest Print",
        price: "from $79",
        description: "Their family crest framed for the nursery wall.",
      },
      {
        name: "Christmas Ornament",
        price: "$29",
        description:
          "A family crest ornament for baby's first Christmas — a tradition that starts now.",
      },
    ],
  },
  {
    slug: "housewarming",
    name: "Housewarming",
    heroLabel: "Housewarming Gifts",
    heroHeadline: "Make their new house feel like home — for generations.",
    heroSubhead:
      "A family crest on the wall turns a house into a home. A legacy story makes it sacred.",
    ctaLine: "Help them put down roots that go back centuries.",
    products: [
      {
        name: "Legacy Book",
        price: "from $59",
        description:
          "Their family's full history in print — the story of every home they've ever come from.",
        tag: "Most Thoughtful",
      },
      {
        name: "Metal Wall Sign",
        price: "$149",
        description:
          "Heavy-gauge metal bearing their family crest — the statement piece every home deserves.",
      },
      {
        name: "Canvas Print",
        price: "$89",
        description:
          "Gallery-wrapped canvas of their family crest — artwork that means something.",
      },
      {
        name: "Coaster Set",
        price: "$24",
        description: "Four family crest coasters — a gift for the new coffee table.",
      },
    ],
  },
  {
    slug: "retirement",
    name: "Retirement",
    heroLabel: "Retirement Gifts",
    heroHeadline: "A lifetime of work. A legacy that endures.",
    heroSubhead:
      "They spent decades building something. Now it's time to honour the family they came from — and the story they've carried forward.",
    ctaLine: "Honour everything they've built with a legacy that lasts.",
    products: [
      {
        name: "Legacy Book",
        price: "from $59",
        description:
          "Their family's complete history in a hardcover book — the perfect retirement keepsake.",
        tag: "Most Fitting",
      },
      {
        name: "Framed Crest Print (16×20)",
        price: "$99",
        description:
          "A large, framed family crest — a statement piece for the home they'll now spend time in.",
      },
      {
        name: "Metal Wall Sign",
        price: "$149",
        description: "Heavy-gauge metal crest for the study, workshop, or wall of honour.",
      },
      {
        name: "Legacy Pack",
        price: "$29",
        description:
          "Digital crest, full family story, bloodline tree, and certificate — a complete digital legacy.",
      },
    ],
  },
  {
    slug: "valentines",
    name: "Valentine's Day",
    heroLabel: "Valentine's Day Gifts",
    heroHeadline: "The most romantic gift isn't jewellery.",
    heroSubhead:
      "Give them their family's story — a love letter to where they come from and who they are.",
    ctaLine: "Give them something more meaningful than flowers this Valentine's Day.",
    products: [
      {
        name: "Legacy Book",
        price: "from $59",
        description:
          "Their family story in print — the most personal, romantic gift you can give.",
        tag: "Most Personal",
      },
      {
        name: "Legacy Pack",
        price: "$29",
        description:
          "Digital crest, full family story, bloodline tree — delivered to their inbox like a love letter.",
      },
      {
        name: "Framed Crest Print",
        price: "from $79",
        description: "Their family crest, framed — art that tells their story.",
      },
      {
        name: "Crest Cufflinks",
        price: "$39",
        description:
          "Their family crest as custom cufflinks — elegance with meaning, worn close every day.",
      },
    ],
  },
  {
    slug: "reunion",
    name: "Family Reunion",
    heroLabel: "Family Reunion Gifts",
    heroHeadline: "Bring everyone together around the story that unites you.",
    heroSubhead:
      "The perfect centrepiece for a family reunion — a shared legacy, a coat of arms, and a book that tells your whole story.",
    ctaLine: "Make this reunion the one they talk about for the next generation.",
    products: [
      {
        name: "Legacy Book",
        price: "from $59",
        description:
          "The family's complete history in print — read it aloud, pass it around, keep it forever.",
        tag: "Perfect Centrepiece",
      },
      {
        name: "Coaster Set",
        price: "$24",
        description: "Four family crest coasters — one for every household at the reunion.",
      },
      {
        name: "Christmas Ornament",
        price: "$29",
        description:
          "A family crest ornament for every branch of the family tree to take home.",
      },
      {
        name: "Legacy Pack",
        price: "$29",
        description:
          "Digital crest, full family story, bloodline tree — share the link with every family member.",
      },
    ],
    bundle: {
      name: "Reunion Bundle",
      price: "$249",
      includes: ["10× ornaments", "Family tree poster", "Legacy book"],
    },
  },
];

export const getOccasionBySlug = (slug: string): OccasionConfig | undefined =>
  GIFT_OCCASIONS.find((o) => o.slug === slug);
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/data/giftOccasions.ts
git commit -m "feat: gift occasion config data for all 12 occasions"
```

---

## Task 2: GiftOccasionPage template

**Files:**
- Create: `src/pages/gifts/GiftOccasionPage.tsx`

- [ ] **Step 1: Create the page template**

```tsx
// src/pages/gifts/GiftOccasionPage.tsx
import { useParams, Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { getOccasionBySlug } from "@/data/giftOccasions";
import WarmDivider from "@/components/journey/WarmDivider";

const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" } as const,
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

const stagger = (i: number) => ({
  ...reveal,
  transition: { ...reveal.transition, delay: i * 0.08 },
});

export default function GiftOccasionPage() {
  const { occasion } = useParams<{ occasion: string }>();
  const config = getOccasionBySlug(occasion ?? "");

  if (!config) return <Navigate to="/" replace />;

  return (
    <div className="relative flex min-h-screen flex-col items-center overflow-hidden bg-background">
      {/* Grain overlay */}
      <svg className="pointer-events-none fixed inset-0 z-50 h-full w-full opacity-[0.018]">
        <filter id="grain-gift">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain-gift)" />
      </svg>

      {/* ── HERO ── */}
      <section className="relative w-full flex flex-col items-center justify-center px-6 py-24 text-center" style={{ minHeight: "60vh" }}>
        {/* Ambient glow */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 50% 40%, rgba(232,148,58,0.07) 0%, transparent 70%)",
          }}
        />

        <motion.p
          {...reveal}
          className="mb-4 font-sans text-[10px] uppercase tracking-[4px]"
          style={{ color: "#a07830" }}
        >
          {config.heroLabel}
        </motion.p>

        <motion.h1
          {...stagger(1)}
          className="font-display leading-tight text-cream-warm"
          style={{ fontSize: "clamp(32px, 6vw, 58px)", maxWidth: 700 }}
        >
          {config.heroHeadline}
        </motion.h1>

        <motion.p
          {...stagger(2)}
          className="mt-5 font-serif italic"
          style={{
            fontSize: "clamp(16px, 2vw, 19px)",
            color: "#c4b8a6",
            maxWidth: 540,
            lineHeight: 1.7,
          }}
        >
          {config.heroSubhead}
        </motion.p>

        <motion.div {...stagger(3)} className="mt-10">
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
              (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 12px 40px rgba(232,148,58,0.25)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.transform = "";
              (e.currentTarget as HTMLAnchorElement).style.boxShadow = "";
            }}
          >
            Begin Your Journey
          </Link>
        </motion.div>
      </section>

      <WarmDivider />

      {/* ── WHY IT WORKS ── */}
      <motion.section
        {...reveal}
        className="w-full max-w-3xl px-6 py-10 text-center"
      >
        <p className="mb-6 font-sans text-[10px] uppercase tracking-[4px]" style={{ color: "#a07830" }}>
          Why Ancestra
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          {[
            { icon: "✦", label: "Completely unique" },
            { icon: "♡", label: "Deeply emotional" },
            { icon: "◈", label: "Lasts forever" },
          ].map(({ icon, label }) => (
            <span
              key={label}
              className="flex items-center gap-2 rounded-pill font-sans text-[12px] uppercase tracking-[1.5px]"
              style={{
                padding: "10px 22px",
                border: "1px solid rgba(212,160,74,0.2)",
                background: "rgba(212,160,74,0.05)",
                color: "#d4a04a",
              }}
            >
              <span style={{ fontSize: 14 }}>{icon}</span>
              {label}
            </span>
          ))}
        </div>
      </motion.section>

      <WarmDivider />

      {/* ── PRODUCT CARDS ── */}
      <section className="w-full max-w-4xl px-6 py-10">
        <motion.p
          {...reveal}
          className="mb-2 text-center font-sans text-[10px] uppercase tracking-[4px]"
          style={{ color: "#a07830" }}
        >
          Curated for {config.name}
        </motion.p>
        <motion.h2
          {...stagger(1)}
          className="mb-10 text-center font-display text-3xl text-cream-warm"
        >
          Choose your gift
        </motion.h2>

        <div className="grid gap-5 sm:grid-cols-2">
          {config.products.map((product, i) => (
            <motion.div
              key={product.name}
              {...stagger(i)}
              className="relative flex flex-col rounded-[22px] p-6"
              style={{
                background: "rgba(26,21,14,0.9)",
                border: "1px solid rgba(212,160,74,0.08)",
                transition: "border-color 0.3s ease, background 0.3s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(212,160,74,0.2)";
                (e.currentTarget as HTMLDivElement).style.background = "rgba(34,28,20,0.95)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(212,160,74,0.08)";
                (e.currentTarget as HTMLDivElement).style.background = "rgba(26,21,14,0.9)";
              }}
            >
              {product.tag && (
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
              <h3
                className="font-display text-xl"
                style={{ color: "#f0e8da" }}
              >
                {product.name}
              </h3>
              <p
                className="mt-1 font-sans text-[13px] font-semibold"
                style={{ color: "#d4a04a" }}
              >
                {product.price}
              </p>
              <p
                className="mt-3 font-sans text-[14px] leading-relaxed"
                style={{ color: "#a09280", flexGrow: 1 }}
              >
                {product.description}
              </p>
              <Link
                to="/journey"
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
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── BUNDLE SPOTLIGHT ── */}
      {config.bundle && (
        <>
          <WarmDivider />
          <motion.section
            {...reveal}
            className="w-full max-w-2xl px-6 py-10 text-center"
          >
            <p className="mb-4 font-sans text-[10px] uppercase tracking-[4px]" style={{ color: "#a07830" }}>
              Best Value
            </p>
            <div
              className="rounded-[28px] p-8"
              style={{
                background: "rgba(26,21,14,0.95)",
                border: "1px solid rgba(232,148,58,0.25)",
                boxShadow: "0 0 60px rgba(232,148,58,0.05)",
              }}
            >
              <h2
                className="font-display text-3xl"
                style={{ color: "#f0e8da" }}
              >
                {config.bundle.name}
              </h2>
              <p
                className="mt-2 font-display text-2xl"
                style={{ color: "#e8943a" }}
              >
                {config.bundle.price}
              </p>
              <ul className="mt-5 space-y-2">
                {config.bundle.includes.map((item) => (
                  <li
                    key={item}
                    className="flex items-center justify-center gap-2 font-sans text-[14px]"
                    style={{ color: "#c4b8a6" }}
                  >
                    <span style={{ color: "#d4a04a" }}>✦</span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                to="/journey"
                className="mt-8 inline-block rounded-pill px-10 py-4 font-sans text-[13px] font-semibold uppercase tracking-[1.5px]"
                style={{
                  background: "linear-gradient(135deg, #e8943a, #c47828)",
                  color: "#1a1208",
                  transition: "all 0.4s cubic-bezier(0.22,1,0.36,1)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-2px)";
                  (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 12px 40px rgba(232,148,58,0.25)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.transform = "";
                  (e.currentTarget as HTMLAnchorElement).style.boxShadow = "";
                }}
              >
                Begin Your Journey
              </Link>
            </div>
          </motion.section>
        </>
      )}

      <WarmDivider />

      {/* ── BOTTOM CTA ── */}
      <motion.section
        {...reveal}
        className="w-full px-6 py-20 text-center"
        style={{ background: "rgba(20,14,8,0.6)" }}
      >
        <p className="mb-3 font-sans text-[10px] uppercase tracking-[4px]" style={{ color: "#a07830" }}>
          Forged by Ancestra
        </p>
        <h2
          className="mx-auto font-display leading-tight text-cream-warm"
          style={{ fontSize: "clamp(24px, 4vw, 42px)", maxWidth: 580 }}
        >
          {config.ctaLine}
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
            (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 12px 40px rgba(232,148,58,0.25)";
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
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/pages/gifts/GiftOccasionPage.tsx
git commit -m "feat: GiftOccasionPage template — hero, products, bundle, CTA"
```

---

## Task 3: Wire up routes in App.tsx

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Add import and route**

In `src/App.tsx`, add the import after the existing imports:

```tsx
import GiftOccasionPage from "./pages/gifts/GiftOccasionPage.tsx";
```

Add the route inside `<Route element={<AppLayout />}>`, before the catch-all:

```tsx
<Route path="/gifts/:occasion" element={<GiftOccasionPage />} />
```

- [ ] **Step 2: Verify build**

```bash
npm run build 2>&1 | tail -6
```
Expected: `✓ built in`

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat: add /gifts/:occasion route"
```

---

## Task 4: Link occasion tags in OccasionsSection

**Files:**
- Modify: `src/components/landing/OccasionsSection.tsx`

- [ ] **Step 1: Replace static tags with clickable links**

Replace the entire `OccasionsSection.tsx` with:

```tsx
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const OCCASIONS: { label: string; slug: string; highlighted: boolean }[] = [
  { label: "Father's Day", slug: "fathers-day", highlighted: true },
  { label: "Christmas", slug: "christmas", highlighted: true },
  { label: "Wedding", slug: "wedding", highlighted: true },
  { label: "Graduation", slug: "graduation", highlighted: true },
  { label: "Birthday", slug: "birthday", highlighted: false },
  { label: "Anniversary", slug: "anniversary", highlighted: false },
  { label: "New Baby", slug: "new-baby", highlighted: false },
  { label: "Mother's Day", slug: "mothers-day", highlighted: false },
  { label: "Housewarming", slug: "housewarming", highlighted: false },
  { label: "Retirement", slug: "retirement", highlighted: false },
  { label: "Family Reunion", slug: "reunion", highlighted: false },
  { label: "Valentine's Day", slug: "valentines", highlighted: false },
];

const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" } as const,
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

const OccasionsSection = () => (
  <motion.section {...reveal} className="py-16 text-center">
    <p className="mb-3 text-[10px] uppercase tracking-[4px] text-amber-dim">
      The Perfect Gift
    </p>
    <h2 className="font-display text-3xl text-cream-warm sm:text-4xl">
      The gift they'll never forget.
    </h2>
    <p className="mx-auto mt-4 max-w-md font-serif italic text-foreground">
      For the people who already have everything — give them something that can
      never be bought twice.
    </p>

    <div className="mt-12 flex flex-wrap justify-center gap-3">
      {OCCASIONS.map((occasion) => (
        <Link
          key={occasion.slug}
          to={`/gifts/${occasion.slug}`}
          className="rounded-pill font-sans text-[13px] transition-all duration-300"
          style={
            occasion.highlighted
              ? {
                  padding: "8px 20px",
                  border: "1px solid rgba(232,148,58,0.4)",
                  background: "rgba(232,148,58,0.06)",
                  color: "#e8b85c",
                  textDecoration: "none",
                }
              : {
                  padding: "8px 20px",
                  border: "1px solid rgba(61,48,32,1)",
                  background: "rgba(26,21,14,0.9)",
                  color: "#d0c4b4",
                  textDecoration: "none",
                }
          }
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.borderColor =
              "rgba(232,148,58,0.35)";
            (e.currentTarget as HTMLAnchorElement).style.color = "#e8b85c";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.borderColor = occasion.highlighted
              ? "rgba(232,148,58,0.4)"
              : "rgba(61,48,32,1)";
            (e.currentTarget as HTMLAnchorElement).style.color = occasion.highlighted
              ? "#e8b85c"
              : "#d0c4b4";
          }}
        >
          {occasion.label}
        </Link>
      ))}
    </div>
  </motion.section>
);

export default OccasionsSection;
```

- [ ] **Step 2: Verify build**

```bash
npm run build 2>&1 | tail -6
```
Expected: `✓ built in`

- [ ] **Step 3: Commit**

```bash
git add src/components/landing/OccasionsSection.tsx
git commit -m "feat: occasion tags on landing page now link to /gifts/:slug"
```

---

## Task 5: Final verification

- [ ] **Step 1: Full clean build**

```bash
npm run build 2>&1 | tail -8
```
Expected: `✓ built in` with no TypeScript errors

- [ ] **Step 2: Push**

```bash
git push origin main
```
