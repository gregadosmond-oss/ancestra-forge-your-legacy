# Phase 1 — Journey Prototype Design

**Date:** 2026-04-14
**Status:** Draft — awaiting founder review
**Scope:** Clickable prototype of the 6-stop Ancestra journey with mock data and full cinematic polish. No AI, no Stripe, no database writes.

---

## Context

Ancestra's core product is a linear 6-stop journey that takes a user from entering their surname to being asked to pass a family legacy on. The journey is the paid funnel — everything else in the product (free tools, shop, email) feeds into it or flows out of it. Nothing ships without this journey working.

Building the whole journey end-to-end with real AI, real genealogy data, real image generation, and real payments in one pass is too big for a single spec. Phase 1 strips all of that out: every page is built, every transition is wired, every piece of copy is real, but the content is hard-coded mock data for a single family (Osmond — the founder's own line, already researched in `CLAUDE.md`).

The goal of Phase 1 is to **judge the emotional arc** of the journey. If clicking through the finished prototype feels like pride-and-discovery, we know the UX works and we wire up the AI pipeline in Phase 2. If it feels flat, we iterate the UX before paying for a single Claude API call.

This is the first spec in a six-phase roadmap:

1. **Phase 1 (this spec):** Clickable prototype of all 6 stops, mock Osmond data, full cinematic polish.
2. **Phase 2:** Replace mock content with live Claude API calls (surname meaning, motto, story, symbolism). Edge function + prompt engineering. Still no image generation, still no family tree API.
3. **Phase 3:** AI crest image generation, stored in Lovable Cloud storage.
4. **Phase 4:** FamilySearch API for real ancestor data.
5. **Phase 5:** Stripe paywall on Stop 5, Resend-based Legacy Pack delivery.
6. **Phase 6:** Stop 6 gift + share flow wired to real email / Stripe.

Each later phase is its own spec + plan + build.

---

## Architecture

### Routes

Added to `src/App.tsx` above the catch-all route:

- `/journey` → `Navigate` redirect to `/journey/1`
- `/journey/1` → Stop 1 (enter your name)
- `/journey/2` → Stop 2 (name meaning)
- `/journey/3` → Stop 3 (bloodline tree)
- `/journey/4` → Stop 4 (crest forge + reveal)
- `/journey/5` → Stop 5 (story + paywall)
- `/journey/6` → Stop 6 (pass it on)

The existing `/` landing page is unchanged **except** the "Begin Your Journey" button on `src/pages/Index.tsx` becomes a `<Link to="/journey">` wrapper.

Browser back/forward work naturally between stops. Deep-linking to any stop works — useful for testing.

### File layout

```
src/
  pages/
    Index.tsx                          # existing — only CTA link added
    journey/
      JourneyLayout.tsx                # shared wrapper: grain, glow, step counter, route-level fade
      Stop1EnterName.tsx
      Stop2NameMeaning.tsx
      Stop3Bloodline.tsx
      Stop4CrestForge.tsx
      Stop5Story.tsx
      Stop6PassItOn.tsx
  components/
    journey/
      SectionLabel.tsx                 # 10px uppercase, letter-spaced, amber-dim
      CinematicHeading.tsx             # Libre Caslon h1 with stagger-in
      WarmDivider.tsx                  # line-dot-line amber divider (matches CLAUDE.md)
      StaggerGroup.tsx                 # children fade-up with configurable delay
      TypewriterText.tsx               # letter-by-letter reveal with skip-on-click
      ForgeLoader.tsx                  # Stop 4's cycling loader messages
      BloodlineTree.tsx                # vertical generation list with amber connector line
      ProductCard.tsx                  # Stop 6 product tile
  data/
    osmondMock.ts                      # single source of truth for Phase 1 content
```

All new component code; no existing components modified except `Index.tsx` (CTA link) and `App.tsx` (new routes).

### State and data flow

Phase 1 has no real user data to pass between stops — every stop reads from `osmondMock.ts`. The surname input on Stop 1 is accepted but ignored: clicking `DISCOVER MY LEGACY` just navigates to `/journey/2`. No React context, no URL params, no localStorage in Phase 1.

Phase 2 will introduce a `JourneyProvider` context (or URL-param surname) to replace the hard-coded import. The UI shape stays the same — only the data source changes.

### Transitions

**Page-level** (route change): shared `<AnimatePresence>` in `JourneyLayout.tsx` runs an 800 ms fade + 8 px vertical shift on route swap, easing `cubic-bezier(0.22, 1, 0.36, 1)`.

**Element-level** (within a stop): `<StaggerGroup>` wraps children and applies 120–180 ms cascaded fade-up entries. Specific per-stop variations (typewriter, forge loader, crest glow-in, tree generation reveal) live in dedicated components.

### Dependencies

- Add: `framer-motion` (~60 kb gz). Industry-standard React animation library. Used for `AnimatePresence`, cascaded variants, typewriter timing.
- Nothing else added. No routing library change (React Router already installed). No UI kit addition.

### Fonts

Libre Caslon Display + Libre Caslon Text + DM Sans loaded from Google Fonts. Add `<link>` tags to `index.html`. Tailwind `font-display`, `font-serif`, `font-sans` already map to the right families in the existing Tailwind config per the current Index.tsx.

---

## Mock data shape

Defined in `src/data/osmondMock.ts`. This shape is the contract the Phase 2 Claude API must satisfy — building the UI against it locks the schema.

```ts
export type Generation = {
  name: string;
  years: string;       // "1688–1742"
  location: string;    // "Piddletrenthide, Dorset"
  role?: string;       // "Hayward"
  isYou?: boolean;     // highlight gold on the tree
};

export type Migration = {
  from: string;
  to: string;
  year: string;        // "c. 1820"
};

export type SymbolismBreakdown = {
  element: string;     // "Eagle"
  meaning: string;     // "Vigilance and strength"
};

export type Chapter = {
  number: string;      // "I"
  title: string;
  body?: string;       // present only for Chapter I in Phase 1
};

export type Product = {
  id: string;
  name: string;
  price: number;
  image: string;       // path under /public
  occasion: string;    // "Father's Day"
};

export type FamilyLegacy = {
  surname: string;
  meaning: string;
  origin: string;
  originYear: string;
  ancestralRole: string;
  historicalQuote: string;
  tree: Generation[];                // 6–8 entries, oldest first, last has isYou: true
  migration: Migration;
  crestImage: string;                // "/crest.png"
  mottoLatin: string;
  mottoEnglish: string;
  symbolism: SymbolismBreakdown[];   // 3–4 entries
  chapters: Chapter[];               // 9 entries; chapters[0] has full body, rest title-only
  recommendedProducts: Product[];    // 3 entries
};

export const osmondMock: FamilyLegacy = { /* fully populated */ };
```

Content populated from `CLAUDE.md` founder story plus reasonable fill for Chapter I body, symbolism breakdowns, and 3 mock product cards referencing existing assets in `/public`.

---

## Per-stop specification

### Shared elements (all stops)

- Grain SVG overlay (reused from Index.tsx).
- Ambient amber radial glow behind content.
- Step counter in top-right: `03 / 06` in amber-dim 10 px uppercase, letter-spacing 4 px.
- All copy uses Fireside Luxury palette. No cold colours, no pure white, no pure black.
- All buttons are pill-shaped (border-radius 60 px).

### Stop 1 — Enter Your Name

- Section label: `BEGIN YOUR LEGACY`
- Headline: "Enter your name."
- Italic sub: "Every family has a story. Yours is waiting."
- Input: surname field, pill shape, large text, amber focus ring. Placeholder: "e.g. Osmond".
- Optional expander ("+ add more details"): parents, country, birth year. Collapsed by default.
- CTA: `DISCOVER MY LEGACY` (honey-orange pill).
- Entry animation: headline → sub → input → CTA, 120 ms stagger.
- On submit: ignore input, fade out, navigate to `/journey/2`.

### Stop 2 — Your Name Has a Story

- Section label: `CHAPTER ONE`
- Large display surname: "OSMOND" (Libre Caslon, cream-warm).
- Staggered reveals (400 ms apart):
  - `meaning` → "Divine Protector"
  - `origin` → "Dorset, England"
  - `originYear` → "Since 1066"
  - `ancestralRole` → "Hayward — Land managers and protectors"
- Amber italic quote block (from `historicalQuote`), bordered top and bottom by `WarmDivider`.
- CTA: `MEET YOUR BLOODLINE`.

### Stop 3 — Meet Your Bloodline

- Section label: `YOUR BLOODLINE`
- Headline: "The line that led to you."
- Vertical `<BloodlineTree>` component: each generation is a card (name / years / location / role). Cards connected by thin amber vertical line. Fade-up stagger, oldest first, 180 ms apart.
- Final card (the `isYou: true` entry) renders larger, with amber glow behind, "YOU" label above.
- Migration badge: pill with amber border, format "Dorset, England → Newfoundland, c. 1820". Placed under the tree.
- CTA: `FORGE YOUR CREST`.

### Stop 4 — Your Crest is Forged

- Section label: `THE FORGE`
- `<ForgeLoader>` runs on mount (~3.5 s): three messages cycle with amber pulse:
  - "Consulting the archives…"
  - "Melting the gold…"
  - "Inscribing the motto…"
- Loader exits → crest reveals: opacity 0→1, scale 0.8→1, 1.2 s, warm amber radial bloom behind. Reuses existing `CrestHero` component (the 3D plane already built).
- Motto block under crest (600 ms delay after reveal):
  - Line 1: Latin motto, italic serif, amber-light.
  - Line 2: English translation, smaller, amber-dim.
- Symbolism breakdown: 4 small cards in a row, each with amber dot + element name + one-line meaning. Fade in 200 ms apart.
- CTA: `READ YOUR STORY`.

### Stop 5 — Your Story is Written

- Section label: `CHAPTER I`
- Chapter title: "The Hayward of Piddletrenthide" (Libre Caslon, amber).
- Body: `<TypewriterText>` renders Chapter I body character-by-character at ~30 ms/char. Clicking anywhere during typing reveals the full text instantly.
- When text finishes: bottom of content fades into a gradient mask. Ghosted list of Chapters II–IX (dimmed, small serif) appears below the fade.
- Paywall card: amber border, warm panel background. Contents:
  - Title: "Unlock your full Legacy Pack"
  - Bullet list: full 9 chapters · high-res crest · legacy certificate · family tree print · ancestor chat
  - Price: "$29"
  - CTA: `SEE THE FULL LEGACY` (honey-orange pill)
- Under CTA: small italic note, amber-dim: *prototype mode — payment skipped.*
- On CTA click: fade, navigate to `/journey/6` as if payment succeeded.

### Stop 6 — Pass It On

- Section label: `PASS IT ON`
- Headline: "Who in your family needs to see this?"
- Three action blocks stacked vertically, each with `WarmDivider` between them:
  1. **Send a free preview** — email input + `SEND PREVIEW` button. Click triggers a toast (sonner): "Preview sent to [email]."
  2. **Gift the Legacy Pack ($29)** — single `GIFT THE LEGACY` button. Click triggers toast: "Gift flow — launching soon."
  3. **Gift a physical keepsake** — three `<ProductCard>` tiles (framed crest, beer mug, Christmas ornament). Each card shows image, name, price, occasion chip. Each has a `GIFT THIS` button. Click triggers toast: "Shop launches soon."
- Footer line, centred italic amber-dim: "An Ancestra Original."
- No CTA to move forward. This is the end of the journey.

---

## Error handling

Minimal for a prototype:

- Every stop mounts with complete mock data — no loading states for missing data.
- `/journey/anything-else` falls through to the existing `NotFound` page.
- Stop 1 input accepts any text; empty submit is allowed (still navigates forward since content is mocked regardless).

---

## Testing

Phase 1 verification is **manual**, not automated. The goal is to judge emotional arc, which can only be done by clicking through.

Manual test checklist (to run after implementation):

- [ ] Click "Begin Your Journey" on `/` → lands on Stop 1.
- [ ] Each of Stops 1–5 has working CTA → navigates to next stop.
- [ ] Stop 6 has no forward CTA.
- [ ] Browser back button moves back a stop without errors.
- [ ] Refresh on any stop re-renders that stop correctly (content is deterministic).
- [ ] All animations play once per stop visit.
- [ ] Typewriter on Stop 5 skips to full text when clicked during typing.
- [ ] Toast appears on each of the three Stop 6 buttons.
- [ ] No console errors.
- [ ] Fireside Luxury palette — no cold blues, no pure white, no pure black anywhere.
- [ ] Mouse-move on every page still tilts the crest where rendered (Stop 4 reuses `CrestHero`).

Unit / component tests are out of scope for Phase 1. Animation logic and visual correctness are not meaningfully testable without Playwright-style visual regression, which is deferred.

---

## Out of scope for Phase 1

Called out explicitly so Phase 2 planning inherits clean boundaries:

- Claude API calls for any content.
- Image generation for crests.
- FamilySearch / any genealogy API.
- Stripe checkout or any payment infrastructure.
- Lovable Cloud Auth. All Phase 1 routes are publicly accessible.
- Database writes. `profiles` and `crests` tables already exist but are untouched in Phase 1.
- Email (Resend) or email marketing (Kit) wiring.
- Real product pages, shop routes, `/shop`, `/gifts/*`.
- Free-tool pages (`/tools/*`).
- User surname customisation — Stop 1 input is ignored.
- Multi-family data. Only Osmond exists.
- Responsive polish beyond reasonable defaults — desktop-first. Mobile polish sweep happens after emotional arc is validated.
- SEO, meta tags, Open Graph cards.
- Analytics events.

---

## Success criteria

Phase 1 is done when:

1. Every stop renders correctly at `/journey/N`.
2. Every CTA advances to the next stop (except Stop 6).
3. All animations listed above play on each stop visit.
4. Greg (founder) clicks through the journey and reports that the emotional arc feels like pride-and-discovery. That single qualitative check is the ship gate — no other metric matters at this stage.

If that qualitative check fails, Phase 1 is iterated on (copy, timing, layout) before Phase 2 begins. If it passes, we move to Phase 2 and replace the mock data source with the AI pipeline.
