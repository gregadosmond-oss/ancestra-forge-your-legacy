# Entry Portal + Ambient Audio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a fullscreen entry portal (crest + headline + pulsing CTA) that fades out on click, starts ambient audio, and persists a sound toggle across all pages.

**Architecture:** `EntryPortal` is a pure presentational component. `AppLayout` owns all state — portal visibility (sessionStorage), audio ref, mute state — and renders both the portal overlay and the fixed sound toggle. Page content renders underneath the portal so the hero video starts loading immediately.

**Tech Stack:** React 18, TypeScript, Framer Motion (AnimatePresence), Vitest + React Testing Library

---

### Task 1: Create `EntryPortal` component + tests

**Files:**
- Create: `src/components/EntryPortal.tsx`
- Create: `src/test/EntryPortal.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `src/test/EntryPortal.test.tsx`:

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import EntryPortal from "@/components/EntryPortal";

describe("EntryPortal", () => {
  it("renders the crest image", () => {
    render(<EntryPortal onEnter={() => {}} />);
    expect(screen.getByAltText("Ancestra crest")).toBeInTheDocument();
  });

  it("renders the welcome headline", () => {
    render(<EntryPortal onEnter={() => {}} />);
    expect(screen.getByText("Welcome to Ancestra")).toBeInTheDocument();
  });

  it("renders the Begin Your Journey button", () => {
    render(<EntryPortal onEnter={() => {}} />);
    expect(screen.getByRole("button", { name: /begin your journey/i })).toBeInTheDocument();
  });

  it("calls onEnter when button is clicked", () => {
    const onEnter = vi.fn();
    render(<EntryPortal onEnter={onEnter} />);
    fireEvent.click(screen.getByRole("button", { name: /begin your journey/i }));
    expect(onEnter).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/test/EntryPortal.test.tsx
```

Expected: FAIL — `Cannot find module '@/components/EntryPortal'`

- [ ] **Step 3: Create `EntryPortal.tsx`**

Create `src/components/EntryPortal.tsx`:

```tsx
import { motion } from "framer-motion";

interface EntryPortalProps {
  onEnter: () => void;
}

const EntryPortal = ({ onEnter }: EntryPortalProps) => (
  <motion.div
    initial={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
    className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
    style={{
      background: "radial-gradient(ellipse at center, #1a1208 0%, #0d0a07 70%)",
    }}
  >
    {/* Crest */}
    <img
      src="/crest.png"
      alt="Ancestra crest"
      style={{
        width: "180px",
        height: "auto",
        filter: "drop-shadow(0 0 28px rgba(212,160,74,0.35))",
      }}
    />

    {/* Headline */}
    <p
      className="mt-8 font-serif text-2xl italic"
      style={{ color: "#e8b85c" }}
    >
      Welcome to Ancestra
    </p>

    {/* CTA button with pulse */}
    <button
      onClick={onEnter}
      className="mt-10 rounded-pill px-12 py-4 font-sans text-[13px] font-semibold uppercase tracking-[1.5px]"
      style={{
        background: "linear-gradient(135deg, #e8943a, #c47828)",
        color: "#1a1208",
        animation: "portalPulse 2.5s ease-in-out infinite",
      }}
    >
      Begin Your Journey
    </button>

    <style>{`
      @keyframes portalPulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(232,148,58,0); }
        50% { box-shadow: 0 0 0 18px rgba(232,148,58,0.18); }
      }
    `}</style>
  </motion.div>
);

export default EntryPortal;
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run src/test/EntryPortal.test.tsx
```

Expected: 4 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/EntryPortal.tsx src/test/EntryPortal.test.tsx
git commit -m "feat: add EntryPortal — fullscreen crest portal with pulsing CTA"
```

---

### Task 2: Update `AppLayout.tsx` — portal state + audio + sound toggle

**Files:**
- Modify: `src/components/AppLayout.tsx`
- Modify: `src/test/AppLayout.test.tsx`

- [ ] **Step 1: Add new tests for portal and sound toggle**

Open `src/test/AppLayout.test.tsx` and add these tests after the existing ones:

```tsx
// Add this import at the top with the others:
// import { fireEvent } from "@testing-library/react";

