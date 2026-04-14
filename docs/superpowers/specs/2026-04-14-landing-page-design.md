# Ancestra Landing Page — Full Marketing Page Design

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build out the full marketing landing page below the existing hero — five new sections that explain the product, show what you get, tease free tools, frame the gift angle, and close with a final CTA.

**Approach:** Hybrid — emotional narrative headlines with warm brand copy at the top of each section, clean cards and grids below for clarity. All frontend, no backend, no Stripe.

**Tech Stack:** React 18 + TypeScript + Vite + Tailwind, Ancestra Fireside Luxury design system, Framer Motion (already installed) for scroll-reveal animations, existing journey component `WarmDivider` reused for dividers between sections.

---

## Existing State (Do Not Modify)

`src/pages/Index.tsx` currently renders:
- SVG grain texture overlay (fixed, z-50)
- Ambient amber radial glow div
- `<CrestHero />` — 3D interactive crest with mouse tilt + parallax shadow
- Hero headline: "Every family has a story worth telling."
- Italic subline: "Discover your name. Forge your crest. Pass it on."
- "Begin Your Journey" pill CTA button → `/journey`

All new content goes **below** the existing CTA button. The hero block is untouched.

---

## File Structure

**New section components** (each has one clear responsibility):

- `src/components/landing/HowItWorksSection.tsx` — 3-step journey explainer
- `src/components/landing/ProductPreviewSection.tsx` — 4 product cards + $29 price badge
- `src/components/landing/FreeToolsSection.tsx` — 3 tool cards with Coming Soon badges
- `src/components/landing/OccasionsSection.tsx` — occasions tag cloud
- `src/components/landing/FinalCtaSection.tsx` — bottom close with CTA button

**Modified:**
- `src/pages/Index.tsx` — import and render the 5 new sections below the existing hero content

---

## Section Specifications

### 1. HowItWorksSection

**Layout:** Section header + 3 horizontal step cards

**Section header:**
- Label (`.s-label`): `THE JOURNEY`
- Title (`.s-title`): `Five minutes to discover 900 years.`
- Subtitle (`.s-sub` italic): `Enter your surname. We do the rest.`

**3 step cards** — equal-width, horizontal row (stack to single column on mobile):

| Step | Heading | Body |
|------|---------|------|
| 1 | Enter Your Name | Type your surname. Our AI searches centuries of history — origins, migration, and ancestral role. |
| 2 | Your Legacy Unfolds | Your custom crest is forged, your bloodline mapped, your family story written by AI. |
| 3 | Pass It On | Download, gift, or display your legacy. Physical products shipped worldwide. |

Each card: amber number badge (1/2/3), heading in `--cream`, body in `--text-dim`. Card background `--bg-card`, border `--gold-line`, border-radius `--radius`.

**Scroll reveal:** Wrap the 3-card row in a Framer Motion `motion.div` with `initial={{ opacity: 0, y: 24 }}`, `whileInView={{ opacity: 1, y: 0 }}`, `viewport={{ once: true }}`, `transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}`. Each card gets an additional `transition-delay` of `0ms`, `80ms`, `160ms` via the `transition.delay` prop to stagger them.

---

### 2. ProductPreviewSection

**Layout:** Section header + 2×2 product card grid + price badge row

**Section header:**
- Label: `WHAT YOU GET`
- Title: `Your complete family legacy, delivered instantly.`
- Subtitle: `Everything in the Legacy Pack — one price, yours forever.`

**4 product cards** (2-column grid, stack to 1 column on mobile):

| Icon | Heading | Body |
|------|---------|------|
| 🛡 | Custom Coat of Arms | A unique crest forged from your surname's history, symbolism, and ancestral role. High-res PNG + SVG. |
| 📖 | AI Family Story | Chapter I of your family narrative — written by Claude AI using real historical context from your bloodline. |
| 🌳 | Bloodline Tree | Your ancestral migration mapped visually — where your family came from, and how they got here. |
| 📜 | Legacy Certificate | A frameable certificate bearing your crest, motto, and lineage. Print it. Hang it. Own it. |

Each card: emoji icon (24px), heading `--cream-soft`, body `--text-body`. Card background `--bg-card`, border `--gold-line`, radius `--radius`.

**Price badge** — full-width row below the grid:
- Price: `$29` in `--amber-light`, Libre Caslon Display, 36px
- Sub-copy: `One-time · Instant digital delivery · No subscription` in `--text-dim`
- Background: `rgba(232,148,58,0.06)`, border `rgba(232,148,58,0.18)`, radius `--radius`

---

### 3. FreeToolsSection

**Layout:** Section header + 3-column tool card grid (stack to 1 column on mobile)

