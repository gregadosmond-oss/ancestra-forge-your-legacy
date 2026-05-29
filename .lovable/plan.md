# Plan — Personalized 42-page Legacy Book

## Goal
Keep the printed interior at ≤42 pages (Gelato spec) but make the chapters genuinely about the buyer's real ancestors and memories — not a surname-only narrative with appended sections.

---

## 1. Page budget (target = 42)

Current 42-page layout (approx):
- Title + colophon: 2
- Dedication: 1
- Table of Contents: 1
- Chapter I (drop-cap opener, ~2pp prose) + ruled notes (2): 4
- Chapters II–IX (8 chapters × ~2pp prose + 2pp ruled notes each): 32
- Certificate / closing: 2

≈ 42pp, but ~18 of those are blank ruled "Notes & Memories" filler.

Proposed 42-page layout (filler removed, real content woven in):
| Section | Pages |
|---|---|
| Title page + colophon | 2 |
| Dedication ("For the House of X") | 1 |
| Table of Contents | 1 |
| Chapter I — opener (drop cap, ~3pp) | 3 |
| Chapters II–VIII (7 chapters × ~3pp woven prose) | 21 |
| Chapter IX — closing chapter, weaves living memories | 4 |
| "Your Bloodline" — compact 1-page tree/list (names, dates, places) | 1 |
| "In Their Words" — compact prose section (woven memories, ~4pp) | 4 |
| Certificate of Legacy | 1 |
| Blank back matter | 4 (binding buffer / endpapers) |
| **Total** | **42** |

Recommendation: **keep both** the compact Bloodline page and the In Their Words section, but inline. The chapters reference real ancestors by name; the compact sections at the back serve as a "reference index" so the reader can locate names/dates without breaking narrative flow. Drops the 18pp of ruled filler entirely.

If budget gets tight, the 4 blank back pages absorb overflow; Gelato is fine with up to 42 and we have headroom.

---

## 2. What changes in generation

### Story generation becomes per-user
- New edge function `generate-personal-story({ user_id })`:
  - Loads `profiles.surname`, all `family_tree_members`, all `family_memories`, and the shared surname facts (origin, migration, motto) from `surname_facts` as historical scaffolding.
  - Sends Claude a system prompt: "Write a 9-chapter family legacy in the House of X voice. You MUST weave these named ancestors (with their real dates/places) into the historical arc where they fit chronologically. You MUST reference these family memories in Chapter IX. Do not invent named individuals, dates, or places beyond what is provided. Connective tissue (sensory detail, atmosphere) is allowed; new factual claims about real people are not."
  - Returns `{ chapterOneTitle, chapterOneBody, chapters: [{title, body}] × 8 }`.

### Caching — per-user, invalidates on data change
- New table `personal_legacy_stories`:
  - `user_id` PK, `signature` (hash of `tree.updated + memories.updated + surname`), `chapters` jsonb, `model`, `updated_at`.
- On invoke: compute signature, return cached if match, else regenerate.
- Trigger regeneration lazily on book/novel assembly (same pattern as `weave-memories-chapter`).

### What we keep vs drop
- **Drop**: surname-only `generate-legacy` story output from the printed book path (still used for free `/journey/5` preview where the user isn't paid/personal yet).
- **Drop**: ruled "Notes & Memories" filler pages in `render-legacy-book-pdf` `buildHtml`.
- **Keep**: `weave-memories-chapter` (the In Their Words prose) — still used for the compact back section and `/novel`.
- **Keep**: surname facts/motto/migration — used as historical scaffolding for Claude.

### Files touched (no edits yet)
- NEW: `supabase/functions/generate-personal-story/index.ts`
- NEW migration: `personal_legacy_stories` table + grants + RLS
- EDIT: `supabase/functions/assemble-legacy-payload/index.ts` — fetch personal story alongside woven memories
- EDIT: `supabase/functions/render-legacy-book-pdf/index.ts` — `buildHtml`: remove ruled-notes pages, render personal chapters when present (fall back to shared surname story only if personal generation fails), add compact Bloodline + In Their Words back sections
- EDIT: `src/pages/Novel.tsx` — same source switch (personal chapters when available)

---

## 3. AI cost implications

Current: 1 Claude call per **surname** (shared cache across all users of that surname) — effectively near-zero marginal cost.

New:
- 1 Claude call per **user** for the 9-chapter personal story (~6–10k output tokens, Sonnet 4.5). Rough cost: **$0.10–0.20 per user**, regenerated only when their tree or memories change.
- Existing `weave-memories-chapter` already runs per-user (~$0.02).
- Total per book: **~$0.15–0.25**, vs $99 sale price — negligible.

Mitigations baked in:
- Signature-based cache means edits/re-renders are free.
- Only triggered lazily (on `/novel` view or book assembly), not at signup.
- Surname facts (motto, migration, origin) remain shared-cached — Claude only writes the narrative, not the historical scaffolding.

---

## 4. Open recommendation
Go with the layout in §1: woven chapters + compact 1-page Bloodline + 4-page In Their Words at the back. It gives readers a narrative *and* a reference, fits 42pp comfortably, and reuses the existing memories-weaving function untouched. Ready to build on your go.