describe("AppLayout — entry portal", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("shows portal when sessionStorage key is not set", () => {
    renderAt("/");
    expect(screen.getByText("Welcome to Ancestra")).toBeInTheDocument();
  });

  it("hides portal when sessionStorage key is already set", () => {
    sessionStorage.setItem("ancestra_entered", "1");
    renderAt("/");
    expect(screen.queryByText("Welcome to Ancestra")).not.toBeInTheDocument();
  });
});

describe("AppLayout — sound toggle", () => {
  it("shows sound toggle after portal is dismissed", () => {
    sessionStorage.setItem("ancestra_entered", "1");
    renderAt("/");
    expect(screen.getByLabelText("Toggle sound")).toBeInTheDocument();
  });

  it("hides sound toggle when portal is showing", () => {
    sessionStorage.clear();
    renderAt("/");
    expect(screen.queryByLabelText("Toggle sound")).not.toBeInTheDocument();
  });
});
```

The full updated test file should look like this (complete replacement):

```tsx
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { describe, it, expect, beforeEach } from "vitest";
import AppLayout from "@/components/AppLayout";

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="*" element={<div>page content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );

describe("AppLayout — navbar", () => {
  beforeEach(() => sessionStorage.setItem("ancestra_entered", "1"));

  it("renders the Ancestra logo", () => {
    renderAt("/");
    expect(screen.getByText("Ancestra")).toBeInTheDocument();
  });

  it("renders all nav links", () => {
    renderAt("/");
    expect(screen.getByRole("link", { name: /free tools/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /shop/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /gifts/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /about/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /begin journey/i })).toBeInTheDocument();
  });

  it("Free Tools link points to /tools", () => {
    renderAt("/");
    expect(screen.getByRole("link", { name: /free tools/i })).toHaveAttribute("href", "/tools");
  });

  it("renders page content via Outlet", () => {
    renderAt("/");
    expect(screen.getByText("page content")).toBeInTheDocument();
  });
});

describe("AppLayout — back button", () => {
  beforeEach(() => sessionStorage.setItem("ancestra_entered", "1"));

  it("hides back button on landing page /", () => {
    renderAt("/");
    expect(screen.queryByLabelText("Go back")).not.toBeInTheDocument();
  });

  it("hides back button on /journey/1", () => {
    renderAt("/journey/1");
    expect(screen.queryByLabelText("Go back")).not.toBeInTheDocument();
  });

  it("shows back button on /tools/surname", () => {
    renderAt("/tools/surname");
    expect(screen.getByLabelText("Go back")).toBeInTheDocument();
  });

  it("shows back button on /journey/2", () => {
    renderAt("/journey/2");
    expect(screen.getByLabelText("Go back")).toBeInTheDocument();
  });

  it("shows back button on /shop", () => {
    renderAt("/shop");
    expect(screen.getByLabelText("Go back")).toBeInTheDocument();
  });
});

describe("AppLayout — step counter", () => {
  beforeEach(() => sessionStorage.setItem("ancestra_entered", "1"));

  it("hides step counter on non-journey pages", () => {
    renderAt("/tools/surname");
    expect(screen.queryByText(/\/ 06/)).not.toBeInTheDocument();
  });

  it("shows step counter on /journey/3", () => {
    renderAt("/journey/3");
    expect(screen.getByText("03 / 06")).toBeInTheDocument();
  });

  it("shows step counter on /journey/1", () => {
    renderAt("/journey/1");
    expect(screen.getByText("01 / 06")).toBeInTheDocument();
  });
});

