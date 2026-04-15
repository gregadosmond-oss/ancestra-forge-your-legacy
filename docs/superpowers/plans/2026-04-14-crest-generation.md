# Crest Generation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate a unique AI heraldic coat of arms image per surname using DALL-E 3, displayed at Stop 4 of the journey, replacing the current placeholder.

**Architecture:** A new `generate-crest` Supabase edge function fires in the background the moment `facts` are ready in `JourneyContext` (while the user reads Stops 2–3). It checks `surname_crests` cache first; on miss it calls DALL-E 3, downloads the ephemeral image, uploads it to Supabase Storage as a permanent URL, then caches it. Stop 4's `ForgeLoader` loops until `crest.status` flips to `"ready"`.

**Tech Stack:** Deno edge function, OpenAI DALL-E 3 (`OPENAI_API_KEY` secret already added to Lovable), Supabase DB + Storage, React + Framer Motion, Vitest (frontend tests), Deno test runner (edge function tests).

---

## File Map

| Action | Path | Responsibility |
|--------|------|---------------|
| Create | `supabase/migrations/20260415000000_surname_crests.sql` | `surname_crests` table + `crests` storage bucket |
| Modify | `src/types/legacy.ts` | Add `LegacyCrest` type |
| Modify | `supabase/functions/generate-legacy/types.ts` | Mirror `LegacyCrest` (kept byte-identical per codebase convention) |
| Create | `supabase/functions/generate-crest/crest.ts` | Pure logic: `normalizeSurname`, `buildPrompt`, `readCrest`, `writeCrest`, `generateCrest` |
| Create | `supabase/functions/generate-crest/crest.test.ts` | Deno tests for pure logic |
| Create | `supabase/functions/generate-crest/index.ts` | Deno.serve HTTP handler |
| Modify | `src/lib/legacyClient.ts` | Add `fetchCrest(surname, facts)` |
| Modify | `src/lib/legacyClient.test.ts` | Tests for `fetchCrest` |
| Modify | `src/components/journey/ForgeLoader.tsx` | Add `loop?: boolean` prop |
| Modify | `src/contexts/JourneyContext.tsx` | Add `crest: Piece<LegacyCrest>`, fire on facts ready |
| Modify | `src/contexts/JourneyContext.test.tsx` | Tests for crest state transitions |
| Modify | `src/pages/journey/Stop4CrestForge.tsx` | Replace placeholder + `forged` state with `crest.status` |

---

## Task 1: DB Migration — `surname_crests` table + `crests` storage bucket

**Files:**
- Create: `supabase/migrations/20260415000000_surname_crests.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- surname_crests: one cached crest image URL per surname.
-- Same service-role-only write pattern as surname_facts.

CREATE TABLE public.surname_crests (
  surname    TEXT PRIMARY KEY,
  image_url  TEXT NOT NULL,
  prompt     TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.surname_crests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read cached crests"
  ON public.surname_crests FOR SELECT
  USING (true);

-- Supabase Storage: public crests bucket.
-- Files stored as {normalized_surname}.png
INSERT INTO storage.buckets (id, name, public)
VALUES ('crests', 'crests', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read access on crests bucket"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'crests');
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/20260415000000_surname_crests.sql
git commit -m "feat: add surname_crests table and crests storage bucket"
```

---

## Task 2: `LegacyCrest` type in both type files

**Context:** `src/types/legacy.ts` and `supabase/functions/generate-legacy/types.ts` must stay byte-identical — the codebase has a test that asserts this. Add the same type to the bottom of both files.

**Files:**
- Modify: `src/types/legacy.ts`
- Modify: `supabase/functions/generate-legacy/types.ts`

- [ ] **Step 1: Add `LegacyCrest` to `src/types/legacy.ts`**

Append to the bottom of the file (after the `LegacyResponse` type):

```ts
export type LegacyCrest = {
  imageUrl: string;
};
```

- [ ] **Step 2: Mirror the identical line to `supabase/functions/generate-legacy/types.ts`**

Append to the bottom of `supabase/functions/generate-legacy/types.ts` (after `LegacyResponse`):

```ts
export type LegacyCrest = {
  imageUrl: string;
};
```

- [ ] **Step 3: Verify the sync test still passes**

```bash
npx vitest run src/lib/legacyClient.test.ts
```

Expected: all tests pass (the sync test lives elsewhere — this confirms no regressions).

- [ ] **Step 4: Commit**

```bash
git add src/types/legacy.ts supabase/functions/generate-legacy/types.ts
git commit -m "feat: add LegacyCrest type to both type files"
```

---

## Task 3: `generate-crest/crest.ts` — pure logic (TDD)

