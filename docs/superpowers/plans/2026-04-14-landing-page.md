# Landing Page — Full Marketing Sections Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build five marketing sections below the existing hero — How It Works, Product Preview, Free Tools (Coming Soon), Occasions, and Final CTA — then wire them all into `src/pages/Index.tsx`.

**Architecture:** Each section is an isolated React component in `src/components/landing/`. All sections use Framer Motion `whileInView` for scroll-reveal. `WarmDivider` (already exists at `src/components/journey/WarmDivider.tsx`) separates sections. `Index.tsx` hero block is untouched — new sections append below it.

**Tech Stack:** React 18 + TypeScript, Tailwind CSS (Ancestra design tokens), Framer Motion v12 (already installed), Vitest + @testing-library/react for tests.

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Modify | `src/test/setup.ts` | Add IntersectionObserver mock (needed by Framer Motion whileInView in jsdom) |
| Create | `src/components/landing/HowItWorksSection.tsx` | 3-step journey explainer |
| Create | `src/test/landing/HowItWorksSection.test.tsx` | Render + content tests |
| Create | `src/components/landing/ProductPreviewSection.tsx` | 4 product cards + $29 badge |
| Create | `src/test/landing/ProductPreviewSection.test.tsx` | Render + content tests |
| Create | `src/components/landing/FreeToolsSection.tsx` | 3 tool cards with Coming Soon badges |
| Create | `src/test/landing/FreeToolsSection.test.tsx` | Render + content tests |
| Create | `src/components/landing/OccasionsSection.tsx` | Occasions tag cloud |
| Create | `src/test/landing/OccasionsSection.test.tsx` | Render + content tests |
| Create | `src/components/landing/FinalCtaSection.tsx` | Bottom close + CTA button |
| Create | `src/test/landing/FinalCtaSection.test.tsx` | Render + link tests |
| Modify | `src/pages/Index.tsx` | Import and render all 5 sections + dividers below hero |

---

## Task 1: IntersectionObserver mock + HowItWorksSection

**Files:**
- Modify: `src/test/setup.ts`
- Create: `src/components/landing/HowItWorksSection.tsx`
- Test: `src/test/landing/HowItWorksSection.test.tsx`

- [ ] **Step 1: Add IntersectionObserver mock to setup.ts**

Framer Motion's `whileInView` uses `IntersectionObserver`, which doesn't exist in jsdom. Without a mock every component test will throw. Open `src/test/setup.ts` and append:

```ts
// Mock IntersectionObserver for Framer Motion whileInView
global.IntersectionObserver = class IntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof IntersectionObserver;
```

Full file after edit:

```ts
import "@testing-library/jest-dom";

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Mock IntersectionObserver for Framer Motion whileInView
global.IntersectionObserver = class IntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof IntersectionObserver;
```

- [ ] **Step 2: Write the failing test**

Create `src/test/landing/HowItWorksSection.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import HowItWorksSection from "@/components/landing/HowItWorksSection";

describe("HowItWorksSection", () => {
  it("renders the section headline", () => {
    render(<HowItWorksSection />);
    expect(
      screen.getByText("Five minutes to discover 900 years.")
    ).toBeInTheDocument();
  });

  it("renders all 3 step card headings", () => {
    render(<HowItWorksSection />);
    expect(screen.getByText("Enter Your Name")).toBeInTheDocument();
    expect(screen.getByText("Your Legacy Unfolds")).toBeInTheDocument();
    expect(screen.getByText("Pass It On")).toBeInTheDocument();
  });

  it("renders step numbers 1, 2, 3", () => {
    render(<HowItWorksSection />);
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run test — confirm it fails**

```bash
npx vitest run src/test/landing/HowItWorksSection.test.tsx
```

Expected: FAIL — `Cannot find module '@/components/landing/HowItWorksSection'`

- [ ] **Step 4: Create `src/components/landing/HowItWorksSection.tsx`**

```tsx
import { motion } from "framer-motion";

