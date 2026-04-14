# Phase 1 Journey Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a clickable prototype of the 6-stop Ancestra journey with hardcoded Osmond mock data, full cinematic polish, and no AI/Stripe/DB integrations.

**Architecture:** Six separate React Router routes (`/journey/1` through `/journey/6`) share a layout component that handles grain overlay, ambient glow, step counter, and page-to-page fade transitions via Framer Motion's `AnimatePresence`. All content reads from a single typed mock-data module. Reusable primitives (section label, cinematic heading, divider, stagger group) are factored out.

**Tech Stack:** React 18 + React Router 6 + TypeScript + Tailwind + Framer Motion (new dependency) + existing `CrestHero` (R3F) for Stop 4. Libre Caslon Display, Libre Caslon Text, and DM Sans loaded from Google Fonts.

**Verification model:** No automated tests in Phase 1 (per spec). Each task ends with a **Lovable preview verification step** — specific things to click/see before committing.

**Reference:** `docs/superpowers/specs/2026-04-14-phase-1-journey-prototype-design.md`

---

## Task 1: Install dependencies, add fonts, scaffold routes

**Files:**
- Modify: `package.json` (via `bun add framer-motion`)
- Modify: `index.html` (add Google Fonts links)
- Modify: `src/App.tsx` (add 6 journey routes pointing to placeholder)
- Create: `src/pages/journey/JourneyPlaceholder.tsx` (temporary stub)

- [ ] **Step 1: Install Framer Motion**

```bash
bun add framer-motion
```

Expected: `package.json` shows `"framer-motion": "^11.x.x"` (or current), `bun.lock` updated.

- [ ] **Step 2: Add Google Fonts links to `index.html`**

Find the `<head>` block and add the following before the closing `</head>` tag. If these links already exist, skip.

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Libre+Caslon+Display&family=Libre+Caslon+Text:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
```

- [ ] **Step 3: Create placeholder stop component**

Create `src/pages/journey/JourneyPlaceholder.tsx`:

```tsx
import { useParams } from "react-router-dom";

const JourneyPlaceholder = () => {
  const { stop } = useParams();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-cream-warm">
      <div className="text-center">
        <p className="font-sans text-[10px] uppercase tracking-[4px] text-amber-dim">
          STOP {stop ?? "?"} / 06
        </p>
        <h1 className="mt-4 font-display text-5xl">Stop {stop} placeholder</h1>
      </div>
    </div>
  );
};

export default JourneyPlaceholder;
```

- [ ] **Step 4: Update `src/App.tsx` with journey routes**

Replace the `<Routes>` block. New full file:

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import JourneyPlaceholder from "./pages/journey/JourneyPlaceholder.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/journey" element={<Navigate to="/journey/1" replace />} />
          <Route path="/journey/:stop" element={<JourneyPlaceholder />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
```

- [ ] **Step 5: Verify in Lovable preview**

- Visit `/journey` — should redirect to `/journey/1` and show "Stop 1 placeholder".
- Visit `/journey/3`, `/journey/6` — should show correct stop number.
- Visit `/` — landing page still renders normally (unchanged).
- No console errors.

- [ ] **Step 6: Commit**

```bash
git add package.json bun.lock index.html src/App.tsx src/pages/journey/JourneyPlaceholder.tsx
git commit -m "Scaffold journey routes and add Framer Motion dependency"
git push origin main
```

---

## Task 2: Create Osmond mock data module

**Files:**
- Create: `src/data/osmondMock.ts`

- [ ] **Step 1: Create the typed mock data file**

Create `src/data/osmondMock.ts`:

```ts
export type Generation = {
  name: string;
  years: string;
  location: string;
  role?: string;
  isYou?: boolean;
};

export type Migration = {
  from: string;
  to: string;
  year: string;
};

export type SymbolismBreakdown = {
  element: string;
  meaning: string;
};

export type Chapter = {
  number: string;
  title: string;
  body?: string;
};

export type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
  occasion: string;
};

export type FamilyLegacy = {
  surname: string;
  meaning: string;
  origin: string;
  originYear: string;
  ancestralRole: string;
  historicalQuote: string;
  tree: Generation[];
  migration: Migration;
  crestImage: string;
  mottoLatin: string;
  mottoEnglish: string;
  symbolism: SymbolismBreakdown[];
  chapters: Chapter[];
  recommendedProducts: Product[];
};

export const osmondMock: FamilyLegacy = {
  surname: "Osmond",
  meaning: "Divine Protector",
  origin: "Dorset, England",
  originYear: "Since 1066",
  ancestralRole: "Hayward — Land managers and protectors of the shire",
  historicalQuote:
    "Recorded in the Domesday Book of 1086 — stewards of the land, keepers of the peace.",
  tree: [
    {
      name: "William Osmund",
      years: "1066–1120",
      location: "Piddletrenthide, Dorset",
      role: "Norman settler",
    },
    {
      name: "John Osmond",
      years: "1620–1688",
      location: "Piddletrenthide, Dorset",
      role: "Hayward",
    },
    {
      name: "Joseph Osmond",
      years: "1742–1810",
      location: "Newfoundland, Canada",
      role: "Fisherman & founder",
    },
    {
      name: "Mark Osmond",
      years: "1795–1867",
      location: "Newfoundland, Canada",
      role: "Shipping merchant",
    },
    {
      name: "Ambrose Osmond",
      years: "1828–1901",
      location: "Newfoundland, Canada",
      role: "Shipping merchant",
    },
    {
      name: "Gregory Osmond",
      years: "1981–",
      location: "Today",
      role: "Founder",
      isYou: true,
    },
  ],
  migration: {
    from: "Dorset, England",
    to: "Newfoundland, Canada",
    year: "c. 1820",
  },
  crestImage: "/crest.png",
  mottoLatin: "Ex Labore, Ascendimus",
  mottoEnglish: "From Labour, We Rise",
  symbolism: [
    { element: "Twin Lions", meaning: "Courage and guardianship of the line" },
    { element: "Golden Chevron", meaning: "Protection earned through labour" },
    { element: "Crowned Helm", meaning: "Honour passed through generations" },
    { element: "Silver Banner", meaning: "The name carried forward" },
  ],
  chapters: [
    {
      number: "I",
      title: "The Hayward of Piddletrenthide",
      body:
        "In the rolling downs of Dorset, where the river Piddle cuts a slow green line through the chalk, there stood a man whose job was to protect the land. They called him the Hayward. He was not a lord. He owned no castle. But every fence, every hedgerow, every acre of common ground was his to keep. When the cattle strayed, he turned them back. When a neighbour's greed crept past the boundary stones, he set them right. The villagers paid him in bread, in cider, in respect. He was the first Osmond — and his name, Os-mund, meant Divine Protector. The line began with a quiet promise: to guard what others could not. To rise not by birth, but by labour. And that promise would carry twelve generations across an ocean, into storms and ships and new towns raised from nothing. It began with him. It begins again with you.",
    },
    { number: "II", title: "The Wills of Dorset" },
    { number: "III", title: "The Decision to Leave" },
    { number: "IV", title: "Joseph Osmond Lands on the Rock" },
    { number: "V", title: "The Fishing Fleet" },
    { number: "VI", title: "Mark and Ambrose: The Shipping Years" },
    { number: "VII", title: "Trade Winds to the West Indies" },
    { number: "VIII", title: "The Line Endures" },
    { number: "IX", title: "And the Name Comes to You" },
  ],
  recommendedProducts: [
    {
      id: "framed-crest",
      name: "Framed Crest Print",
      price: 79,
      image: "/crest.png",
      occasion: "Father's Day",
    },
    {
      id: "beer-mug",
      name: "Engraved Whiskey Glass",
      price: 39,
      image: "/crest.png",
      occasion: "Birthday",
    },
    {
      id: "ornament",
      name: "Heirloom Christmas Ornament",
      price: 29,
      image: "/crest.png",
      occasion: "Christmas",
    },
  ],
};
```

- [ ] **Step 2: Verify the file compiles**

In Lovable preview, trigger any TypeScript check by saving — no red errors in the editor panel for this file. Module is imported by no one yet, so nothing runtime to test.

- [ ] **Step 3: Commit**

```bash
git add src/data/osmondMock.ts
git commit -m "Add Osmond mock data for journey prototype"
git push origin main
```

---

## Task 3: Build shared journey layout + primitive components

**Files:**
- Create: `src/components/journey/SectionLabel.tsx`
- Create: `src/components/journey/WarmDivider.tsx`
- Create: `src/components/journey/StaggerGroup.tsx`
- Create: `src/pages/journey/JourneyLayout.tsx`

- [ ] **Step 1: Create `SectionLabel`**

`src/components/journey/SectionLabel.tsx`:

```tsx
type Props = { children: React.ReactNode; className?: string };

const SectionLabel = ({ children, className = "" }: Props) => (
  <p
    className={`font-sans text-[10px] uppercase tracking-[4px] text-amber-dim ${className}`}
  >
    {children}
  </p>
);

export default SectionLabel;
```

- [ ] **Step 2: Create `WarmDivider`**

`src/components/journey/WarmDivider.tsx`:

```tsx
const WarmDivider = () => (
  <div className="flex items-center justify-center gap-3 py-6">
    <div className="h-px w-10 bg-gradient-to-r from-transparent to-amber-dim" />
    <div className="h-[5px] w-[5px] rounded-full bg-amber-dim" />
    <div className="h-px w-10 bg-gradient-to-l from-transparent to-amber-dim" />
  </div>
);

export default WarmDivider;
```

- [ ] **Step 3: Create `StaggerGroup`**

`src/components/journey/StaggerGroup.tsx`:

```tsx
import { motion } from "framer-motion";

type Props = {
  children: React.ReactNode;
  delay?: number;
  stagger?: number;
  className?: string;
};

export const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
};

const StaggerGroup = ({
  children,
  delay = 0.2,
  stagger = 0.18,
  className = "",
}: Props) => (
  <motion.div
    initial="hidden"
    animate="show"
    variants={{
      hidden: {},
      show: {
        transition: { staggerChildren: stagger, delayChildren: delay },
      },
    }}
    className={className}
  >
    {children}
  </motion.div>
);

export default StaggerGroup;
```

- [ ] **Step 4: Create `JourneyLayout`**

`src/pages/journey/JourneyLayout.tsx`:

```tsx
import { AnimatePresence, motion } from "framer-motion";
import { Outlet, useLocation, useParams } from "react-router-dom";

const JourneyLayout = () => {
  const location = useLocation();
  const { stop } = useParams();
  const stopNumber = stop ?? "1";

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* SVG grain overlay */}
      <svg className="pointer-events-none fixed inset-0 z-50 h-full w-full opacity-[0.018]">
        <filter id="journey-grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.65"
            numOctaves="3"
            stitchTiles="stitch"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#journey-grain)" />
      </svg>

      {/* Ambient amber glow */}
      <div
        className="pointer-events-none fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: "900px",
          height: "700px",
          background:
            "radial-gradient(ellipse at center, hsla(30, 80%, 40%, 0.07) 0%, transparent 70%)",
        }}
      />

      {/* Step counter */}
      <div className="fixed right-8 top-8 z-40 font-sans text-[10px] uppercase tracking-[4px] text-amber-dim">
        {String(stopNumber).padStart(2, "0")} / 06
      </div>

      {/* Animated page content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10"
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default JourneyLayout;
```