**Context:** Following the same pattern as `generate-legacy/orchestrator.ts` and `cache.ts`, the pure logic lives in `crest.ts` and is tested in `crest.test.ts`. The Deno.serve handler in `index.ts` (Task 4) wires the real dependencies.

`DbClient` is imported from `../generate-legacy/db_client.ts` — it's just `{ from(table: string): any }`.

**Files:**
- Create: `supabase/functions/generate-crest/crest.test.ts`
- Create: `supabase/functions/generate-crest/crest.ts`

- [ ] **Step 1: Write the failing tests**

Create `supabase/functions/generate-crest/crest.test.ts`:

```ts
import {
  assertEquals,
  assert,
} from "https://deno.land/std@0.208.0/assert/mod.ts";
import {
  normalizeSurname,
  buildPrompt,
  generateCrest,
} from "./crest.ts";
import type { LegacyFacts } from "../generate-legacy/types.ts";

const SAMPLE_FACTS: LegacyFacts = {
  surname: "reilly",
  displaySurname: "Reilly",
  meaning: {
    origin: "Gaelic Ireland, ~10th century",
    role: "Chieftains of the old kingdoms",
    etymology: "From Irish 'Raghallaigh'",
    historicalContext: "A dominant sept of East Breifne.",
  },
  migration: {
    waypoints: [
      { region: "County Cavan", century: "12th", role: "Princes" },
    ],
    closingLine: "Across the sea.",
  },
  mottoLatin: "Fortitudine",
  mottoEnglish: "By Fortitude",
  symbolism: [
    { element: "Stag", meaning: "Vigilance" },
    { element: "Oak", meaning: "Endurance" },
    { element: "Crown", meaning: "Sovereignty" },
    { element: "Chevron", meaning: "Protection" },
  ],
};

// Fake DB client with an in-memory crests cache.
function makeFakeClient(crestCache: Map<string, string>) {
  return {
    from(table: string) {
      if (table !== "surname_crests") throw new Error(`unexpected table: ${table}`);
      return {
        select: (_cols: string) => ({
          eq: (_col: string, val: string) => ({
            maybeSingle: async () => {
              const url = crestCache.get(val);
              return { data: url ? { image_url: url } : null, error: null };
            },
          }),
        }),
        upsert: async (row: { surname: string; image_url: string; prompt: string }) => {
          crestCache.set(row.surname, row.image_url);
          return { error: null };
        },
      };
    },
  };
}

// ── normalizeSurname ──────────────────────────────────────────────────────────

Deno.test("normalizeSurname lowercases and trims", () => {
  assertEquals(normalizeSurname("  Reilly  "), "reilly");
  assertEquals(normalizeSurname("OSMOND"), "osmond");
  assertEquals(normalizeSurname("bennett"), "bennett");
});

// ── buildPrompt ───────────────────────────────────────────────────────────────

Deno.test("buildPrompt includes displaySurname, origin, role, and all 4 symbols", () => {
  const prompt = buildPrompt(SAMPLE_FACTS);
  assert(prompt.includes("Reilly"), "should include displaySurname");
  assert(prompt.includes("Gaelic Ireland"), "should include origin");
  assert(prompt.includes("Chieftains"), "should include role");
  assert(prompt.includes("Stag"), "should include symbol 1");
  assert(prompt.includes("Oak"), "should include symbol 2");
  assert(prompt.includes("Crown"), "should include symbol 3");
  assert(prompt.includes("Chevron"), "should include symbol 4");
});

// ── generateCrest ─────────────────────────────────────────────────────────────

Deno.test("generateCrest returns cached URL and skips DALL-E on cache hit", async () => {
  const cache = new Map<string, string>();
  cache.set("reilly", "https://storage.example.com/crests/reilly.png");
  const client = makeFakeClient(cache);

  let dalleCallCount = 0;
  const result = await generateCrest({
    client,
    surname: "Reilly",
    facts: SAMPLE_FACTS,
    callDalle: async () => { dalleCallCount++; return "https://dalle.com/temp.png"; },
    downloadAndUpload: async () => { throw new Error("should not be called"); },
  });

  assertEquals(dalleCallCount, 0);
  assertEquals(result, "https://storage.example.com/crests/reilly.png");
});

Deno.test("generateCrest calls DALL-E, uploads, caches, and returns URL on miss", async () => {
  const cache = new Map<string, string>();
  const client = makeFakeClient(cache);
  const permanentUrl = "https://storage.example.com/crests/bennett.png";

  const result = await generateCrest({
    client,
    surname: "Bennett",
    facts: { ...SAMPLE_FACTS, displaySurname: "Bennett" },
    callDalle: async (_prompt: string) => "https://dalle.com/temp123.png",
    downloadAndUpload: async (_normalized: string, _tempUrl: string) => permanentUrl,
  });

  assertEquals(result, permanentUrl);
  assertEquals(cache.get("bennett"), permanentUrl);
});

Deno.test("generateCrest normalizes surname before cache lookup", async () => {
  const cache = new Map<string, string>();
  cache.set("osmond", "https://storage.example.com/crests/osmond.png");
  const client = makeFakeClient(cache);

  // Pass mixed-case — should still hit the cache
  const result = await generateCrest({
    client,
    surname: "  OSMOND  ",
    facts: SAMPLE_FACTS,
    callDalle: async () => { throw new Error("should not be called"); },
    downloadAndUpload: async () => { throw new Error("should not be called"); },
  });

  assertEquals(result, "https://storage.example.com/crests/osmond.png");
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
deno test supabase/functions/generate-crest/crest.test.ts
```