const STEPS = [
  {
    num: "1",
    heading: "Enter Your Name",
    body: "Type your surname. Our AI searches centuries of history — origins, migration, and ancestral role.",
  },
  {
    num: "2",
    heading: "Your Legacy Unfolds",
    body: "Your custom crest is forged, your bloodline mapped, your family story written by AI.",
  },
  {
    num: "3",
    heading: "Pass It On",
    body: "Download, gift, or display your legacy. Physical products shipped worldwide.",
  },
] as const;

const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" } as const,
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

const HowItWorksSection = () => (
  <motion.section {...reveal} className="py-16 text-center">
    <p className="mb-3 text-[10px] uppercase tracking-[4px] text-amber-dim">
      The Journey
    </p>
    <h2 className="font-display text-3xl text-cream-warm sm:text-4xl">
      Five minutes to discover 900 years.
    </h2>
    <p className="mx-auto mt-4 max-w-md font-serif italic text-foreground">
      Enter your surname. We do the rest.
    </p>

    <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
      {STEPS.map((step, i) => (
        <motion.div
          key={step.num}
          {...reveal}
          transition={{ ...reveal.transition, delay: i * 0.08 }}
          className="rounded-lg border border-gold-line bg-card p-6"
        >
          <div
            className="mx-auto mb-4 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-amber"
            style={{
              background: "rgba(232,148,58,0.10)",
              border: "1px solid rgba(232,148,58,0.30)",
            }}
          >
            {step.num}
          </div>
          <h3 className="mb-2 font-display text-lg text-cream">{step.heading}</h3>
          <p
            className="text-sm leading-relaxed"
            style={{ color: "hsl(var(--text-dim))" }}
          >
            {step.body}
          </p>
        </motion.div>
      ))}
    </div>
  </motion.section>
);

export default HowItWorksSection;
```

- [ ] **Step 5: Run test — confirm it passes**

```bash
npx vitest run src/test/landing/HowItWorksSection.test.tsx
```

Expected: PASS — 3 tests passing

- [ ] **Step 6: Commit**

```bash
git add src/test/setup.ts src/components/landing/HowItWorksSection.tsx src/test/landing/HowItWorksSection.test.tsx
git commit -m "feat: add HowItWorksSection with scroll-reveal step cards"
```

---

## Task 2: ProductPreviewSection

**Files:**
- Create: `src/components/landing/ProductPreviewSection.tsx`
- Test: `src/test/landing/ProductPreviewSection.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/test/landing/ProductPreviewSection.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import ProductPreviewSection from "@/components/landing/ProductPreviewSection";