- [ ] **Step 5: Wire `JourneyLayout` in `App.tsx`**

Replace the journey routes block in `src/App.tsx`:

```tsx
<Route path="/journey" element={<JourneyLayout />}>
  <Route index element={<Navigate to="/journey/1" replace />} />
  <Route path=":stop" element={<JourneyPlaceholder />} />
</Route>
```

And add import:

```tsx
import JourneyLayout from "./pages/journey/JourneyLayout.tsx";
```

- [ ] **Step 6: Verify in Lovable preview**

- `/journey/1` shows "Stop 1 placeholder" centred.
- Step counter in top-right reads `01 / 06`.
- Grain + amber glow visible.
- Navigate `/journey/1` → `/journey/2` via URL bar: page transitions with fade.
- No console errors.

- [ ] **Step 7: Commit**

```bash
git add src/components/journey src/pages/journey/JourneyLayout.tsx src/App.tsx
git commit -m "Add shared JourneyLayout and primitive components"
git push origin main
```

---

## Task 4: Build Stop 1 — Enter Your Name

**Files:**
- Create: `src/pages/journey/Stop1EnterName.tsx`
- Modify: `src/App.tsx` (replace placeholder for stop 1)

- [ ] **Step 1: Create `Stop1EnterName.tsx`**

```tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import SectionLabel from "@/components/journey/SectionLabel";
import StaggerGroup, { staggerItem } from "@/components/journey/StaggerGroup";

const Stop1EnterName = () => {
  const navigate = useNavigate();
  const [surname, setSurname] = useState("");
  const [expanded, setExpanded] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/journey/2");
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-24">
      <StaggerGroup className="w-full max-w-xl text-center">
        <motion.div variants={staggerItem}>
          <SectionLabel>BEGIN YOUR LEGACY</SectionLabel>
        </motion.div>

        <motion.h1
          variants={staggerItem}
          className="mt-6 font-display text-5xl leading-tight tracking-tight text-cream-warm sm:text-6xl"
        >
          Enter your name.
        </motion.h1>

        <motion.p
          variants={staggerItem}
          className="mt-5 font-serif text-lg italic text-cream-soft"
        >
          Every family has a story. Yours is waiting.
        </motion.p>

        <motion.form
          variants={staggerItem}
          onSubmit={handleSubmit}
          className="mt-12 flex flex-col items-center gap-5"
        >
          <input
            type="text"
            value={surname}
            onChange={(e) => setSurname(e.target.value)}
            placeholder="e.g. Osmond"
            autoFocus
            className="w-full rounded-pill border border-amber-dim/30 bg-bg-input px-8 py-5 text-center font-display text-2xl text-cream-warm placeholder:text-text-dim focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/30"
          />

          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="font-sans text-[11px] uppercase tracking-[3px] text-amber-dim transition-colors hover:text-amber"
          >
            {expanded ? "− Hide details" : "+ Add more details"}
          </button>

          {expanded && (
            <div className="grid w-full gap-3 text-left">
              <input
                type="text"
                placeholder="Parents' names (optional)"
                className="rounded-[14px] border border-amber-dim/20 bg-bg-input px-5 py-3 font-sans text-sm text-text placeholder:text-text-dim focus:border-amber focus:outline-none"
              />
              <input
                type="text"
                placeholder="Country of origin (optional)"
                className="rounded-[14px] border border-amber-dim/20 bg-bg-input px-5 py-3 font-sans text-sm text-text placeholder:text-text-dim focus:border-amber focus:outline-none"
              />
              <input
                type="text"
                placeholder="Birth year (optional)"
                className="rounded-[14px] border border-amber-dim/20 bg-bg-input px-5 py-3 font-sans text-sm text-text placeholder:text-text-dim focus:border-amber focus:outline-none"
              />
            </div>
          )}

          <button
            type="submit"
            className="mt-6 rounded-pill px-12 py-4 font-sans text-[13px] font-semibold uppercase tracking-[1.5px] text-primary-foreground transition-all duration-300 hover:-translate-y-0.5"
            style={{
              background: "linear-gradient(135deg, #e8943a, #c47828)",
              transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          >
            Discover My Legacy
          </button>
        </motion.form>
      </StaggerGroup>
    </div>
  );
};

export default Stop1EnterName;
```

- [ ] **Step 2: Update routing in `src/App.tsx`**

Replace the journey stop route:

```tsx
<Route path="/journey" element={<JourneyLayout />}>
  <Route index element={<Navigate to="/journey/1" replace />} />
  <Route path="1" element={<Stop1EnterName />} />
  <Route path=":stop" element={<JourneyPlaceholder />} />
</Route>
```

Add import: `import Stop1EnterName from "./pages/journey/Stop1EnterName.tsx";`

- [ ] **Step 3: Verify in Lovable preview**

- Visit `/journey/1` — staggered entry, headline + subtitle + input + CTA appear in order.
- Click `+ Add more details` — three optional inputs slide in, label switches to `− Hide details`.
- Type anything in surname → click `Discover My Legacy` → navigates to `/journey/2` (shows placeholder).
- Empty submit also navigates (form never errors).
- No console errors.