Expected: `error: Module not found` or similar — `crest.ts` doesn't exist yet.

- [ ] **Step 3: Implement `crest.ts`**

Create `supabase/functions/generate-crest/crest.ts`:

```ts
import type { LegacyFacts } from "../generate-legacy/types.ts";
import type { DbClient } from "../generate-legacy/db_client.ts";

export function normalizeSurname(input: string): string {
  return input.trim().toLowerCase();
}

export function buildPrompt(facts: LegacyFacts): string {
  const symbols = facts.symbolism.map((s) => s.element).join(", ");
  return [
    `A highly detailed heraldic coat of arms for the ${facts.displaySurname} family.`,
    `Origin: ${facts.meaning.origin}.`,
    `Family were ${facts.meaning.role}.`,
    `Heraldic symbols to include: ${symbols}.`,
    `Family motto scroll at the base.`,
    `Style: medieval European heraldry, ornate golden shield with supporters,`,
    `rich amber and gold tones on a dark warm background, intricate engraving`,
    `detail, perfectly symmetrical, no readable text, museum-quality illustration.`,
  ].join(" ");
}

export async function readCrest(
  client: DbClient,
  surname: string,
): Promise<string | null> {
  const { data, error } = await client
    .from("surname_crests")
    .select("image_url")
    .eq("surname", surname)
    .maybeSingle();

  if (error) {
    console.error("readCrest error", error);
    return null;
  }
  return data?.image_url ?? null;
}

export async function writeCrest(
  client: DbClient,
  surname: string,
  imageUrl: string,
  prompt: string,
): Promise<void> {
  const { error } = await client.from("surname_crests").upsert({
    surname,
    image_url: imageUrl,
    prompt,
  });
  if (error) {
    // Non-fatal — we have the URL to return even if caching fails.
    console.error("writeCrest error", error);
  }
}

export type GenerateCrestOpts = {
  client: DbClient;
  surname: string;
  facts: LegacyFacts;
  /** Returns an ephemeral DALL-E image URL. */
  callDalle: (prompt: string) => Promise<string>;
  /** Downloads image from tempUrl, uploads to storage, returns permanent public URL. */
  downloadAndUpload: (normalized: string, tempUrl: string) => Promise<string>;
};

export async function generateCrest(opts: GenerateCrestOpts): Promise<string> {
  const normalized = normalizeSurname(opts.surname);

  const cached = await readCrest(opts.client, normalized);
  if (cached) return cached;

  const prompt = buildPrompt(opts.facts);
  const tempUrl = await opts.callDalle(prompt);
  const publicUrl = await opts.downloadAndUpload(normalized, tempUrl);

  await writeCrest(opts.client, normalized, publicUrl, prompt);
  return publicUrl;
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
deno test supabase/functions/generate-crest/crest.test.ts
```