describe("ProductPreviewSection", () => {
  it("renders the section headline", () => {
    render(<ProductPreviewSection />);
    expect(
      screen.getByText("Your complete family legacy, delivered instantly.")
    ).toBeInTheDocument();
  });

  it("renders all 4 product card headings", () => {
    render(<ProductPreviewSection />);
    expect(screen.getByText("Custom Coat of Arms")).toBeInTheDocument();
    expect(screen.getByText("AI Family Story")).toBeInTheDocument();
    expect(screen.getByText("Bloodline Tree")).toBeInTheDocument();
    expect(screen.getByText("Legacy Certificate")).toBeInTheDocument();
  });

  it("renders the $29 price", () => {
    render(<ProductPreviewSection />);
    expect(screen.getByText("$29")).toBeInTheDocument();
  });

  it("renders the one-time delivery note", () => {
    render(<ProductPreviewSection />);
    expect(
      screen.getByText("One-time · Instant digital delivery · No subscription")
    ).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test — confirm it fails**

```bash
npx vitest run src/test/landing/ProductPreviewSection.test.tsx
```

Expected: FAIL — `Cannot find module '@/components/landing/ProductPreviewSection'`

- [ ] **Step 3: Create `src/components/landing/ProductPreviewSection.tsx`**

```tsx
import { motion } from "framer-motion";

const PRODUCTS = [
  {
    icon: "🛡",
    heading: "Custom Coat of Arms",
    body: "A unique crest forged from your surname's history, symbolism, and ancestral role. High-res PNG + SVG.",
  },
  {
    icon: "📖",
    heading: "AI Family Story",
    body: "Chapter I of your family narrative — written by Claude AI using real historical context from your bloodline.",
  },
  {
    icon: "🌳",
    heading: "Bloodline Tree",
    body: "Your ancestral migration mapped visually — where your family came from, and how they got here.",
  },
  {
    icon: "📜",
    heading: "Legacy Certificate",
    body: "A frameable certificate bearing your crest, motto, and lineage. Print it. Hang it. Own it.",
  },
] as const;

const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" } as const,
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

const ProductPreviewSection = () => (
  <motion.section {...reveal} className="py-16 text-center">
    <p className="mb-3 text-[10px] uppercase tracking-[4px] text-amber-dim">
      What You Get
    </p>
    <h2 className="font-display text-3xl text-cream-warm sm:text-4xl">
      Your complete family legacy, delivered instantly.
    </h2>
    <p className="mx-auto mt-4 max-w-md font-serif italic text-foreground">
      Everything in the Legacy Pack — one price, yours forever.
    </p>

    <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
      {PRODUCTS.map((product, i) => (
        <motion.div
          key={product.heading}
          {...reveal}
          transition={{ ...reveal.transition, delay: i * 0.08 }}
          className="rounded-lg border border-gold-line bg-card p-6 text-left"
        >
          <div className="mb-3 text-2xl">{product.icon}</div>
          <h3 className="mb-2 font-display text-base text-cream-soft">
            {product.heading}
          </h3>
          <p
            className="text-sm leading-relaxed"
            style={{ color: "hsl(var(--text-dim))" }}
          >
            {product.body}
          </p>
        </motion.div>
      ))}
    </div>

    {/* Price badge */}
    <div
      className="mt-8 rounded-lg px-8 py-5 text-center"
      style={{
        background: "rgba(232,148,58,0.06)",
        border: "1px solid rgba(232,148,58,0.18)",
      }}
    >
      <span className="font-display text-4xl text-amber-light">$29</span>
      <p
        className="mt-1 text-sm"
        style={{ color: "hsl(var(--text-dim))" }}
      >
        One-time · Instant digital delivery · No subscription
      </p>
    </div>
  </motion.section>
);

export default ProductPreviewSection;
```

- [ ] **Step 4: Run test — confirm it passes**

```bash
npx vitest run src/test/landing/ProductPreviewSection.test.tsx
```

Expected: PASS — 4 tests passing

- [ ] **Step 5: Commit**

```bash
git add src/components/landing/ProductPreviewSection.tsx src/test/landing/ProductPreviewSection.test.tsx
git commit -m "feat: add ProductPreviewSection with 4 cards and price badge"
```

---

## Task 3: FreeToolsSection

**Files:**
- Create: `src/components/landing/FreeToolsSection.tsx`
- Test: `src/test/landing/FreeToolsSection.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/test/landing/FreeToolsSection.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import FreeToolsSection from "@/components/landing/FreeToolsSection";

describe("FreeToolsSection", () => {
  it("renders the section headline", () => {
    render(<FreeToolsSection />);
    expect(
      screen.getByText("Curious? Start here — no commitment.")
    ).toBeInTheDocument();
  });

  it("renders all 3 tool card headings", () => {
    render(<FreeToolsSection />);
    expect(screen.getByText("Bloodline Quiz")).toBeInTheDocument();
    expect(screen.getByText("Surname Lookup")).toBeInTheDocument();
    expect(screen.getByText("Motto Generator")).toBeInTheDocument();
  });

  it("renders 3 Coming Soon badges", () => {
    render(<FreeToolsSection />);
    const badges = screen.getAllByText("Coming Soon");
    expect(badges).toHaveLength(3);
  });

  it("tool cards have no links", () => {
    render(<FreeToolsSection />);
    const links = document.querySelectorAll("a");
    expect(links).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run test — confirm it fails**

```bash
npx vitest run src/test/landing/FreeToolsSection.test.tsx
```

Expected: FAIL — `Cannot find module '@/components/landing/FreeToolsSection'`

- [ ] **Step 3: Create `src/components/landing/FreeToolsSection.tsx`**

```tsx
import { motion } from "framer-motion";

const TOOLS = [
  {
    icon: "🧬",
    heading: "Bloodline Quiz",
    body: "5 questions → your ancestry archetype. Warrior, Builder, Explorer, Healer, or Scholar.",
  },
  {
    icon: "🔍",
    heading: "Surname Lookup",
    body: "Instant meaning, origin, and historical role for any surname.",
  },
  {
    icon: "⚔️",
    heading: "Motto Generator",
    body: "Enter 3 values → get a Latin motto with English translation.",
  },
] as const;

const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" } as const,
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

const FreeToolsSection = () => (
  <motion.section {...reveal} className="py-16 text-center">
    <p className="mb-3 text-[10px] uppercase tracking-[4px] text-amber-dim">
      Free Tools
    </p>
    <h2 className="font-display text-3xl text-cream-warm sm:text-4xl">
      Curious? Start here — no commitment.
    </h2>
    <p className="mx-auto mt-4 max-w-md font-serif italic text-foreground">
      Six free tools to explore your heritage. No account needed.
    </p>

    <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
      {TOOLS.map((tool, i) => (
        <motion.div
          key={tool.heading}
          {...reveal}
          transition={{ ...reveal.transition, delay: i * 0.08 }}
          className="relative rounded-lg border border-gold-line bg-card p-6 text-left opacity-80"
          style={{ cursor: "default" }}
        >
          <span
            className="absolute right-3 top-3 rounded text-[9px] uppercase tracking-[1px] text-amber-dim"
            style={{ background: "#221c14", padding: "3px 8px" }}
          >
            Coming Soon
          </span>
          <div className="mb-3 text-xl">{tool.icon}</div>
          <h3 className="mb-2 font-display text-base text-cream-soft">
            {tool.heading}
          </h3>
          <p
            className="text-sm leading-relaxed"
            style={{ color: "hsl(var(--text-dim))" }}
          >
            {tool.body}
          </p>
        </motion.div>
      ))}
    </div>
  </motion.section>
);

export default FreeToolsSection;
```

- [ ] **Step 4: Run test — confirm it passes**

```bash
npx vitest run src/test/landing/FreeToolsSection.test.tsx
```

Expected: PASS — 4 tests passing

- [ ] **Step 5: Commit**

```bash
git add src/components/landing/FreeToolsSection.tsx src/test/landing/FreeToolsSection.test.tsx
git commit -m "feat: add FreeToolsSection with Coming Soon badges"
```

---

## Task 4: OccasionsSection

**Files:**
- Create: `src/components/landing/OccasionsSection.tsx`
- Test: `src/test/landing/OccasionsSection.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/test/landing/OccasionsSection.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import OccasionsSection from "@/components/landing/OccasionsSection";

describe("OccasionsSection", () => {
  it("renders the section headline", () => {
    render(<OccasionsSection />);
    expect(screen.getByText("The gift they'll never forget.")).toBeInTheDocument();
  });

  it("renders the 4 highlighted occasions", () => {
    render(<OccasionsSection />);
    expect(screen.getByText("Father's Day")).toBeInTheDocument();
    expect(screen.getByText("Christmas")).toBeInTheDocument();
    expect(screen.getByText("Wedding")).toBeInTheDocument();
    expect(screen.getByText("Graduation")).toBeInTheDocument();
  });

  it("renders the 8 standard occasions", () => {
    render(<OccasionsSection />);
    expect(screen.getByText("Birthday")).toBeInTheDocument();
    expect(screen.getByText("Anniversary")).toBeInTheDocument();
    expect(screen.getByText("New Baby")).toBeInTheDocument();
    expect(screen.getByText("Mother's Day")).toBeInTheDocument();
    expect(screen.getByText("Housewarming")).toBeInTheDocument();
    expect(screen.getByText("Retirement")).toBeInTheDocument();
    expect(screen.getByText("Family Reunion")).toBeInTheDocument();
    expect(screen.getByText("Valentine's Day")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test — confirm it fails**

```bash
npx vitest run src/test/landing/OccasionsSection.test.tsx
```

Expected: FAIL — `Cannot find module '@/components/landing/OccasionsSection'`

- [ ] **Step 3: Create `src/components/landing/OccasionsSection.tsx`**

```tsx
import { motion } from "framer-motion";

const HIGHLIGHTED = [
  "Father's Day",
  "Christmas",
  "Wedding",
  "Graduation",
] as const;

const STANDARD = [
  "Birthday",
  "Anniversary",
  "New Baby",
  "Mother's Day",
  "Housewarming",
  "Retirement",
  "Family Reunion",
  "Valentine's Day",
] as const;

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
      {HIGHLIGHTED.map((occasion) => (
        <span
          key={occasion}
          className="rounded-pill text-[13px] text-amber-light"
          style={{
            padding: "8px 20px",
            border: "1px solid rgba(232,148,58,0.4)",
            background: "rgba(232,148,58,0.06)",
          }}
        >
          {occasion}
        </span>
      ))}
      {STANDARD.map((occasion) => (
        <span
          key={occasion}
          className="rounded-pill border border-gold-line bg-card text-[13px] text-foreground"
          style={{ padding: "8px 20px" }}
        >
          {occasion}
        </span>
      ))}
    </div>
  </motion.section>
);

export default OccasionsSection;
```

- [ ] **Step 4: Run test — confirm it passes**

```bash
npx vitest run src/test/landing/OccasionsSection.test.tsx
```

Expected: PASS — 3 tests passing

- [ ] **Step 5: Commit**

```bash
git add src/components/landing/OccasionsSection.tsx src/test/landing/OccasionsSection.test.tsx
git commit -m "feat: add OccasionsSection with highlighted and standard occasion pills"
```

---

## Task 5: FinalCtaSection

**Files:**
- Create: `src/components/landing/FinalCtaSection.tsx`
- Test: `src/test/landing/FinalCtaSection.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/test/landing/FinalCtaSection.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect } from "vitest";
import FinalCtaSection from "@/components/landing/FinalCtaSection";

describe("FinalCtaSection", () => {
  it("renders the headline", () => {
    render(
      <MemoryRouter>
        <FinalCtaSection />
      </MemoryRouter>
    );
    expect(
      screen.getByText("Every family has a story worth telling.")
    ).toBeInTheDocument();
  });

  it("renders the subtitle", () => {
    render(
      <MemoryRouter>
        <FinalCtaSection />
      </MemoryRouter>
    );
    expect(
      screen.getByText(
        "Yours has been waiting centuries. It takes five minutes to discover it."
      )
    ).toBeInTheDocument();
  });

  it("renders a link to /journey", () => {
    render(
      <MemoryRouter>
        <FinalCtaSection />
      </MemoryRouter>
    );
    const link = screen.getByRole("link", { name: /begin your journey/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/journey");
  });
});
```

- [ ] **Step 2: Run test — confirm it fails**

```bash
npx vitest run src/test/landing/FinalCtaSection.test.tsx
```

Expected: FAIL — `Cannot find module '@/components/landing/FinalCtaSection'`

- [ ] **Step 3: Create `src/components/landing/FinalCtaSection.tsx`**

```tsx
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" } as const,
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

const FinalCtaSection = () => (
  <motion.section
    {...reveal}
    className="py-20 text-center"
    style={{ borderTop: "1px solid rgba(232,148,58,0.15)" }}
  >
    <p className="mb-3 text-[10px] uppercase tracking-[4px] text-amber-dim">
      Your Legacy Awaits
    </p>
    <h2 className="font-display text-3xl text-cream-warm sm:text-4xl lg:text-5xl">
      Every family has a story worth telling.
    </h2>
    <p className="mx-auto mt-4 max-w-md font-serif italic text-foreground">
      Yours has been waiting centuries. It takes five minutes to discover it.
    </p>
    <Link
      to="/journey"
      className="mt-10 inline-block rounded-pill px-10 py-4 text-[13px] font-semibold uppercase tracking-[1.5px] text-primary-foreground"
      style={{ background: "linear-gradient(135deg, #e8943a, #c47828)" }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.background =
          "linear-gradient(135deg, #f0a848, #e8943a)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.background =
          "linear-gradient(135deg, #e8943a, #c47828)";
      }}
    >
      Begin Your Journey
    </Link>
  </motion.section>
);

export default FinalCtaSection;
```

- [ ] **Step 4: Run test — confirm it passes**

```bash
npx vitest run src/test/landing/FinalCtaSection.test.tsx
```

Expected: PASS — 3 tests passing

- [ ] **Step 5: Commit**

```bash
git add src/components/landing/FinalCtaSection.tsx src/test/landing/FinalCtaSection.test.tsx
git commit -m "feat: add FinalCtaSection with headline callback and journey link"
```

---

## Task 6: Wire all sections into Index.tsx

**Files:**
- Modify: `src/pages/Index.tsx`

- [ ] **Step 1: Run the full test suite to confirm all section tests pass**

```bash
npx vitest run src/test/landing/
```

Expected: PASS — all 5 test files, ~17 tests total

- [ ] **Step 2: Update `src/pages/Index.tsx`**

Replace the entire file with the following (hero block is unchanged — only imports and the landing sections div are added):

```tsx
import { Link } from "react-router-dom";
import CrestHero from "@/components/CrestHero";
import WarmDivider from "@/components/journey/WarmDivider";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import ProductPreviewSection from "@/components/landing/ProductPreviewSection";
import FreeToolsSection from "@/components/landing/FreeToolsSection";
import OccasionsSection from "@/components/landing/OccasionsSection";
import FinalCtaSection from "@/components/landing/FinalCtaSection";

const Index = () => {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background">
      {/* SVG grain texture overlay */}
      <svg className="pointer-events-none fixed inset-0 z-50 h-full w-full opacity-[0.018]">
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>

      {/* Ambient amber glow */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: "800px",
          height: "600px",
          background:
            "radial-gradient(ellipse at center, hsla(30, 80%, 40%, 0.08) 0%, transparent 70%)",
        }}
      />

      {/* 3D Crest Hero */}
      <div className="relative z-10 w-full max-w-4xl">
        <CrestHero />
      </div>

      {/* Hero content */}
      <div className="relative z-10 flex flex-col items-center px-6 pb-16 text-center">
        <h1 className="font-display text-3xl leading-tight tracking-tight text-cream-warm sm:text-4xl md:text-5xl lg:text-6xl">
          Every family has a story
          <br />
          worth telling.
        </h1>

        <p className="mt-6 max-w-lg font-serif text-lg italic text-cream-soft sm:text-xl">
          Discover your name. Forge your crest. Pass it on.
        </p>

        <Link
          to="/journey"
          className="mt-10 inline-block rounded-pill px-10 py-4 text-[13px] font-semibold uppercase tracking-[1.5px] text-primary-foreground transition-all duration-400"
          style={{
            background: "linear-gradient(135deg, #e8943a, #c47828)",
            transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.background =
              "linear-gradient(135deg, #f0a848, #e8943a)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.background =
              "linear-gradient(135deg, #e8943a, #c47828)";
          }}
        >
          Begin Your Journey
        </Link>
      </div>

      {/* ── Landing sections ── */}
      <div className="relative z-10 w-full max-w-4xl px-6 pb-24">
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
    </div>
  );
};

export default Index;
```

- [ ] **Step 3: Run the build to confirm no TypeScript errors**

```bash
npm run build
```

Expected: `✓ built in X.XXs` with no errors (chunk size warning is pre-existing and not a failure)

- [ ] **Step 4: Run the full test suite one final time**

```bash
npx vitest run
```

Expected: all tests pass including pre-existing tests (`legacyTypesSync`, `example`, and all 5 landing section tests)

- [ ] **Step 5: Commit and push**

```bash
git add src/pages/Index.tsx
git commit -m "feat: wire all landing sections into Index.tsx"
git push origin main
```