- [ ] **Step 4: Commit**

```bash
git add src/pages/journey/Stop1EnterName.tsx src/App.tsx
git commit -m "Build Stop 1: Enter Your Name"
git push origin main
```

---

## Task 5: Build Stop 2 — Your Name Has a Story

**Files:**
- Create: `src/pages/journey/Stop2NameMeaning.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create `Stop2NameMeaning.tsx`**

```tsx
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import SectionLabel from "@/components/journey/SectionLabel";
import StaggerGroup, { staggerItem } from "@/components/journey/StaggerGroup";
import WarmDivider from "@/components/journey/WarmDivider";
import { osmondMock } from "@/data/osmondMock";

const Stop2NameMeaning = () => {
  const d = osmondMock;
  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-24">
      <StaggerGroup
        delay={0.3}
        stagger={0.4}
        className="w-full max-w-2xl text-center"
      >
        <motion.div variants={staggerItem}>
          <SectionLabel>CHAPTER ONE</SectionLabel>
        </motion.div>

        <motion.h1
          variants={staggerItem}
          className="mt-5 font-display text-6xl tracking-[4px] text-cream-warm sm:text-7xl"
        >
          {d.surname.toUpperCase()}
        </motion.h1>

        <motion.p
          variants={staggerItem}
          className="mt-10 font-serif text-xl italic text-amber-light"
        >
          {d.meaning}
        </motion.p>

        <motion.p
          variants={staggerItem}
          className="mt-4 font-sans text-base text-text"
        >
          {d.origin}
        </motion.p>

        <motion.p
          variants={staggerItem}
          className="mt-2 font-sans text-[11px] uppercase tracking-[3px] text-amber-dim"
        >
          {d.originYear}
        </motion.p>

        <motion.p
          variants={staggerItem}
          className="mt-6 font-serif text-lg text-text-body"
        >
          {d.ancestralRole}
        </motion.p>

        <motion.div variants={staggerItem}>
          <WarmDivider />
          <p className="font-serif text-base italic text-amber-light">
            “{d.historicalQuote}”
          </p>
          <WarmDivider />
        </motion.div>

        <motion.div variants={staggerItem} className="mt-8">
          <Link
            to="/journey/3"
            className="inline-block rounded-pill px-12 py-4 font-sans text-[13px] font-semibold uppercase tracking-[1.5px] text-primary-foreground transition-all duration-300 hover:-translate-y-0.5"
            style={{
              background: "linear-gradient(135deg, #e8943a, #c47828)",
              transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          >
            Meet Your Bloodline
          </Link>
        </motion.div>
      </StaggerGroup>
    </div>
  );
};

export default Stop2NameMeaning;
```

- [ ] **Step 2: Wire the route in `src/App.tsx`**

```tsx
<Route path="2" element={<Stop2NameMeaning />} />
```

Add import: `import Stop2NameMeaning from "./pages/journey/Stop2NameMeaning.tsx";`

- [ ] **Step 3: Verify in Lovable preview**

- `/journey/2` displays "OSMOND" huge and the stat lines reveal one-by-one (noticeable pacing between each).
- Quote appears between dividers.
- `Meet Your Bloodline` button navigates to `/journey/3`.

- [ ] **Step 4: Commit**

```bash
git add src/pages/journey/Stop2NameMeaning.tsx src/App.tsx
git commit -m "Build Stop 2: Your Name Has a Story"
git push origin main
```

---

## Task 6: Build Stop 3 — Meet Your Bloodline

**Files:**
- Create: `src/components/journey/BloodlineTree.tsx`
- Create: `src/pages/journey/Stop3Bloodline.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create `BloodlineTree.tsx`**

```tsx
import { motion } from "framer-motion";
import type { Generation } from "@/data/osmondMock";

type Props = { generations: Generation[] };

const BloodlineTree = ({ generations }: Props) => (
  <div className="relative mx-auto flex w-full max-w-md flex-col items-center">
    {/* Continuous connector line */}
    <div
      className="absolute top-0 h-full w-px bg-gradient-to-b from-transparent via-amber-dim/40 to-transparent"
      style={{ left: "50%", transform: "translateX(-50%)" }}
    />

    {generations.map((g, i) => (
      <motion.div
        key={g.name}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.7,
          delay: 0.2 + i * 0.18,
          ease: [0.22, 1, 0.36, 1],
        }}
        className={`relative z-10 my-3 w-full rounded-[14px] border px-6 py-4 text-center backdrop-blur-sm ${
          g.isYou
            ? "border-amber/50 bg-amber/[0.06] shadow-[0_0_40px_rgba(232,148,58,0.15)]"
            : "border-amber-dim/15 bg-bg-card/60"
        }`}
      >
        {g.isYou && (
          <p className="mb-1 font-sans text-[10px] uppercase tracking-[4px] text-amber">
            YOU
          </p>
        )}
        <h3
          className={`font-display ${
            g.isYou ? "text-2xl text-cream-warm" : "text-lg text-cream-soft"
          }`}
        >
          {g.name}
        </h3>
        <p className="mt-1 font-sans text-xs text-text-dim">
          {g.years} · {g.location}
        </p>
        {g.role && (
          <p className="mt-1 font-serif text-sm italic text-amber-dim">
            {g.role}
          </p>
        )}
      </motion.div>
    ))}
  </div>
);

export default BloodlineTree;
```

- [ ] **Step 2: Create `Stop3Bloodline.tsx`**

```tsx
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import SectionLabel from "@/components/journey/SectionLabel";
import BloodlineTree from "@/components/journey/BloodlineTree";
import { osmondMock } from "@/data/osmondMock";

const Stop3Bloodline = () => {
  const d = osmondMock;
  const totalReveal = d.tree.length * 0.18 + 0.5;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-24">
      <div className="mb-10 text-center">
        <SectionLabel>YOUR BLOODLINE</SectionLabel>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mt-4 font-display text-4xl tracking-tight text-cream-warm sm:text-5xl"
        >
          The line that led to you.
        </motion.h1>
      </div>

      <BloodlineTree generations={d.tree} />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: totalReveal }}
        className="mt-10 rounded-pill border border-amber-dim/40 bg-bg-card/40 px-6 py-3"
      >
        <p className="font-sans text-xs uppercase tracking-[2px] text-amber-light">
          {d.migration.from} → {d.migration.to} · {d.migration.year}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: totalReveal + 0.3 }}
        className="mt-12"
      >
        <Link
          to="/journey/4"
          className="inline-block rounded-pill px-12 py-4 font-sans text-[13px] font-semibold uppercase tracking-[1.5px] text-primary-foreground transition-all duration-300 hover:-translate-y-0.5"
          style={{
            background: "linear-gradient(135deg, #e8943a, #c47828)",
            transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          Forge Your Crest
        </Link>
      </motion.div>
    </div>
  );
};

export default Stop3Bloodline;
```

- [ ] **Step 3: Wire route + import in `src/App.tsx`**

```tsx
<Route path="3" element={<Stop3Bloodline />} />
```

`import Stop3Bloodline from "./pages/journey/Stop3Bloodline.tsx";`

- [ ] **Step 4: Verify in Lovable preview**

- `/journey/3` shows headline then 6 generation cards cascade-in oldest-first.
- Final card (Gregory Osmond) glows amber and shows "YOU" label.
- Migration badge appears after tree completes.
- `Forge Your Crest` appears last and links to `/journey/4`.

- [ ] **Step 5: Commit**

```bash
git add src/components/journey/BloodlineTree.tsx src/pages/journey/Stop3Bloodline.tsx src/App.tsx
git commit -m "Build Stop 3: Meet Your Bloodline"
git push origin main
```

---

## Task 7: Build Stop 4 — Your Crest is Forged

**Files:**
- Create: `src/components/journey/ForgeLoader.tsx`
- Create: `src/pages/journey/Stop4CrestForge.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create `ForgeLoader.tsx`**

```tsx
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

type Props = { messages: string[]; onComplete: () => void; perMessageMs?: number };

const ForgeLoader = ({ messages, onComplete, perMessageMs = 1200 }: Props) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index >= messages.length) {
      const done = setTimeout(onComplete, 300);
      return () => clearTimeout(done);
    }
    const next = setTimeout(() => setIndex((i) => i + 1), perMessageMs);
    return () => clearTimeout(next);
  }, [index, messages.length, onComplete, perMessageMs]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center">
      <AnimatePresence mode="wait">
        {index < messages.length && (
          <motion.p
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{
              opacity: [0, 1, 1, 0.4],
              y: 0,
            }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: perMessageMs / 1000, times: [0, 0.2, 0.7, 1] }}
            className="font-serif text-xl italic text-amber-light"
          >
            {messages[index]}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ForgeLoader;