**Section header:**
- Label: `FREE TOOLS`
- Title: `Curious? Start here — no commitment.`
- Subtitle: `Six free tools to explore your heritage. No account needed.`

**3 tool cards** — all have a "Coming Soon" amber badge (top-right corner). Cards are slightly muted (opacity 0.8) to signal unavailability but still readable:

| Icon | Heading | Body |
|------|---------|------|
| 🧬 | Bloodline Quiz | 5 questions → your ancestry archetype. Warrior, Builder, Explorer, Healer, or Scholar. |
| 🔍 | Surname Lookup | Instant meaning, origin, and historical role for any surname. |
| ⚔️ | Motto Generator | Enter 3 values → get a Latin motto with English translation. |

**Coming Soon badge:** absolute top-right, background `--bg-card-hover`, color `--amber-dim`, 9px uppercase, letter-spacing 1px, radius 4px, padding `3px 8px`.

Cards have no `href` / no click handler. Cursor default (not pointer).

---

### 4. OccasionsSection

**Layout:** Section header + tag cloud of occasion pills

**Section header:**
- Label: `THE PERFECT GIFT`
- Title: `The gift they'll never forget.`
- Subtitle: `For the people who already have everything — give them something that can never be bought twice.`

**Occasion tags** — flex-wrap row of pill buttons (non-interactive, display only):

Highlighted (amber border + amber text — 4 tags):
`Father's Day` · `Christmas` · `Wedding` · `Graduation`

Standard (subtle border + `--text` color — 8 tags):
`Birthday` · `Anniversary` · `New Baby` · `Mother's Day` · `Housewarming` · `Retirement` · `Family Reunion` · `Valentine's Day`

Highlighted pills: border `rgba(232,148,58,0.4)`, color `--amber-light`, background `rgba(232,148,58,0.06)`.
Standard pills: border `--gold-line`, color `--text`, background `--bg-card`.
All pills: padding `8px 20px`, radius `--radius-pill`, font-size 13px.

---

### 5. FinalCtaSection

**Layout:** Centered text block + single CTA button

- Label: `YOUR LEGACY AWAITS`
- Title: `Every family has a story worth telling.` (mirrors hero headline — intentional callback)
- Subtitle: `Yours has been waiting centuries. It takes five minutes to discover it.`
- CTA button: `Begin Your Journey` → `/journey` (identical style to hero button — `btn-warm` gradient pill)

Section has a subtle amber top border: `border-top: 1px solid rgba(232,148,58,0.15)`.

---

## Dividers Between Sections

Reuse `WarmDivider` from `src/components/journey/WarmDivider.tsx` between each section. This is the amber gradient line + dot component already in the codebase.

---

## Index.tsx Integration

The existing `Index.tsx` hero block (grain, glow, CrestHero, headline, subline, CTA) stays exactly as-is. The 5 new sections are appended below it inside the same root `<div>`, wrapped in a `<div className="w-full max-w-4xl">` container to match the existing hero width:

```tsx
{/* ── new landing sections ── */}
<div className="relative z-10 w-full max-w-4xl px-6 pb-24 space-y-0">
  <WarmDivider />
  <HowItWorksSection />
  <WarmDivider />
  <ProductPreviewSection />
  <WarmDivider />
  <FreeToolsSection />
  <WarmDivider />
  <OccasionsSection />
  <WarmDivider />
  <FinalCtaSection />
</div>
```

---

## Scroll Reveal Animation

Use Framer Motion (already installed) throughout — no custom hooks needed.

Each section component's root element is a `motion.div` with:
```tsx
<motion.div
  initial={{ opacity: 0, y: 24 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, margin: "-80px" }}
  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
>
```

Child card grids (step cards, product cards, tool cards) stagger by wrapping each card in its own `motion.div` with the same `initial`/`whileInView`/`viewport` props and a `transition.delay` of `0`, `0.08`, `0.16`, `0.24` seconds respectively.

---

## Design Constraints

- All colors from Ancestra CSS variables — no hardcoded hex values except where variable isn't defined
- All buttons pill-shaped (`border-radius: 60px`)
- No cold blues, grays, or whites — warm palette only
- Body text minimum `--text` (`#d0c4b4`) on dark backgrounds
- Mobile-first: all grids collapse to single column below `sm` breakpoint (640px)
- No new dependencies — use existing React, Tailwind, Framer Motion (already installed)

---

## Out of Scope

- Founder story section (deferred)
- Social proof / reviews section (deferred — no real reviews yet)
- Email capture in final CTA (deferred — no backend)
- Stripe / purchase flow
- Free tools actual functionality (tools show "Coming Soon")
- Physical product shop
