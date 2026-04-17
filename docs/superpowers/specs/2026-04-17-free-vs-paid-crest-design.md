# Free vs Paid Crest Design

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show a free template crest with QR code during the journey (zero API cost), and only generate a real personalised Ideogram crest after the user pays $29.

**Architecture:** A static `FreeCrest` React component replaces the Ideogram call on Stop 4. The Stripe payment webhook triggers real crest generation server-side after purchase. `/my-legacy` shows the real crest when ready, falling back to the free template while it generates.

**Tech Stack:** React, TypeScript, qrcode.react (QR generation), Supabase Edge Functions, Ideogram API, Stripe webhook

---

## Components

### New: `src/components/FreeCrest.tsx`
Renders the free template crest. Takes `surname` and `legacyUrl` as props.
- Base image: `/crest.png` (static, already in public/)
- Surname overlaid on the banner using CSS absolute positioning (covers "ANCESTOR" text)
- QR code overlaid on the shield centre using `qrcode.react`
- QR links to `legacyUrl` (e.g. `https://ancestorsqr.com/f/:surname`)
- No API calls, no props beyond surname + URL

### Modified: `src/pages/journey/Stop4CrestForge.tsx`
- Remove the `useCrest` / `fetchCrest` call entirely
- Render `<FreeCrest surname={surname} legacyUrl={...} />` directly
- Remove loading/forge states (no async wait needed)
- Keep motto, symbolism cards, and CTA below the crest unchanged

### Modified: `src/contexts/JourneyContext.tsx`
- Remove `runCrestFetch()` call that fires after facts load
- `surname_crests` is no longer written during the free journey

### Modified: `supabase/functions/payments-webhook/index.ts`
After recording the purchase and saving the surname to profile, call the `generate-crest` edge function:
```
POST /functions/v1/generate-crest
{ surname, facts }
```
Facts are fetched from `surname_facts` table (already done for the confirmation email). This runs async — a failure is non-fatal (logged, user gets the crest on next `/my-legacy` load).

### Modified: `src/pages/MyLegacy.tsx`
- If `surname_crests` has a real crest → show it (existing behaviour)
- If no real crest yet but user has paid → show `<FreeCrest>` as placeholder + "Your crest is being forged…" message, poll every 5s up to 60s
- If crest arrives during polling → swap in the real crest with a fade animation

---

## Data Flow

```
Free journey:
  Stop4CrestForge → FreeCrest component (static, no API)
  surname_crests: empty

After payment:
  Stripe → payments-webhook → fetch facts from surname_facts
                             → POST generate-crest edge function
                             → Ideogram API → remove.bg → upload to storage
                             → write surname_crests row

/my-legacy:
  Check surname_crests → real crest if exists
                       → FreeCrest + poll if not yet ready
```

---

## Error Handling

- Webhook crest generation failure: non-fatal, logged. User sees FreeCrest on `/my-legacy` until they refresh or polling picks it up.
- Polling timeout (60s): stop polling, show FreeCrest permanently with "Contact us if your crest hasn't appeared" message.
- Missing facts at webhook time: skip crest generation, log warning. User can trigger manually from `/my-legacy`.

---

## What Does NOT Change

- `generate-crest` edge function itself — no changes needed
- `surname_facts` table — unchanged
- Free tools, share page, landing page crest — unchanged
- Stripe checkout flow — unchanged
- The real crest on `/my-legacy` once generated — unchanged

---

## QR Code Library

Use `qrcode.react` (already common in React/Vite projects):
```bash
npm install qrcode.react
```
Render as SVG at ~80px, dark amber `#d4a04a` on transparent background, positioned over the shield centre of `crest.png`.

---

## Shield QR Position

`crest.png` is 612×408px. The shield centre is approximately at 50% horizontal, 52% vertical. The QR overlay in `FreeCrest` uses `position: absolute` with `top: 32%`, `left: 50%`, `transform: translate(-50%, -50%)`, `width: 22%`.

Banner overlay (to cover "ANCESTOR"): `position: absolute`, `bottom: 14%`, `left: 50%`, `transform: translateX(-50%)`, white/cream text in Libre Caslon Display matching the crest style.