```

- [ ] **Step 2: Create `Stop4CrestForge.tsx`**

```tsx
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useState } from "react";
import SectionLabel from "@/components/journey/SectionLabel";
import ForgeLoader from "@/components/journey/ForgeLoader";
import CrestHero from "@/components/CrestHero";
import { osmondMock } from "@/data/osmondMock";

const FORGE_MESSAGES = [
  "Consulting the archives…",
  "Melting the gold…",
  "Inscribing the motto…",
];

const Stop4CrestForge = () => {
  const [forged, setForged] = useState(false);
  const d = osmondMock;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-24">
      <SectionLabel>THE FORGE</SectionLabel>

      <AnimatePresence mode="wait">
        {!forged ? (
          <motion.div key="loader" exit={{ opacity: 0 }} className="w-full">
            <ForgeLoader messages={FORGE_MESSAGES} onComplete={() => setForged(true)} />
          </motion.div>
        ) : (
          <motion.div key="reveal" className="flex w-full flex-col items-center">
            {/* Crest reveal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-3xl"
            >
              <div
                className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                style={{
                  width: "700px",
                  height: "700px",
                  background:
                    "radial-gradient(circle at center, hsla(30, 80%, 50%, 0.15) 0%, transparent 60%)",
                }}
              />
              <CrestHero />
            </motion.div>

            {/* Motto */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="mt-2 text-center"
            >
              <p className="font-serif text-2xl italic text-amber-light">
                {d.mottoLatin}
              </p>
              <p className="mt-2 font-sans text-sm tracking-[2px] text-amber-dim">
                {d.mottoEnglish.toUpperCase()}
              </p>
            </motion.div>

            {/* Symbolism grid */}
            <motion.div
              initial="hidden"
              animate="show"
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: 0.2, delayChildren: 1.2 } },
              }}
              className="mt-12 grid w-full max-w-4xl grid-cols-2 gap-4 md:grid-cols-4"
            >
              {d.symbolism.map((s) => (
                <motion.div
                  key={s.element}
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
                  }}
                  className="rounded-[14px] border border-amber-dim/20 bg-bg-card/50 p-5 text-center"
                >
                  <div className="mx-auto mb-3 h-2 w-2 rounded-full bg-amber" />
                  <h4 className="font-display text-base text-cream-warm">
                    {s.element}
                  </h4>
                  <p className="mt-2 font-serif text-xs italic text-text-body">
                    {s.meaning}
                  </p>
                </motion.div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 2.2 }}
              className="mt-12"
            >
              <Link
                to="/journey/5"
                className="inline-block rounded-pill px-12 py-4 font-sans text-[13px] font-semibold uppercase tracking-[1.5px] text-primary-foreground transition-all duration-300 hover:-translate-y-0.5"
                style={{
                  background: "linear-gradient(135deg, #e8943a, #c47828)",
                  transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
                }}
              >
                Read Your Story
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Stop4CrestForge;
```

- [ ] **Step 3: Wire route + import in `src/App.tsx`**

```tsx
<Route path="4" element={<Stop4CrestForge />} />
```

`import Stop4CrestForge from "./pages/journey/Stop4CrestForge.tsx";`

- [ ] **Step 4: Verify in Lovable preview**

- `/journey/4` shows three forge messages cycling ~1.2s each with fade.
- After loader exits, crest fades in and scales from 0.8 → 1 with amber radial bloom.
- Motto appears below crest after 0.6s delay.
- 4 symbolism cards cascade in.
- `Read Your Story` button appears last, navigates to `/journey/5`.
- Mouse-move anywhere on page still tilts the crest (global pointer tracking works).

- [ ] **Step 5: Commit**

```bash
git add src/components/journey/ForgeLoader.tsx src/pages/journey/Stop4CrestForge.tsx src/App.tsx
git commit -m "Build Stop 4: Your Crest is Forged"
git push origin main
```

---

## Task 8: Build Stop 5 — Your Story is Written

**Files:**
- Create: `src/components/journey/TypewriterText.tsx`
- Create: `src/pages/journey/Stop5Story.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create `TypewriterText.tsx`**

