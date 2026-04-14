# Ancestra Phase 2: Live Generation — Design Spec

**Status:** Approved
**Date:** 2026-04-14
**Predecessor:** Phase 1 Journey Prototype (shipped, arc validated with Osmond mock)
**Goal:** Replace hardcoded Osmond mock data on Stops 2-5 with live Claude-generated content, so any surname a user types produces a real, per-user experience.

---

## Summary

Phase 1 proved the six-stop emotional arc works when the content is hand-crafted for one family. Phase 2 keeps that exact arc and generates the content live from the surname the user types on Stop 1. Every piece that was `osmondMock` on Stops 2, 3, 4, 5 becomes a Claude-generated payload, routed through a Lovable Cloud Edge Function, cached at the surname level where appropriate, and streamed to the journey as the user walks it.

Out of scope: crest images, real genealogy (named ancestors with dates), Stripe, auth/signup, Stop 6 gifting, anthem generation, free tools. Each is a later phase.

---

## Success Criteria

A user types a surname you have **no emotional attachment to** (e.g. "Carter", "Reilly") into Stop 1, walks through Stops 2→5 without interruption, and the content feels as emotionally right as the Phase 1 Osmond mock did.

If that bar is met with a handful of test surnames across different language origins (English, Irish, Italian, Polish, West African, Chinese), Phase 2 ships.

---

## Architecture

Three components:

### 1. React client (existing, Phase 1)

- New `JourneyContext` React provider wraps `/journey/*` inside `JourneyLayout`.
- Holds `{ facts, story, errors }` for the current journey in memory.
- Exposes per-piece status: `'idle' | 'loading' | 'ready' | 'error'` with a `retry()` callback for failed pieces.
- Stops 2-5 subscribe to the context instead of importing `osmondMock`.

### 2. Lovable Cloud Edge Function: `generate-legacy` (new)

- Single POST endpoint at `/functions/v1/generate-legacy`.
- Request: `{ surname: string }`.
- Response: `{ facts: LegacyFacts | null, story: LegacyStory | null, errors: Array<{ which, reason }> }`.
- Internally orchestrates two Claude calls in parallel:
  - **Facts call** — checks `surname_facts` cache first; on miss, generates + write-through caches.
  - **Story call** — always fresh, never cached.
- Returns partial success: if one call fails after retries, the other is still returned.
- Logs every call to `generation_logs` for observability.

### 3. Postgres (existing, Lovable Cloud)

Two new tables:

```sql
CREATE TABLE public.surname_facts (
  surname TEXT PRIMARY KEY,       -- lowercased, trimmed
  payload JSONB NOT NULL,
  model_version TEXT NOT NULL,    -- "claude-sonnet-4-6:prompt-v1"
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.generation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  surname TEXT NOT NULL,
  call_type TEXT NOT NULL,        -- 'facts' | 'story'
  cache_hit BOOLEAN NOT NULL,
  duration_ms INTEGER NOT NULL,
  success BOOLEAN NOT NULL,
  error_reason TEXT,
  model_version TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```

Both tables allow anonymous writes from the edge function's service role. No RLS needed on `surname_facts` (shared content); `generation_logs` is write-only from the server.

Existing tables (`profiles`, `crests`) are untouched in Phase 2.

---

## Data Flow

```
Stop 1: user types "Reilly", clicks "Discover My Legacy"
  │
  ├─→ POST /generate-legacy { surname: "Reilly" }
  │     (fire-and-forget from client's perspective; context tracks it)
  │
  ├─→ navigate /journey/2 (immediate, does not block on network)
  │
Stop 2 mounts:
  │     chrome renders (SectionLabel, hero headline)
  │     subscribes to JourneyContext.facts
  │     while status='loading' → typewriter pre-text is empty
  │     when status='ready' → meaning typewrites in
  │     when status='error' → inline retry CTA
  │
Stop 3:
  │     facts already loaded (2-3s cache hit, 8-10s fresh)
  │     migration waypoints stagger in
  │
Stop 4:
  │     ForgeLoader runs (existing 3.6s animation)
  │     facts already loaded — motto + symbolism reveal
  │
Stop 5:
  │     subscribes to JourneyContext.story
  │     if story ready → typewriter begins
  │     if story still loading → typewriter waits with "The quill is still..."
  │     if story errored → inline retry
```

**Key property:** The client navigates immediately. It never blocks on the network. Cinematic reveals (ForgeLoader, typewriter) naturally absorb any remaining latency.

---

## Data Contract

Returned from `/generate-legacy`:

```ts
type LegacyFacts = {
  surname: string;          // "reilly" (normalized)
  displaySurname: string;   // "Reilly" (titlecased as typed)
  meaning: {
    origin: string;         // "Gaelic Ireland, ~10th century"
    role: string;           // "Chieftains and poets of the old kingdoms"
    etymology: string;      // "From the Irish 'Raghallaigh' meaning..."
    historicalContext: string; // one sentence
  };
  migration: {
    waypoints: Array<{
      region: string;       // "County Cavan, Ireland"
      century: string;      // "12th century"
      role: string;         // "Princes of East Breifne"
    }>;
    closingLine: string;    // caps the journey
  };
  mottoLatin: string;       // 3-6 words, genuine Latin
  mottoEnglish: string;
  symbolism: Array<{        // exactly 4
    element: string;        // classical heraldic only
    meaning: string;
  }>;
};

type LegacyStory = {
  chapterOneTitle: string;  // "Chapter I — [evocative subtitle]"
  chapterOneBody: string;   // ~200 words
  teaserChapters: string[]; // exactly 8 titles, 3-6 words each
};
```

These shapes are chosen to map 1:1 onto the existing Phase 1 components (`BloodlineTree` takes `waypoints`, `TypewriterText` takes `chapterOneBody`, etc.) so Phase 2 component changes are minimal.