describe("AppLayout — entry portal", () => {
  beforeEach(() => sessionStorage.clear());

  it("shows portal when sessionStorage key is not set", () => {
    renderAt("/");
    expect(screen.getByText("Welcome to Ancestra")).toBeInTheDocument();
  });

  it("hides portal when sessionStorage key is already set", () => {
    sessionStorage.setItem("ancestra_entered", "1");
    renderAt("/");
    expect(screen.queryByText("Welcome to Ancestra")).not.toBeInTheDocument();
  });
});

describe("AppLayout — sound toggle", () => {
  it("shows sound toggle after portal is dismissed", () => {
    sessionStorage.setItem("ancestra_entered", "1");
    renderAt("/");
    expect(screen.getByLabelText("Toggle sound")).toBeInTheDocument();
  });

  it("hides sound toggle when portal is showing", () => {
    sessionStorage.clear();
    renderAt("/");
    expect(screen.queryByLabelText("Toggle sound")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to confirm new ones fail**

```bash
npx vitest run src/test/AppLayout.test.tsx
```

Expected: existing 12 pass, new 4 fail

- [ ] **Step 3: Update `AppLayout.tsx` with portal + audio + sound toggle**

Replace the entire contents of `src/components/AppLayout.tsx` with:

```tsx
import { useRef, useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import EntryPortal from "@/components/EntryPortal";

const SESSION_KEY = "ancestra_entered";

const AppLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isLanding = location.pathname === "/";
  const journeyMatch = location.pathname.match(/^\/journey\/(\d+)$/);
  const stepNumber = journeyMatch ? journeyMatch[1] : null;
  const isJourneyStep1 = location.pathname === "/journey/1";

  const showBack = !isLanding && !isJourneyStep1;
  const showStepCounter = !!stepNumber;

  // ── Portal + audio state ──
  const [hasEntered, setHasEntered] = useState<boolean>(
    () => sessionStorage.getItem(SESSION_KEY) === "1"
  );
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Sync mute state to audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const handleEnter = () => {
    // Create and start audio on user gesture (satisfies browser autoplay policy)
    if (!audioRef.current) {
      const audio = new Audio("/starfields-within.mp3");
      audio.loop = true;
      audio.volume = 0.3;
      audio.muted = isMuted;
      audio.play().catch(() => {/* autoplay blocked — silent fail */});
      audioRef.current = audio;
    }
    sessionStorage.setItem(SESSION_KEY, "1");
    setHasEntered(true);
  };

  const toggleMute = () => setIsMuted((m) => !m);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* ── ENTRY PORTAL (fullscreen overlay) ── */}
      <AnimatePresence>
        {!hasEntered && <EntryPortal onEnter={handleEnter} />}
      </AnimatePresence>

      {/* ── GLOBAL NAVBAR ── */}
      <nav
        className="relative w-full text-center"
        style={{
          background: "#13100b",
          borderBottom: "1px solid #3d3020",
        }}
      >
        {/* Back button — top-left */}
        {showBack && (
          <button
            aria-label="Go back"
            onClick={() => navigate(-1)}
            className="absolute left-5 top-1/2 -translate-y-1/2 flex items-center justify-center transition-all duration-300"
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "50%",
              border: "1px solid rgba(212,160,74,0.2)",
              background: "rgba(212,160,74,0.04)",
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#d4a04a"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M5 12l7-7M5 12l7 7" />
            </svg>
          </button>
        )}

        {/* Step counter — top-right (journey only) */}
        {showStepCounter && (
          <div
            className="absolute right-5 top-1/2 -translate-y-1/2 font-sans text-[10px] uppercase tracking-[3px]"
            style={{ color: "#a07830" }}
          >
            {String(stepNumber).padStart(2, "0")} / 06
          </div>
        )}

        {/* Logo */}
        <Link
          to="/"
          className="inline-block pt-3 font-display text-xl uppercase"
          style={{ color: "#e8b85c", letterSpacing: "3px" }}
        >
          Ancestra
        </Link>

        {/* Links row */}
        <div
          className="flex items-center justify-center gap-8 px-8 pb-3 pt-2 font-sans text-[10px] font-semibold uppercase"
          style={{
            letterSpacing: "2px",
            borderTop: "1px solid #2a2018",
            marginTop: "10px",
          }}
        >
          <NavLink
            to="/tools"
            className="text-text-dim transition-colors duration-200 hover:text-amber"
            activeClassName="text-amber"
          >
            Free Tools
          </NavLink>
          <NavLink
            to="/shop"
            className="text-text-dim transition-colors duration-200 hover:text-amber"
            activeClassName="text-amber"
          >
            Shop
          </NavLink>
          <NavLink
            to="/gifts"
            className="text-text-dim transition-colors duration-200 hover:text-amber"
            activeClassName="text-amber"
          >
            Gifts
          </NavLink>
          <NavLink
            to="/about"
            className="text-text-dim transition-colors duration-200 hover:text-amber"
            activeClassName="text-amber"
          >
            About
          </NavLink>
          <Link
            to="/journey"
            className="transition-colors duration-200 hover:opacity-80"
            style={{ color: "#e8943a" }}
          >
            Begin Journey →
          </Link>
        </div>
      </nav>

      {/* ── PAGE CONTENT ── */}
      <div className="flex-1">
        <Outlet />
      </div>

      {/* ── SOUND TOGGLE (fixed bottom-right, only after portal dismissed) ── */}
      {hasEntered && (
        <button
          aria-label="Toggle sound"
          onClick={toggleMute}
          className="fixed bottom-5 right-5 z-40 flex items-center justify-center transition-opacity duration-200 hover:opacity-70"
          style={{
            width: "32px",
            height: "32px",
          }}
        >
          {isMuted ? (
            // Speaker muted icon
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d4a04a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <line x1="23" y1="9" x2="17" y2="15" />
              <line x1="17" y1="9" x2="23" y2="15" />
            </svg>
          ) : (
            // Speaker on icon
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d4a04a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            </svg>
          )}
        </button>
      )}
    </div>
  );
};

export default AppLayout;
```

- [ ] **Step 4: Run full test suite**

```bash
npx vitest run
```

Expected: All tests pass (63 existing + 4 new portal/sound = 67 total... note: existing AppLayout tests now use `beforeEach` to set sessionStorage so they still pass)

- [ ] **Step 5: Commit**

```bash
git add src/components/AppLayout.tsx src/test/AppLayout.test.tsx
git commit -m "feat: add entry portal, ambient audio, and sound toggle to AppLayout"
```

---

## Self-Review

**Spec coverage:**
- ✅ Fullscreen dark overlay portal — EntryPortal
- ✅ Crest 180px + amber glow — EntryPortal
- ✅ "Welcome to Ancestra" italic serif headline — EntryPortal
- ✅ "Begin Your Journey" button with pulse animation — EntryPortal
- ✅ Deep dark gradient background — EntryPortal
- ✅ Audio starts on click (browser autoplay compliant) — AppLayout handleEnter
- ✅ `/starfields-within.mp3`, loop, volume 0.3 — AppLayout handleEnter
- ✅ Portal fades out with Framer Motion ~1s — EntryPortal exit animation
- ✅ Sound toggle fixed bottom-right, 32px, amber SVG speaker icon — AppLayout
- ✅ Mute/unmute toggles audio.muted — AppLayout toggleMute + useEffect
- ✅ Audio persists across navigation (ref lives in AppLayout) — AppLayout audioRef
- ✅ Portal only shows once per session (sessionStorage) — AppLayout hasEntered
- ✅ Audio state in AppLayout only — no other files modified
- ✅ Tests for EntryPortal — Task 1
- ✅ Tests for portal/sound toggle in AppLayout — Task 2

**Placeholder scan:** None.

**Type consistency:** `EntryPortal` receives `onEnter: () => void`, called identically in AppLayout as `handleEnter`.