```tsx
import { useEffect, useState } from "react";

type Props = {
  text: string;
  msPerChar?: number;
  onDone?: () => void;
  className?: string;
};

const TypewriterText = ({
  text,
  msPerChar = 28,
  onDone,
  className = "",
}: Props) => {
  const [charCount, setCharCount] = useState(0);
  const [skipped, setSkipped] = useState(false);

  useEffect(() => {
    if (skipped) {
      setCharCount(text.length);
      onDone?.();
      return;
    }
    if (charCount >= text.length) {
      onDone?.();
      return;
    }
    const t = setTimeout(() => setCharCount((c) => c + 1), msPerChar);
    return () => clearTimeout(t);
  }, [charCount, text, msPerChar, skipped, onDone]);

  return (
    <p
      onClick={() => setSkipped(true)}
      className={`cursor-pointer whitespace-pre-wrap ${className}`}
    >
      {text.slice(0, charCount)}
      {charCount < text.length && <span className="animate-pulse">▌</span>}
    </p>
  );
};

export default TypewriterText;
```

- [ ] **Step 2: Create `Stop5Story.tsx`**

```tsx
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useState } from "react";
import SectionLabel from "@/components/journey/SectionLabel";
import TypewriterText from "@/components/journey/TypewriterText";
import { osmondMock } from "@/data/osmondMock";

const Stop5Story = () => {
  const d = osmondMock;
  const firstChapter = d.chapters[0];
  const hiddenChapters = d.chapters.slice(1);
  const [typed, setTyped] = useState(false);

  return (
    <div className="flex min-h-screen flex-col items-center px-6 py-24">
      <div className="w-full max-w-2xl">
        <div className="text-center">
          <SectionLabel>CHAPTER {firstChapter.number}</SectionLabel>
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="mt-4 font-display text-3xl text-amber-light sm:text-4xl"
          >
            {firstChapter.title}
          </motion.h1>
        </div>

        <div className="mt-12">
          {firstChapter.body && (
            <TypewriterText
              text={firstChapter.body}
              onDone={() => setTyped(true)}
              className="font-serif text-lg leading-relaxed text-text-body"
            />
          )}
        </div>

        {/* Fade-to-dark mask + hidden chapter list */}
        {typed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2 }}
            className="relative mt-12"
          >
            <div className="pointer-events-none absolute -top-24 left-0 right-0 h-24 bg-gradient-to-b from-transparent to-background" />
            <ul className="space-y-2 text-center opacity-40">
              {hiddenChapters.map((c) => (
                <li
                  key={c.number}
                  className="font-serif text-sm italic text-text-dim"
                >
                  Chapter {c.number}: {c.title}
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* Paywall */}
        {typed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="mt-16 rounded-[22px] border border-amber-dim/40 bg-bg-card/60 p-10 text-center backdrop-blur-sm"
          >
            <h2 className="font-display text-2xl text-cream-warm sm:text-3xl">
              Unlock your full Legacy Pack
            </h2>
            <ul className="mx-auto mt-6 max-w-sm space-y-2 text-left font-sans text-sm text-text-body">
              <li>· Full 9 chapters of your family story</li>
              <li>· High-resolution crest (print-ready)</li>
              <li>· Legacy certificate (PDF)</li>
              <li>· Visual family tree print</li>
              <li>· Ancestor chat (beta)</li>
            </ul>
            <p className="mt-8 font-display text-5xl text-amber-light">$29</p>
            <Link
              to="/journey/6"
              className="mt-8 inline-block rounded-pill px-12 py-4 font-sans text-[13px] font-semibold uppercase tracking-[1.5px] text-primary-foreground transition-all duration-300 hover:-translate-y-0.5"
              style={{
                background: "linear-gradient(135deg, #e8943a, #c47828)",
                transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
              }}
            >
              See the Full Legacy
            </Link>
            <p className="mt-5 font-serif text-xs italic text-text-dim">
              prototype mode — payment skipped
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Stop5Story;
```

