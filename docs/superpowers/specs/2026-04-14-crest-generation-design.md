# Crest Generation Implementation Design

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Generate a unique AI heraldic coat of arms image for each surname using DALL-E 3, displayed at Stop 4 of the journey.

**Architecture:** A new `generate-crest` Supabase edge function fires in the background as soon as `facts` are ready in JourneyContext. The generated image is cached per surname in a `surname_crests` DB table and Supabase Storage. Stop 4's existing ForgeLoader animation absorbs the 10–15 second generation wait. The placeholder CrestHero is replaced with the real generated image.

**Tech Stack:** Deno edge function, OpenAI DALL-E 3 API (`OPENAI_API_KEY` secret), Supabase Storage (`crests` bucket), Supabase DB (`surname_crests` table), React + Framer Motion frontend.

---

## File Structure

**Create:**
- `supabase/functions/generate-crest/index.ts` — edge function (cache check → prompt build → DALL-E 3 call → storage upload → DB write → return URL)
- `supabase/migrations/YYYYMMDD_surname_crests.sql` — new table + storage bucket policy

**Modify:**
- `src/types/legacy.ts` — add `LegacyCrest` type
- `supabase/functions/generate-legacy/types.ts` — mirror `LegacyCrest` (kept byte-identical per existing convention)
- `src/lib/legacyClient.ts` — add `fetchCrest(surname, facts)` function
- `src/contexts/JourneyContext.tsx` — add `crest: Piece<LegacyCrest>`, fire when facts ready
- `src/pages/journey/Stop4CrestForge.tsx` — replace placeholder + `forged` state with `crest.status`

---

## Section 1: Database & Storage

### `surname_crests` table
```sql
CREATE TABLE public.surname_crests (
  surname      TEXT PRIMARY KEY,
  image_url    TEXT NOT NULL,
  prompt       TEXT NOT NULL,
  created_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.surname_crests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read cached crests"
  ON public.surname_crests FOR SELECT
  USING (true);
```

### Supabase Storage
- Bucket name: `crests`
- Public read access
- Files stored as: `{normalized_surname}.png`
- The edge function downloads the DALL-E URL (expires after 1hr), re-uploads to this bucket as a permanent public URL

---

## Section 2: Edge Function — `generate-crest`

**Input:** `POST { surname: string, facts: LegacyFacts }`

**Output:** `{ code: "OK", imageUrl: string } | { code: "ERROR", reason: string }`

**Logic:**
1. Validate input — surname required, facts required
2. Normalize surname (lowercase, trim)
3. **Cache check** — query `surname_crests` WHERE surname = normalized. If found, return `imageUrl` immediately.
4. **Build prompt** — construct DALL-E 3 prompt from facts (see Prompt Design below)
5. **Call DALL-E 3** — POST to `https://api.openai.com/v1/images/generations`
6. **Download image** — fetch the ephemeral DALL-E URL as `ArrayBuffer`
7. **Upload to Storage** — upload to `crests/{normalized_surname}.png` via Supabase Storage API
8. **Save to DB** — insert into `surname_crests` (surname, image_url, prompt)
9. **Return** `{ code: "OK", imageUrl: <permanent storage URL> }`

**DALL-E 3 request:**
```json
{
  "model": "dall-e-3",
  "prompt": "<built from facts>",
  "n": 1,
  "size": "1024x1024",
  "quality": "standard",
  "style": "vivid"
}
```

### Prompt Design

```
A highly detailed heraldic coat of arms for the {SURNAME} family.
Origin: {ORIGIN}. Family were {ROLE}.
Heraldic symbols to include: {SYMBOL1}, {SYMBOL2}, {SYMBOL3}, {SYMBOL4}.
Family motto scroll at the base.
Style: medieval European heraldry, ornate golden shield with supporters,
rich amber and gold tones on a dark warm background, intricate engraving
detail, perfectly symmetrical, no readable text, museum-quality illustration.
```

Where:
- `{SURNAME}` = `facts.displaySurname`
- `{ORIGIN}` = `facts.meaning.origin`
- `{ROLE}` = `facts.meaning.role`
- `{SYMBOL1..4}` = `facts.symbolism[0..3].element`

---

## Section 3: Type Changes

### `src/types/legacy.ts` (and mirrored in `supabase/functions/generate-legacy/types.ts`)

Add at the bottom:
```ts
export type LegacyCrest = {
  imageUrl: string;
};
```

---

## Section 4: `legacyClient.ts`

Add new export:
```ts
export async function fetchCrest(
  surname: string,
  facts: LegacyFacts,
): Promise<LegacyCrest> {
  const { data, error } = await supabase.functions.invoke<{ code: string; imageUrl?: string; reason?: string }>(
    "generate-crest",
    { body: { surname, facts } },
  );
  if (error) throw new Error(`fetchCrest: ${error.message}`);
  if (!data || data.code !== "OK" || !data.imageUrl) {
    throw new Error(`fetchCrest: ${data?.reason ?? "empty response"}`);
  }
  return { imageUrl: data.imageUrl };
}
```