Expected: `4 passed`

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/generate-crest/crest.ts supabase/functions/generate-crest/crest.test.ts
git commit -m "feat: add generate-crest pure logic with tests"
```

---

## Task 4: `generate-crest/index.ts` — HTTP handler

**Context:** This wires the real DALL-E API, real Supabase storage, and real DB client to `generateCrest`. It follows the exact same pattern as `generate-legacy/index.ts`.

**Files:**
- Create: `supabase/functions/generate-crest/index.ts`

- [ ] **Step 1: Implement the handler**

Create `supabase/functions/generate-crest/index.ts`:

```ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { generateCrest } from "./crest.ts";
import type { LegacyFacts } from "../generate-legacy/types.ts";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "content-type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return json({ error: "method not allowed" }, 405);
  }

  const openaiKey = Deno.env.get("OPENAI_API_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!openaiKey || !supabaseUrl || !supabaseKey) {
    return json({ error: "missing env" }, 500);
  }

  let body: { surname?: unknown; facts?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid json" }, 400);
  }
  if (typeof body.surname !== "string" || body.surname.trim().length === 0) {
    return json({ error: "surname required" }, 400);
  }
  if (!body.facts || typeof body.facts !== "object") {
    return json({ error: "facts required" }, 400);
  }

  const facts = body.facts as LegacyFacts;
  const client = createClient(supabaseUrl, supabaseKey);

  try {
    const imageUrl = await generateCrest({
      client,
      surname: body.surname,
      facts,
      callDalle: async (prompt: string) => {
        const res = await fetch("https://api.openai.com/v1/images/generations", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "authorization": `Bearer ${openaiKey}`,
          },
          body: JSON.stringify({
            model: "dall-e-3",
            prompt,
            n: 1,
            size: "1024x1024",
            quality: "standard",
            style: "vivid",
          }),
        });
        if (!res.ok) {
          const err = await res.text();
          throw new Error(`DALL-E error ${res.status}: ${err}`);
        }
        const data = await res.json();
        const url: string | undefined = data.data?.[0]?.url;
        if (!url) throw new Error("DALL-E: no image URL in response");
        return url;
      },
      downloadAndUpload: async (normalized: string, tempUrl: string) => {
        const imgRes = await fetch(tempUrl);
        if (!imgRes.ok) {
          throw new Error(`failed to download image: ${imgRes.status}`);
        }
        const buffer = await imgRes.arrayBuffer();

        const filePath = `${normalized}.png`;
        const { error: uploadError } = await client.storage
          .from("crests")
          .upload(filePath, buffer, { contentType: "image/png", upsert: true });
        if (uploadError) {
          throw new Error(`storage upload failed: ${uploadError.message}`);
        }

        const { data: { publicUrl } } = client.storage
          .from("crests")
          .getPublicUrl(filePath);
        return publicUrl;
      },
    });

    return json({ code: "OK", imageUrl });
  } catch (err) {
    console.error("generate-crest error:", (err as Error).message);
    return json({ code: "ERROR", reason: (err as Error).message }, 502);
  }
});
```

- [ ] **Step 2: Commit**

```bash
git add supabase/functions/generate-crest/index.ts
git commit -m "feat: add generate-crest HTTP handler"
```

---

## Task 5: `fetchCrest` in `legacyClient.ts` (TDD)

**Context:** `legacyClient.ts` already has `fetchLegacy`. We add `fetchCrest` with the same pattern. The test file already mocks `@/integrations/supabase/client` with `supabase.functions.invoke`.

**Files:**
- Modify: `src/lib/legacyClient.test.ts`
- Modify: `src/lib/legacyClient.ts`

- [ ] **Step 1: Write the failing tests**

Add these tests to the bottom of `src/lib/legacyClient.test.ts`:

```ts
import { fetchLegacy, fetchCrest } from "./legacyClient";
import type { LegacyFacts } from "@/types/legacy";

// Add SAMPLE_FACTS fixture used by fetchCrest tests
const SAMPLE_FACTS: LegacyFacts = {
  surname: "reilly",
  displaySurname: "Reilly",
  meaning: {
    origin: "Gaelic Ireland, ~10th century",
    role: "Chieftains",
    etymology: "From Irish 'Raghallaigh'",
    historicalContext: "East Breifne.",
  },
  migration: {
    waypoints: [{ region: "Cavan", century: "12th", role: "Princes" }],
    closingLine: "Across the sea.",
  },
  mottoLatin: "Fortitudine",
  mottoEnglish: "By Fortitude",
  symbolism: [
    { element: "Stag", meaning: "Vigilance" },
    { element: "Oak", meaning: "Endurance" },
    { element: "Crown", meaning: "Sovereignty" },
    { element: "Chevron", meaning: "Protection" },
  ],
};