---

## Prompts

Both calls use `claude-sonnet-4-6` (Opus overkill for this shape, Haiku not warm enough). Both use JSON output for parse safety.

### Prompt A — Facts (cached)

```
System: You are Ancestra, a warm archivist who reveals the meaning
of a family name. Voice: emotional, direct, never academic. Never
invent named individuals or specific dates — speak in regions and
centuries. Return valid JSON matching the schema below.

Brand guardrails:
- Never use: genealogy database, data, algorithm, research, optimize
- Always use: legacy, bloodline, House, story, forge, name
- If the surname is offensive, slang, or non-surname input
  (e.g., "Poop", "Hitler", "ASDF"), return JSON with meaning.origin
  = "UNKNOWN" and no other fields.

User: Generate the facts for the surname "{surname}".

Schema:
{ "meaning": { "origin", "role", "etymology", "historicalContext" },
  "migration": { "waypoints": [{"region","century","role"}], "closingLine" },
  "mottoLatin", "mottoEnglish",
  "symbolism": [{"element","meaning"}] }  // exactly 4 symbols

Constraints:
- 3-5 migration waypoints, oldest first
- mottoLatin: genuine Latin, 3-6 words
- symbolism: classical heraldic (lions, chevrons, oaks, stars,
  crowns — never modern objects)
```

### Prompt B — Story (fresh)

```
System: You are Ancestra. Write the opening chapter of a family's
legacy — cinematic, sensory, ~200 words. Third person narrative
set in the ancestral region. End on a line that points forward to
the next chapter without resolving. Return JSON.

User: Surname: "{surname}"
Facts from the archive: {facts_payload_summary}

Schema:
{ "chapterOneTitle": "Chapter I — [evocative subtitle]",
  "chapterOneBody": "~200 words of prose",
  "teaserChapters": [8 chapter titles, each 3-6 words] }

Constraints:
- chapterOneBody: one scene, one sensory detail per sentence,
  no exposition dumps
- teaserChapters: arc from origins → rise → turning point → present
- Never contradict the facts payload (region, century, role)
```

### Prompt versioning

`model_version` in the `surname_facts` row is the hash of the system prompt concatenated with the model ID. When the prompt changes, the hash changes, old rows become stale and are regenerated on next request.

---

## Failure Modes & Retries

Four layers of defense. Each catches what the one above missed.

### Layer 1: Edge function internal retries

Each Claude call retries up to 2 times with 500ms backoff on 429/500/503. Most transient failures resolve silently.

### Layer 2: JSON parse guard

Tolerant parser strips anything outside the first `{...}` block. On parse failure, retry the Claude call once. Still malformed = failed call.

### Layer 3: Partial success response

Edge function returns `{ facts, story, errors: [{which, reason}] }`. Client always receives *something*. Never an all-or-nothing error.

### Layer 4: Client inline retry UI

`JourneyContext` exposes each piece with `{ data, status, retry() }`. Stops render:

- `ready`: content
- `loading`: existing cinematic element (typewriter, ForgeLoader, skeleton)
- `error`: amber-dim inline line *"The archives are still forging this. Tap to try again."* + retry button that re-calls just that piece

### Special case: offensive / invalid surname

Claude returns `meaning.origin: "UNKNOWN"`. Edge function translates to `{ code: "UNKNOWN_SURNAME" }`. Client routes back to Stop 1 with *"We couldn't find that name in the archives. Try the surname as it appears on a birth certificate."*

### Explicitly excluded

- No generic fallback content (would mask real failures).
- No auto-retry beyond the 2 internal retries (rate-limit footgun).
- No error toast (breaks the arc — errors are inline, in context).

---

## Observability

`generation_logs` captures every Claude call. A simple weekly query answers:

- Median latency per call type
- Cache hit rate for facts
- Failure rate and common error reasons
- Surnames being tested (and whether any are being abused)

No rate limiting in Phase 2 — we want to *see* failures and abuse patterns before throttling. If logs show a problem, Phase 2.5 adds IP-based throttling at the edge function level.

---

## Scope Boundary

### In scope

- Edge function `generate-legacy` with facts + story Claude calls
- `surname_facts` cache table
- `generation_logs` observability table
- `JourneyContext` provider
- Stop 1 submit wires to edge function, navigates immediately
- Stops 2, 3, 4, 5 read from context instead of mock
- Inline retry UI per stop
- Offensive-input sentinel + gentle bounce
- Voice guardrails in prompts

### Out of scope (deferred phases)

- Crest image generation — stays placeholder PNG with existing notice (Phase 2.5 / Phase 4)
- Named ancestors / real genealogy — deferred to Phase 3 (FamilySearch API)
- Auth / signup — anonymous journey preserved; Stop 6 signup is Phase 3
- Stripe / paywall / Legacy Pack purchase — Stop 5 paywall card stays mock (Phase 4)
- Stop 6 gifting / share links / physical products — Phase 5+
- Family anthem (Suno) — Phase 6
- Free tools (quiz, 1700s-you, ancestor chat, motto generator, surname lookup) — reuse this edge function pattern in later phases
- Optional Stop 1 fields (parents, country, birth year) — removed entirely in Phase 2
- Story caching — intentionally fresh each journey
- Session resume across tabs — in-memory context only
- Rate limiting — logs first, throttle only if logs show abuse
- Social/SEO meta tags, OG images — Phase 4+

---

## Ship Gate

A user types a surname you have no emotional attachment to (e.g. "Carter", "Reilly"), walks through Stops 1→5, and the content feels emotionally correct. Validate with at least three surnames across different language origins before calling Phase 2 shipped.

If a test surname produces flat or wrong-feeling content, iterate the prompt (Section 3) before expanding scope.