- [ ] **Step 3: Wire route + import in `src/App.tsx`**

```tsx
<Route path="5" element={<Stop5Story />} />
```

`import Stop5Story from "./pages/journey/Stop5Story.tsx";`

- [ ] **Step 4: Verify in Lovable preview**

- `/journey/5` shows chapter title then body types out character-by-character.
- Clicking anywhere during typing instantly finishes the text.
- After typing, ghosted list of Chapters II–IX appears, then paywall card fades in.
- `See the Full Legacy` navigates to `/journey/6`.
- Italic "prototype mode — payment skipped" under the button.

- [ ] **Step 5: Commit**

```bash
git add src/components/journey/TypewriterText.tsx src/pages/journey/Stop5Story.tsx src/App.tsx
git commit -m "Build Stop 5: Your Story is Written"
git push origin main
```

---

## Task 9: Build Stop 6 — Pass It On

**Files:**
- Create: `src/components/journey/ProductCard.tsx`
- Create: `src/pages/journey/Stop6PassItOn.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create `ProductCard.tsx`**

```tsx
import { toast } from "sonner";
import type { Product } from "@/data/osmondMock";

type Props = { product: Product };

const ProductCard = ({ product }: Props) => (
  <div className="overflow-hidden rounded-[22px] border border-amber-dim/15 bg-bg-card/60 transition-colors hover:border-amber-dim/30">
    <div className="relative aspect-square bg-bg-warm">
      <img
        src={product.image}
        alt={product.name}
        className="h-full w-full object-cover"
      />
      <span className="absolute left-4 top-4 rounded-pill bg-bg/80 px-3 py-1 font-sans text-[10px] uppercase tracking-[2px] text-amber-light backdrop-blur-sm">
        {product.occasion}
      </span>
    </div>
    <div className="p-5">
      <h4 className="font-display text-lg text-cream-warm">{product.name}</h4>
      <p className="mt-1 font-display text-2xl text-amber-light">
        ${product.price}
      </p>
      <button
        onClick={() => toast.info("Shop launches soon.")}
        className="mt-4 w-full rounded-pill border border-amber-dim/30 bg-amber/[0.05] px-5 py-3 font-sans text-[11px] font-semibold uppercase tracking-[2px] text-amber transition-colors hover:bg-amber/[0.1]"
      >
        Gift This
      </button>
    </div>
  </div>
);

export default ProductCard;
```

- [ ] **Step 2: Create `Stop6PassItOn.tsx`**

```tsx
import { motion } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";
import SectionLabel from "@/components/journey/SectionLabel";
import WarmDivider from "@/components/journey/WarmDivider";
import ProductCard from "@/components/journey/ProductCard";
import StaggerGroup, { staggerItem } from "@/components/journey/StaggerGroup";
import { osmondMock } from "@/data/osmondMock";