describe("fetchCrest", () => {
  it("calls generate-crest with surname and facts", async () => {
    (supabase.functions.invoke as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { code: "OK", imageUrl: "https://storage.example.com/crests/reilly.png" },
      error: null,
    });

    const result = await fetchCrest("Reilly", SAMPLE_FACTS);

    expect(supabase.functions.invoke).toHaveBeenCalledWith("generate-crest", {
      body: { surname: "Reilly", facts: SAMPLE_FACTS },
    });
    expect(result).toEqual({ imageUrl: "https://storage.example.com/crests/reilly.png" });
  });

  it("throws on function invocation error", async () => {
    (supabase.functions.invoke as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: null,
      error: { message: "edge function crashed" },
    });

    await expect(fetchCrest("Reilly", SAMPLE_FACTS)).rejects.toThrow(/edge function crashed/);
  });

  it("throws when response code is ERROR", async () => {
    (supabase.functions.invoke as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { code: "ERROR", reason: "dalle failed" },
      error: null,
    });

    await expect(fetchCrest("Reilly", SAMPLE_FACTS)).rejects.toThrow(/dalle failed/);
  });

  it("throws when response body is missing", async () => {
    (supabase.functions.invoke as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: null,
      error: null,
    });

    await expect(fetchCrest("Reilly", SAMPLE_FACTS)).rejects.toThrow(/empty response/);
  });
});
```

**Note:** The import line at the top of the file already imports `fetchLegacy` — change it to:
```ts
import { fetchLegacy, fetchCrest } from "./legacyClient";
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/lib/legacyClient.test.ts
```

Expected: FAIL — `fetchCrest is not a function` or similar.

- [ ] **Step 3: Implement `fetchCrest` in `legacyClient.ts`**

Add the following import and function to `src/lib/legacyClient.ts` (after the existing imports and `fetchLegacy`):

```ts
import type { LegacyCrest, LegacyFacts } from "@/types/legacy";

export async function fetchCrest(
  surname: string,
  facts: LegacyFacts,
): Promise<LegacyCrest> {
  const { data, error } = await supabase.functions.invoke<{
    code: string;
    imageUrl?: string;
    reason?: string;
  }>("generate-crest", { body: { surname, facts } });

  if (error) throw new Error(`fetchCrest: ${error.message}`);
  if (!data) throw new Error("fetchCrest: empty response");
  if (data.code !== "OK" || !data.imageUrl) {
    throw new Error(`fetchCrest: ${data.reason ?? "no imageUrl"}`);
  }
  return { imageUrl: data.imageUrl };
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run src/lib/legacyClient.test.ts
```

Expected: all tests pass (3 existing + 4 new = 7 total).

- [ ] **Step 5: Commit**

```bash
git add src/lib/legacyClient.ts src/lib/legacyClient.test.ts
git commit -m "feat: add fetchCrest to legacyClient with tests"
```

---

## Task 6: `ForgeLoader` — add `loop` prop

**Context:** Currently `ForgeLoader` requires an `onComplete` callback and calls it when messages are exhausted. Stop 4 will use `loop={true}` so the animation keeps cycling while the crest is loading — no `onComplete` needed. The existing `onComplete` behavior is preserved when `loop` is false (or unset).

**Files:**
- Modify: `src/components/journey/ForgeLoader.tsx`

- [ ] **Step 1: Update `ForgeLoader.tsx`**

Replace the entire file with:

```tsx
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

type Props = {
  messages: string[];
  onComplete?: () => void;
  perMessageMs?: number;
  /** When true, restart from the first message instead of calling onComplete. */
  loop?: boolean;
};

const ForgeLoader = ({
  messages,
  onComplete,
  perMessageMs = 1200,
  loop = false,
}: Props) => {
  const [index, setIndex] = useState(0);

  // Intentionally omit onComplete from deps — callers often pass an inline
  // arrow that changes every render, which would tear the effect down and
  // restart the message cycle.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (index >= messages.length) {
      if (loop) {
        const reset = setTimeout(() => setIndex(0), 300);
        return () => clearTimeout(reset);
      }
      const done = setTimeout(() => onComplete?.(), 300);
      return () => clearTimeout(done);
    }
    const next = setTimeout(() => setIndex((i) => i + 1), perMessageMs);
    return () => clearTimeout(next);
  }, [index, messages.length, perMessageMs, loop]);

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

- [ ] **Step 2: Run full test suite to confirm no regressions**

```bash
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/components/journey/ForgeLoader.tsx
git commit -m "feat: add loop prop to ForgeLoader for indefinite cycling"
```

---

## Task 7: `JourneyContext` — `crest` piece (TDD)

**Context:** `JourneyContext` already manages `facts` and `story` as `Piece<T>` state. We add `crest: Piece<LegacyCrest>` with the same pattern. The key additions: a `factsRef` to store the latest facts for retry, and a `runCrestFetch` callback that fires automatically when `applyResponse` confirms facts are ready.

**Files:**
- Modify: `src/contexts/JourneyContext.test.tsx`
- Modify: `src/contexts/JourneyContext.tsx`

- [ ] **Step 1: Write failing tests — update `JourneyContext.test.tsx`**

Make these changes to `src/contexts/JourneyContext.test.tsx`:

**1a. Update the `vi.mock` call** to include `fetchCrest`:

```ts
vi.mock("@/lib/legacyClient", () => ({
  fetchLegacy: vi.fn(),
  fetchCrest: vi.fn(),
}));
import { fetchLegacy, fetchCrest } from "@/lib/legacyClient";
```

**1b. Update the `Harness` component** to expose `crest-status`:

```tsx
function Harness() {
  const { surname, facts, story, crest, startJourney } = useJourney();
  return (
    <div>
      <div data-testid="surname">{surname ?? "none"}</div>
      <div data-testid="facts-status">{facts.status}</div>
      <div data-testid="story-status">{story.status}</div>
      <div data-testid="crest-status">{crest.status}</div>
      <div data-testid="motto">{facts.data?.mottoLatin ?? ""}</div>
      <button onClick={() => startJourney("Reilly")}>start</button>
    </div>
  );
}
```

**1c. Update `beforeEach`** to reset `fetchCrest` with a default resolved value:

```ts
beforeEach(() => {
  (fetchLegacy as ReturnType<typeof vi.fn>).mockReset();
  (fetchCrest as ReturnType<typeof vi.fn>).mockReset();
  // Default: fetchCrest resolves successfully so existing tests are unaffected.
  (fetchCrest as ReturnType<typeof vi.fn>).mockResolvedValue({
    imageUrl: "https://storage.example.com/crests/reilly.png",
  });
});
```

**1d. Add three new tests** at the bottom of the `describe("JourneyProvider")` block:

```ts
it("crest transitions idle -> loading -> ready when fetchCrest resolves", async () => {
  (fetchLegacy as ReturnType<typeof vi.fn>).mockResolvedValue(OK_RESPONSE);
  (fetchCrest as ReturnType<typeof vi.fn>).mockResolvedValue({
    imageUrl: "https://storage.example.com/crests/reilly.png",
  });

  render(
    <JourneyProvider>
      <Harness />
    </JourneyProvider>,
  );

  expect(screen.getByTestId("crest-status").textContent).toBe("idle");

  act(() => { screen.getByText("start").click(); });

  await waitFor(() =>
    expect(screen.getByTestId("crest-status").textContent).toBe("loading"),
  );

  await waitFor(() =>
    expect(screen.getByTestId("crest-status").textContent).toBe("ready"),
  );
});

it("crest transitions loading -> error when fetchCrest throws", async () => {
  (fetchLegacy as ReturnType<typeof vi.fn>).mockResolvedValue(OK_RESPONSE);
  (fetchCrest as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("dalle failed"));

  render(
    <JourneyProvider>
      <Harness />
    </JourneyProvider>,
  );

  act(() => { screen.getByText("start").click(); });

  await waitFor(() =>
    expect(screen.getByTestId("crest-status").textContent).toBe("error"),
  );
});

it("crest stays idle when facts fail", async () => {
  (fetchLegacy as ReturnType<typeof vi.fn>).mockResolvedValue({
    code: "OK",
    facts: null,
    story: null,
    errors: [
      { which: "facts", reason: "boom" },
      { which: "story", reason: "skipped" },
    ],
  } satisfies LegacyResponse);

  render(
    <JourneyProvider>
      <Harness />
    </JourneyProvider>,
  );

  act(() => { screen.getByText("start").click(); });

  await waitFor(() =>
    expect(screen.getByTestId("facts-status").textContent).toBe("error"),
  );

  // fetchCrest should not have been called
  expect(fetchCrest as ReturnType<typeof vi.fn>).not.toHaveBeenCalled();
  expect(screen.getByTestId("crest-status").textContent).toBe("idle");
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/contexts/JourneyContext.test.tsx
```

Expected: FAIL — `crest` property not found on journey context.

- [ ] **Step 3: Implement `JourneyContext.tsx`**

Replace the entire `src/contexts/JourneyContext.tsx` with:

```tsx
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { fetchLegacy, fetchCrest } from "@/lib/legacyClient";
import type {
  LegacyCrest,
  LegacyFacts,
  LegacyResponse,
  LegacyStory,
} from "@/types/legacy";

type PieceStatus = "idle" | "loading" | "ready" | "error";

type Piece<T> = {
  data: T | null;
  status: PieceStatus;
  reason: string | null;
  retry: () => void;
};

type JourneyContextValue = {
  surname: string | null;
  unknownSurname: boolean;
  facts: Piece<LegacyFacts>;
  story: Piece<LegacyStory>;
  crest: Piece<LegacyCrest>;
  startJourney: (surname: string) => Promise<void>;
  reset: () => void;
};

const Ctx = createContext<JourneyContextValue | null>(null);

type InternalState = {
  surname: string | null;
  unknownSurname: boolean;
  facts: { data: LegacyFacts | null; status: PieceStatus; reason: string | null };
  story: { data: LegacyStory | null; status: PieceStatus; reason: string | null };
  crest: { data: LegacyCrest | null; status: PieceStatus; reason: string | null };
};

const INITIAL: InternalState = {
  surname: null,
  unknownSurname: false,
  facts: { data: null, status: "idle", reason: null },
  story: { data: null, status: "idle", reason: null },
  crest: { data: null, status: "idle", reason: null },
};

export function JourneyProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<InternalState>(INITIAL);
  const surnameRef = useRef<string | null>(null);
  const factsRef = useRef<LegacyFacts | null>(null);

  const runCrestFetch = useCallback(async (surname: string, facts: LegacyFacts) => {
    setState((s) => ({ ...s, crest: { data: null, status: "loading", reason: null } }));
    try {
      const crest = await fetchCrest(surname, facts);
      setState((s) => ({ ...s, crest: { data: crest, status: "ready", reason: null } }));
    } catch (err) {
      setState((s) => ({
        ...s,
        crest: { data: null, status: "error", reason: (err as Error).message },
      }));
    }
  }, []);

  const crestRetry = useCallback(() => {
    const current = surnameRef.current;
    const facts = factsRef.current;
    if (!current || !facts) return;
    void runCrestFetch(current, facts);
  }, [runCrestFetch]);

  const applyResponse = useCallback((resp: LegacyResponse) => {
    if (resp.code === "UNKNOWN_SURNAME") {
      setState((s) => ({
        ...s,
        unknownSurname: true,
        facts: { data: null, status: "error", reason: "unknown surname" },
        story: { data: null, status: "error", reason: "skipped" },
        crest: { data: null, status: "error", reason: "skipped" },
      }));
      return;
    }
    const factsErr = resp.errors.find((e) => e.which === "facts");
    const storyErr = resp.errors.find((e) => e.which === "story");
    const factsReady = !factsErr && !!resp.facts;

    if (factsReady) {
      factsRef.current = resp.facts!;
    }

    setState((s) => ({
      ...s,
      unknownSurname: false,
      facts: factsReady
        ? { data: resp.facts!, status: "ready", reason: null }
        : { data: null, status: "error", reason: factsErr?.reason ?? "no facts" },
      story: storyErr || !resp.story
        ? { data: null, status: "error", reason: storyErr?.reason ?? "no story" }
        : { data: resp.story, status: "ready", reason: null },
    }));

    if (factsReady && surnameRef.current) {
      void runCrestFetch(surnameRef.current, resp.facts!);
    }
  }, [runCrestFetch]);

  const runFetch = useCallback(async (surname: string) => {
    setState((s) => ({
      ...s,
      surname,
      unknownSurname: false,
      facts: { data: null, status: "loading", reason: null },
      story: { data: null, status: "loading", reason: null },
      crest: { data: null, status: "idle", reason: null },
    }));
    surnameRef.current = surname;
    factsRef.current = null;
    try {
      const resp = await fetchLegacy(surname);
      if (surnameRef.current !== surname) return;
      applyResponse(resp);
    } catch (err) {
      if (surnameRef.current !== surname) return;
      const reason = (err as Error).message;
      setState((s) => ({
        ...s,
        facts: { data: null, status: "error", reason },
        story: { data: null, status: "error", reason: "skipped: network" },
        crest: { data: null, status: "error", reason: "skipped: network" },
      }));
    }
  }, [applyResponse]);

  const retry = useCallback(() => {
    const current = surnameRef.current;
    if (!current) return;
    void runFetch(current);
  }, [runFetch]);

  const startJourney = useCallback(async (surname: string) => {
    await runFetch(surname);
  }, [runFetch]);

  const reset = useCallback(() => {
    surnameRef.current = null;
    factsRef.current = null;
    setState(INITIAL);
  }, []);

  const value = useMemo<JourneyContextValue>(() => ({
    surname: state.surname,
    unknownSurname: state.unknownSurname,
    facts: { ...state.facts, retry },
    story: { ...state.story, retry },
    crest: { ...state.crest, retry: crestRetry },
    startJourney,
    reset,
  }), [state, retry, crestRetry, startJourney, reset]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useJourney(): JourneyContextValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useJourney must be used inside JourneyProvider");
  return v;
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run src/contexts/JourneyContext.test.tsx
```

Expected: all 6 tests pass (3 existing + 3 new).

- [ ] **Step 5: Run full suite to confirm no regressions**

```bash
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/contexts/JourneyContext.tsx src/contexts/JourneyContext.test.tsx
git commit -m "feat: add crest piece to JourneyContext, fires when facts ready"
```

---

## Task 8: `Stop4CrestForge` — replace placeholder with real crest image

**Context:** The current component uses a local `forged` boolean state + `onComplete` callback. We replace that with `crest.status` from context. The generic `CrestHero` is removed. The generated `<img>` is displayed when ready. `ForgeLoader` now uses `loop` instead of `onComplete`.