---

## Section 5: JourneyContext Changes

Add `crest` to `InternalState`:
```ts
crest: { data: LegacyCrest | null; status: PieceStatus; reason: string | null };
```

Add to `INITIAL`:
```ts
crest: { data: null, status: "idle", reason: null },
```

Add to `JourneyContextValue`:
```ts
crest: Piece<LegacyCrest>;
```

**Trigger logic:** In `applyResponse`, after facts are set to `ready`, immediately fire `fetchCrest` in the background:
```ts
// After facts are confirmed ready (not UNKNOWN, not error):
void runCrestFetch(surname, facts);
```

Add `runCrestFetch` callback (same pattern as `runFetch`):
```ts
const runCrestFetch = useCallback(async (surname: string, facts: LegacyFacts) => {
  setState(s => ({ ...s, crest: { data: null, status: "loading", reason: null } }));
  try {
    const crest = await fetchCrest(surname, facts);
    setState(s => ({ ...s, crest: { data: crest, status: "ready", reason: null } }));
  } catch (err) {
    setState(s => ({ ...s, crest: { data: null, status: "error", reason: (err as Error).message } }));
  }
}, []);
```

Add `crestRetry` callback:
```ts
const crestRetry = useCallback(() => {
  const current = surnameRef.current;
  const facts = /* read from state via ref */ ;
  if (!current || !facts) return;
  void runCrestFetch(current, facts);
}, [runCrestFetch]);
```

Expose in context value:
```ts
crest: { ...state.crest, retry: crestRetry },
```

Also reset `crest` in `reset()`:
```ts
crest: { data: null, status: "idle", reason: null },
```

---

## Section 6: Stop4CrestForge UI Changes

**Remove:**
- `const [forged, setForged] = useState(false)` state
- The `!forged` / `forged` AnimatePresence branches
- The placeholder text: *"Placeholder crest shown — your X crest will be forged here..."*
- The `<CrestHero>` import and usage

**Add:**
- Destructure `crest` from `useJourney()`
- Drive display from `crest.status`:

```tsx
{crest.status === "loading" && (
  <ForgeLoader messages={FORGE_MESSAGES} />
)}

{crest.status === "error" && (
  <RetryInline onRetry={crest.retry} />
)}

{crest.status === "ready" && crest.data && (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
    className="relative flex w-full flex-col items-center"
  >
    {/* Amber glow behind crest */}
    <div
      className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
      style={{
        width: "900px",
        height: "900px",
        background: "radial-gradient(circle at center, hsla(30,80%,50%,0.18) 0%, transparent 60%)",
      }}
    />
    <img
      src={crest.data.imageUrl}
      alt={`${facts.data?.displaySurname ?? surname} family crest`}
      className="relative z-10 w-full max-w-2xl rounded-[22px]"
      style={{ maxHeight: "70vh", objectFit: "contain" }}
    />
    {/* Motto + symbolism cards — same as today */}
  </motion.div>
)}
```

**ForgeLoader change:** Remove the `onComplete` callback prop usage — ForgeLoader no longer controls state. It just plays its animation loop while `crest.status === "loading"`. Once `crest.status` changes to `ready`, the component re-renders naturally.

---

## Error Handling

- **DALL-E content policy rejection** — caught as an error, shown via `RetryInline`. The prompt avoids any policy-triggering content (no people, no flags, purely heraldic symbols).
- **Storage upload failure** — caught, returned as `{ code: "ERROR" }`, shown via `RetryInline`.
- **Cache hit** — always fast-path, no error surface.
- **Network timeout** — Deno edge function has a 60s wall clock limit. DALL-E 3 at standard quality consistently returns within 20s.

---

## Testing

- Unit test for prompt builder: given a `LegacyFacts` fixture, assert the prompt string contains surname, origin, role, and all 4 symbol elements.
- Unit test for cache hit path: mock DB returns a cached row, assert DALL-E is never called.
- Unit test for `legacyClient.fetchCrest`: mock `supabase.functions.invoke`, assert correct function name and body shape.
- Unit test for JourneyContext: assert `crest.status` transitions from `idle` → `loading` → `ready` when facts become ready.

---

## Self-Review Notes

- ✅ No TBDs or placeholders
- ✅ `LegacyCrest` type mirrored in both locations per existing convention
- ✅ Cache per surname prevents duplicate DALL-E charges for same name
- ✅ Permanent storage URL avoids DALL-E's 1hr expiry
- ✅ Prompt uses only heraldic content — no DALL-E policy risk
- ✅ `ForgeLoader` decoupled from state — plays until real status changes
- ✅ Scope is one feature: crest generation only, no other journey stops touched