const Stop6PassItOn = () => {
  const [email, setEmail] = useState("");
  const d = osmondMock;

  const sendPreview = (e: React.FormEvent) => {
    e.preventDefault();
    const target = email || "your family";
    toast.success(`Preview sent to ${target}.`);
    setEmail("");
  };

  return (
    <div className="flex min-h-screen flex-col items-center px-6 py-24">
      <StaggerGroup className="w-full max-w-2xl">
        <motion.div variants={staggerItem} className="text-center">
          <SectionLabel>PASS IT ON</SectionLabel>
          <h1 className="mt-4 font-display text-4xl tracking-tight text-cream-warm sm:text-5xl">
            Who in your family needs to see this?
          </h1>
        </motion.div>

        {/* Action 1: send preview */}
        <motion.div variants={staggerItem} className="mt-16">
          <p className="mb-4 text-center font-serif text-sm italic text-amber-dim">
            Send a free preview
          </p>
          <form onSubmit={sendPreview} className="flex flex-col gap-3 sm:flex-row">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="their@email.com"
              className="flex-1 rounded-pill border border-amber-dim/30 bg-bg-input px-6 py-4 font-sans text-sm text-cream-warm placeholder:text-text-dim focus:border-amber focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-pill px-8 py-4 font-sans text-[12px] font-semibold uppercase tracking-[1.5px] text-primary-foreground"
              style={{ background: "linear-gradient(135deg, #e8943a, #c47828)" }}
            >
              Send Preview
            </button>
          </form>
        </motion.div>

        <motion.div variants={staggerItem}>
          <WarmDivider />
        </motion.div>

        {/* Action 2: gift the legacy pack */}
        <motion.div variants={staggerItem} className="text-center">
          <p className="mb-4 font-serif text-sm italic text-amber-dim">
            Gift the Legacy Pack
          </p>
          <button
            onClick={() => toast.info("Gift flow — launching soon.")}
            className="rounded-pill border border-amber/40 bg-amber/[0.06] px-10 py-4 font-sans text-[12px] font-semibold uppercase tracking-[1.5px] text-amber-light transition-colors hover:bg-amber/[0.12]"
          >
            Gift the Legacy · $29
          </button>
        </motion.div>

        <motion.div variants={staggerItem}>
          <WarmDivider />
        </motion.div>

        {/* Action 3: physical keepsake */}
        <motion.div variants={staggerItem}>
          <p className="mb-6 text-center font-serif text-sm italic text-amber-dim">
            Or gift a physical keepsake
          </p>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {d.recommendedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </motion.div>

        <motion.p
          variants={staggerItem}
          className="mt-20 text-center font-serif text-sm italic text-amber-dim"
        >
          An Ancestra Original.
        </motion.p>
      </StaggerGroup>
    </div>
  );
};

export default Stop6PassItOn;
```

- [ ] **Step 3: Wire route + import in `src/App.tsx`**

```tsx
<Route path="6" element={<Stop6PassItOn />} />
```

Also **remove** the fallback `<Route path=":stop" element={<JourneyPlaceholder />} />` line — all six stops are now defined. You can also delete `src/pages/journey/JourneyPlaceholder.tsx` and its import.

`import Stop6PassItOn from "./pages/journey/Stop6PassItOn.tsx";`

- [ ] **Step 4: Verify in Lovable preview**

- `/journey/6` shows headline, three action blocks separated by dividers.
- Typing email + Send → toast "Preview sent to their@email.com."
- Empty email + Send → toast "Preview sent to your family."
- Gift the Legacy → toast "Gift flow — launching soon."
- Each product card's "Gift This" → toast "Shop launches soon."
- Footer reads "An Ancestra Original." in italic.
- No forward CTA — this is the end.

- [ ] **Step 5: Commit**

```bash
git add src/components/journey/ProductCard.tsx src/pages/journey/Stop6PassItOn.tsx src/App.tsx
git rm src/pages/journey/JourneyPlaceholder.tsx
git commit -m "Build Stop 6: Pass It On; remove placeholder"
git push origin main
```

---

## Task 10: Wire landing CTA and final verification

**Files:**
- Modify: `src/pages/Index.tsx`

- [ ] **Step 1: Convert "Begin Your Journey" button to a `<Link>`**

In `src/pages/Index.tsx`, locate the `<button>` for "Begin Your Journey" and replace it with a `Link`. Add the import:

```tsx
import { Link } from "react-router-dom";
```

Replace the existing `<button>...</button>` with:

```tsx
<Link
  to="/journey"
  className="mt-10 inline-block rounded-pill px-10 py-4 text-[13px] font-semibold uppercase tracking-[1.5px] text-primary-foreground transition-all duration-400"
  style={{
    background: 'linear-gradient(135deg, #e8943a, #c47828)',
    transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
  }}
  onMouseEnter={(e) => {
    (e.currentTarget as HTMLAnchorElement).style.background = 'linear-gradient(135deg, #f0a848, #e8943a)';
  }}
  onMouseLeave={(e) => {
    (e.currentTarget as HTMLAnchorElement).style.background = 'linear-gradient(135deg, #e8943a, #c47828)';
  }}
>
  Begin Your Journey
</Link>
```

- [ ] **Step 2: Run full manual verification pass**

Walk through the entire journey from `/`:

- [ ] Landing `/` — crest + headline + subtitle + "Begin Your Journey" CTA.
- [ ] Click CTA → lands on `/journey/1`.
- [ ] Stop 1 cascades in, type something, click `Discover My Legacy`.
- [ ] Stop 2 shows OSMOND big, staggered stats, quote between dividers.
- [ ] Stop 3 shows tree cascading oldest-first, you-card glows, migration badge, `Forge Your Crest`.
- [ ] Stop 4 shows forge loader (3 messages, ~3.5s total), then crest reveal, motto, symbolism.
- [ ] Stop 5 shows chapter title, typewriter body (~20s), then paywall card with prototype note.
- [ ] Stop 6 shows three action blocks, toasts fire, "An Ancestra Original." footer.
- [ ] Browser back from any stop returns to the previous stop.
- [ ] Step counter in top-right updates correctly: `01 / 06` … `06 / 06`.
- [ ] No console errors on any stop.
- [ ] No cold blue/grey colours anywhere. All warm amber/cream/dark.
- [ ] All buttons are pill-shaped.

- [ ] **Step 3: Commit**

```bash
git add src/pages/Index.tsx
git commit -m "Wire landing CTA to journey; Phase 1 complete"
git push origin main
```

- [ ] **Step 4: Founder sign-off**

Ask Greg to click through the journey at `/` and report back on the emotional arc. This is the Phase 1 ship gate (per spec success criteria). If it feels like pride-and-discovery, move to Phase 2 planning. If not, iterate copy/timing/layout in follow-up commits.

---

## Self-Review Notes

- Every stop from the spec has a task (1→Task 4, 2→5, 3→6, 4→7, 5→8, 6→9).
- Primitive components built: `SectionLabel` (Task 3), `WarmDivider` (Task 3), `StaggerGroup` (Task 3), `TypewriterText` (Task 8), `ForgeLoader` (Task 7), `BloodlineTree` (Task 6), `ProductCard` (Task 9). `CinematicHeading` from the spec was dropped — stops inline `motion.h1` with stagger variants for per-page timing control; adding a separate component would be unused indirection.
- Mock data shape matches spec exactly (Task 2).
- Framer Motion dependency added once (Task 1).
- Google Fonts loaded (Task 1).
- Landing CTA wired (Task 10).
- Manual verification checklist embedded in Task 10 mirrors the spec's testing section.
- Success criteria (emotional arc sign-off) in Task 10 Step 4.
- No TODOs, no TBDs, no placeholder code — every code block is complete and copy-pastable.