**Files:**
- Modify: `src/pages/journey/Stop4CrestForge.tsx`

- [ ] **Step 1: Replace `Stop4CrestForge.tsx`**

Replace the entire file with:

```tsx
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import SectionLabel from "@/components/journey/SectionLabel";
import ForgeLoader from "@/components/journey/ForgeLoader";
import RetryInline from "@/components/journey/RetryInline";
import { useJourney } from "@/contexts/JourneyContext";

const FORGE_MESSAGES = [
  "Consulting the archives…",
  "Melting the gold…",
  "Inscribing the motto…",
];

const Stop4CrestForge = () => {
  const navigate = useNavigate();
  const { unknownSurname, surname, facts, crest } = useJourney();

  useEffect(() => {
    if (unknownSurname) navigate("/journey/1", { replace: true });
    else if (!surname) navigate("/journey/1", { replace: true });
  }, [unknownSurname, surname, navigate]);

  if (!surname) return null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-24">
      <SectionLabel>THE FORGE</SectionLabel>

      {(crest.status === "idle" || crest.status === "loading") && (
        <ForgeLoader messages={FORGE_MESSAGES} loop />
      )}

      {crest.status === "error" && (
        <div className="mt-10">
          <RetryInline onRetry={crest.retry} />
        </div>
      )}

      {crest.status === "ready" && crest.data && (
        <motion.div className="flex w-full flex-col items-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex w-full max-w-5xl justify-center"
          >
            {/* Amber glow */}
            <div
              className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{
                width: "900px",
                height: "900px",
                background:
                  "radial-gradient(circle at center, hsla(30, 80%, 50%, 0.18) 0%, transparent 60%)",
              }}
            />
            <img
              src={crest.data.imageUrl}
              alt={`${facts.data?.displaySurname ?? surname} family crest`}
              className="relative z-10 w-full max-w-2xl rounded-[22px]"
              style={{ maxHeight: "70vh", objectFit: "contain" }}
            />
          </motion.div>

          {facts.status === "loading" && (
            <p className="mt-4 font-serif text-sm italic text-amber-dim">
              Inscribing the motto…
            </p>
          )}

          {facts.status === "error" && (
            <div className="mt-4">
              <RetryInline onRetry={facts.retry} />
            </div>
          )}

          {facts.status === "ready" && facts.data && (
            <>
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="mt-2 text-center"
              >
                <p className="font-serif text-2xl italic text-amber-light">
                  {facts.data.mottoLatin}
                </p>
                <p className="mt-2 font-sans text-sm tracking-[2px] text-amber-dim">
                  {facts.data.mottoEnglish.toUpperCase()}
                </p>
              </motion.div>

              <motion.div
                initial="hidden"
                animate="show"
                variants={{
                  hidden: {},
                  show: { transition: { staggerChildren: 0.2, delayChildren: 1.2 } },
                }}
                className="mt-12 grid w-full max-w-4xl grid-cols-2 gap-4 md:grid-cols-4"
              >
                {facts.data.symbolism.map((s) => (
                  <motion.div
                    key={s.element}
                    variants={{
                      hidden: { opacity: 0, y: 10 },
                      show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
                    }}
                    className="rounded-[14px] border border-amber-dim/20 bg-card/50 p-5 text-center"
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
            </>
          )}

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
    </div>
  );
};

export default Stop4CrestForge;
```

- [ ] **Step 2: Run full test suite**

```bash
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/pages/journey/Stop4CrestForge.tsx
git commit -m "feat: Stop4 displays real AI crest from generate-crest edge function"
```

- [ ] **Step 4: Push to origin**

```bash
git push origin main
```

Lovable will redeploy automatically. Once deployed, entering a surname at Stop 1 triggers crest generation in the background. Stop 4 shows `ForgeLoader` cycling until the image is ready, then the AI-generated crest fades in with the amber glow, motto, and symbolism cards.

---

## Self-Review

**Spec coverage check:**
- ✅ `surname_crests` table + `crests` storage bucket — Task 1
- ✅ `LegacyCrest` type in both files — Task 2
- ✅ `generate-crest` edge function with cache, DALL-E 3, storage — Tasks 3 + 4
- ✅ `fetchCrest` in legacyClient — Task 5
- ✅ `ForgeLoader` loop prop — Task 6
- ✅ `JourneyContext` crest piece, fires when facts ready — Task 7
- ✅ `Stop4CrestForge` replaced placeholder — Task 8

**Placeholder scan:** No TBDs, all code is complete.

**Type consistency:** `LegacyCrest`, `GenerateCrestOpts`, `fetchCrest`, `crest: Piece<LegacyCrest>` — consistent across all tasks.
