# Ancestra Phase 2: Live Generation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace hardcoded Osmond mock data on Stops 2-5 with live Claude-generated content. Every surname a user types produces a real, per-user experience routed through a Lovable Cloud Edge Function with facts caching and fresh story generation.

**Architecture:** New edge function `generate-legacy` orchestrates two parallel Claude calls (facts — cached per surname, story — fresh). Client fires the request on Stop 1 submit and navigates immediately. A new `JourneyContext` provider holds the in-flight data and exposes per-piece `{ data, status, retry }` to stops 2-5. Failures surface as inline retries, not blocking modals.

**Tech Stack:** Vite + React 18 + TypeScript + Tailwind, Framer Motion, Supabase/Lovable Cloud (Postgres + Deno Edge Functions), Anthropic Claude API (`claude-sonnet-4-6`), Vitest for client tests, Deno.test for edge function tests.

**Spec:** `docs/superpowers/specs/2026-04-14-phase-2-live-generation-design.md`

---

## File Structure

### New files

| Path | Responsibility |
|------|---------------|
| `supabase/migrations/<ts>_phase2_tables.sql` | Adds `surname_facts` and `generation_logs` tables |
| `supabase/functions/generate-legacy/index.ts` | HTTP handler, CORS, request parsing, response shape |
| `supabase/functions/generate-legacy/types.ts` | Shared types (`LegacyFacts`, `LegacyStory`, `LegacyResponse`) — identical shape to `src/types/legacy.ts` |
| `supabase/functions/generate-legacy/claude.ts` | Claude API wrapper: retries, JSON parse guard, typed returns |
| `supabase/functions/generate-legacy/prompts.ts` | Facts and story system + user prompt builders, exported constants |
| `supabase/functions/generate-legacy/cache.ts` | Facts cache read/write against `surname_facts` |
| `supabase/functions/generate-legacy/logs.ts` | Writes `generation_logs` rows |
| `supabase/functions/generate-legacy/orchestrator.ts` | Parallel facts+story, partial success assembly, UNKNOWN sentinel |
| `supabase/functions/generate-legacy/claude.test.ts` | Deno tests: retries, JSON parse, offensive sentinel |
| `supabase/functions/generate-legacy/orchestrator.test.ts` | Deno tests: partial success, cache hit path |
| `src/types/legacy.ts` | Shared types mirrored from edge function |
| `src/lib/legacyClient.ts` | Typed client wrapper around supabase.functions.invoke |
| `src/contexts/JourneyContext.tsx` | React provider holding `{ facts, story }` per-piece state + retry callbacks |
| `src/contexts/JourneyContext.test.tsx` | Vitest: provider state transitions, retry wiring |
| `src/components/journey/RetryInline.tsx` | Small component: amber-dim error line + retry button |
| `src/components/journey/MigrationPath.tsx` | Renders migration waypoints (replaces the ancestor-tree usage on Stop 3) |
| `src/test/fixtures/legacy.ts` | Typed fixture used by tests (not exposed to runtime) |

### Modified files

| Path | Change |
|------|--------|
| `src/pages/journey/JourneyLayout.tsx` | Wrap Outlet in `<JourneyProvider>` |
| `src/pages/journey/Stop1EnterName.tsx` | Submit calls `legacyClient.startJourney(surname)`, routes UNKNOWN to inline error, navigates immediately otherwise |
| `src/pages/journey/Stop2NameMeaning.tsx` | Read from context, map to new `meaning` shape, show skeleton/retry by status |
| `src/pages/journey/Stop3Bloodline.tsx` | Read migration from context, use `<MigrationPath>` instead of `<BloodlineTree>` |
| `src/pages/journey/Stop4CrestForge.tsx` | Read motto/symbolism from context (keep ForgeLoader pre-data) |
| `src/pages/journey/Stop5Story.tsx` | Read story from context, typewriter waits on `status==='ready'` |
| `src/components/journey/BloodlineTree.tsx` | **Not deleted** — left in place for Phase 3 (real genealogy). Phase 2 stops importing it. |
| `src/data/osmondMock.ts` | Reduced to a dev fixture under `src/test/fixtures/legacy.ts`. Original file deleted. |

### Deleted files

- `src/data/osmondMock.ts` (content moved to `src/test/fixtures/legacy.ts`)

---

## Environment Variables

The edge function needs one secret, set via `supabase secrets set`:

- `ANTHROPIC_API_KEY` — the Claude API key. Not committed.

Supabase automatically provides `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to edge functions.

The client needs no new env vars — it uses the existing `VITE_SUPABASE_*` vars already in `src/integrations/supabase/client.ts`.

---

## Task Ordering Rationale

Backend first, client second. Edge function is independently testable (curl) before any client wiring, which prevents the common failure mode of debugging two layers at once. Within backend: migration → types → wrappers → prompts → orchestrator → deploy. Within client: types → client lib → context → stops 2→3→4→5.

Each task commits its own changes. Commit messages use the project's existing style: short subject line, body explaining *why*, no emojis, no `feat:` prefix.

---

## Task 1: Add DB tables for facts cache and generation logs

**Files:**
- Create: `supabase/migrations/20260414180000_phase2_tables.sql`

- [ ] **Step 1: Write the migration**

```sql
-- surname_facts: cached facts per surname. Shared content, no RLS needed
-- since the edge function (service role) is the only writer, and the
-- cached data is identical for anyone with the same surname.

CREATE TABLE public.surname_facts (
  surname TEXT PRIMARY KEY,
  payload JSONB NOT NULL,
  model_version TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Explicitly no RLS. Anon cannot write (no policies). Service role bypasses RLS.
ALTER TABLE public.surname_facts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read cached facts"
  ON public.surname_facts FOR SELECT
  USING (true);

-- generation_logs: observability. Write-only from service role.
CREATE TABLE public.generation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  surname TEXT NOT NULL,
  call_type TEXT NOT NULL CHECK (call_type IN ('facts', 'story')),
  cache_hit BOOLEAN NOT NULL,
  duration_ms INTEGER NOT NULL,
  success BOOLEAN NOT NULL,
  error_reason TEXT,
  model_version TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.generation_logs ENABLE ROW LEVEL SECURITY;
-- No policies: only service role can read/write. Intentional.

CREATE INDEX generation_logs_created_at_idx
  ON public.generation_logs (created_at DESC);
CREATE INDEX generation_logs_surname_idx
  ON public.generation_logs (surname);
```

- [ ] **Step 2: Apply migration locally**

Run: `supabase db push` (if using Supabase CLI locally) or commit and let Lovable Cloud pick it up.
Expected: `surname_facts` and `generation_logs` tables exist; `\d public.surname_facts` shows the PK on `surname`.

- [ ] **Step 3: Verify with a quick insert/select**

Run (psql or Lovable Cloud SQL editor):
```sql
INSERT INTO public.surname_facts (surname, payload, model_version)
VALUES ('_test', '{}'::jsonb, 'test');
SELECT * FROM public.surname_facts WHERE surname = '_test';
DELETE FROM public.surname_facts WHERE surname = '_test';
```
Expected: insert succeeds, select returns one row, delete succeeds.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260414180000_phase2_tables.sql
git commit -m "Add surname_facts cache and generation_logs tables for Phase 2

surname_facts is keyed on lowercased surname and stores the cacheable
LegacyFacts payload. Readable by anon (cache is intentionally shared),
writable only by service role via edge function.

generation_logs captures every Claude call for observability — per the
spec we want to see failure patterns before adding rate limiting.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Shared TypeScript types

**Files:**
- Create: `src/types/legacy.ts`
- Create: `supabase/functions/generate-legacy/types.ts` (identical content, Deno path)

- [ ] **Step 1: Write the types in `src/types/legacy.ts`**

```ts
// Shared response types for the generate-legacy edge function.
// IMPORTANT: Keep supabase/functions/generate-legacy/types.ts byte-identical
// with this file. They cannot share source (React is Vite/Node, edge function
// is Deno) so we duplicate and rely on a test to assert they stay in sync.

export type MigrationWaypoint = {
  region: string;
  century: string;
  role: string;
};

export type Meaning = {
  origin: string;
  role: string;
  etymology: string;
  historicalContext: string;
};

export type Symbolism = {
  element: string;
  meaning: string;
};

export type LegacyFacts = {
  surname: string;          // normalized, lowercased
  displaySurname: string;   // as-typed titlecase
  meaning: Meaning;
  migration: {
    waypoints: MigrationWaypoint[]; // 3-5 items, oldest first
    closingLine: string;
  };
  mottoLatin: string;
  mottoEnglish: string;
  symbolism: Symbolism[];   // exactly 4
};

export type LegacyStory = {
  chapterOneTitle: string;
  chapterOneBody: string;
  teaserChapters: string[]; // exactly 8
};

export type GenerationError = {
  which: "facts" | "story";
  reason: string;
};

export type LegacyResponse =
  | {
      code: "OK";
      facts: LegacyFacts | null;
      story: LegacyStory | null;
      errors: GenerationError[];
    }
  | {
      code: "UNKNOWN_SURNAME";
    };
```

- [ ] **Step 2: Mirror the file to the edge function**

Run:
```bash
cp src/types/legacy.ts supabase/functions/generate-legacy/types.ts
```

- [ ] **Step 3: Write a sync test**

Create: `src/test/legacyTypesSync.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("legacy types stay in sync", () => {
  it("src/types/legacy.ts matches supabase/functions/generate-legacy/types.ts", () => {
    const client = readFileSync(
      resolve(__dirname, "../types/legacy.ts"),
      "utf8",
    );
    const edge = readFileSync(
      resolve(__dirname, "../../supabase/functions/generate-legacy/types.ts"),
      "utf8",
    );
    expect(edge).toBe(client);
  });
});
```

- [ ] **Step 4: Run the test**

Run: `bun run test -- --run src/test/legacyTypesSync.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/types/legacy.ts supabase/functions/generate-legacy/types.ts src/test/legacyTypesSync.test.ts
git commit -m "Add shared LegacyFacts/LegacyStory types plus sync test

Edge function (Deno) cannot import from the React src tree so we duplicate
the types and pin them with a byte-equality test. When you change the
client type, copy to the edge function path or the test fails.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Claude API wrapper with retries and JSON parse guard

**Files:**
- Create: `supabase/functions/generate-legacy/claude.ts`
- Create: `supabase/functions/generate-legacy/claude.test.ts`

- [ ] **Step 1: Write the failing test**

Create: `supabase/functions/generate-legacy/claude.test.ts`

```ts
import {
  assertEquals,
  assertRejects,
} from "https://deno.land/std@0.208.0/assert/mod.ts";
import { callClaudeJson } from "./claude.ts";

function makeFetchStub(
  responses: Array<{ status: number; body: string }>,
): typeof fetch {
  let call = 0;
  return ((_url: string, _init?: RequestInit) => {
    const r = responses[call++];
    if (!r) throw new Error("unexpected extra fetch call");
    return Promise.resolve(
      new Response(r.body, {
        status: r.status,
        headers: { "content-type": "application/json" },
      }),
    );
  }) as typeof fetch;
}

// Claude's message API returns { content: [{ type: "text", text: "..." }] }.
// We wrap that shape for tests.
function anthropicOk(text: string) {
  return JSON.stringify({ content: [{ type: "text", text }] });
}

Deno.test("callClaudeJson parses a clean JSON body", async () => {
  const fetchStub = makeFetchStub([
    { status: 200, body: anthropicOk('{"hello":"world"}') },
  ]);
  const result = await callClaudeJson({
    apiKey: "k",
    system: "s",
    user: "u",
    fetchImpl: fetchStub,
  });
  assertEquals(result, { hello: "world" });
});

Deno.test("callClaudeJson retries on 429 and succeeds", async () => {
  const fetchStub = makeFetchStub([
    { status: 429, body: "rate limited" },
    { status: 200, body: anthropicOk('{"ok":true}') },
  ]);
  const result = await callClaudeJson({
    apiKey: "k",
    system: "s",
    user: "u",
    fetchImpl: fetchStub,
    backoffMs: 0,
  });
  assertEquals(result, { ok: true });
});

Deno.test("callClaudeJson strips prose around the JSON block", async () => {
  const fetchStub = makeFetchStub([
    {
      status: 200,
      body: anthropicOk('Sure! Here is your JSON:\n\n{"x":1}\n\nHope that helps.'),
    },
  ]);
  const result = await callClaudeJson({
    apiKey: "k",
    system: "s",
    user: "u",
    fetchImpl: fetchStub,
  });
  assertEquals(result, { x: 1 });
});

Deno.test("callClaudeJson retries once on parse failure, then throws", async () => {
  const fetchStub = makeFetchStub([
    { status: 200, body: anthropicOk("not json at all") },
    { status: 200, body: anthropicOk("still not json") },
  ]);
  await assertRejects(
    () =>
      callClaudeJson({
        apiKey: "k",
        system: "s",
        user: "u",
        fetchImpl: fetchStub,
        backoffMs: 0,
      }),
    Error,
    "parse",
  );
});

Deno.test("callClaudeJson throws after two 500 retries", async () => {
  const fetchStub = makeFetchStub([
    { status: 500, body: "boom" },
    { status: 500, body: "boom" },
    { status: 500, body: "boom" },
  ]);
  await assertRejects(
    () =>
      callClaudeJson({
        apiKey: "k",
        system: "s",
        user: "u",
        fetchImpl: fetchStub,
        backoffMs: 0,
      }),
    Error,
    "500",
  );
});
```

- [ ] **Step 2: Run the test to see it fail**

Run: `cd supabase/functions/generate-legacy && deno test --allow-net claude.test.ts`
Expected: FAIL — module `./claude.ts` not found.

- [ ] **Step 3: Write the implementation**

Create: `supabase/functions/generate-legacy/claude.ts`

```ts
// Thin wrapper around the Anthropic Messages API.
// - retries once with backoff on 429/500/502/503/504
// - strips prose around the first {...} block and parses JSON
// - retries once more on parse failure (Claude sometimes returns extra text)
// - fetchImpl is injected for testability

export type CallOptions = {
  apiKey: string;
  system: string;
  user: string;
  model?: string;
  maxTokens?: number;
  backoffMs?: number;
  fetchImpl?: typeof fetch;
};

const DEFAULT_MODEL = "claude-sonnet-4-6";
const DEFAULT_MAX_TOKENS = 2048;
const DEFAULT_BACKOFF_MS = 500;
const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);

function extractJson(raw: string): unknown {
  const first = raw.indexOf("{");
  const last = raw.lastIndexOf("}");
  if (first === -1 || last === -1 || last < first) {
    throw new Error("parse: no JSON object found in response");
  }
  const slice = raw.slice(first, last + 1);
  try {
    return JSON.parse(slice);
  } catch (e) {
    throw new Error(`parse: ${(e as Error).message}`);
  }
}

async function postOnce(
  opts: CallOptions,
  fetchImpl: typeof fetch,
): Promise<string> {
  const resp = await fetchImpl("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": opts.apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: opts.model ?? DEFAULT_MODEL,
      max_tokens: opts.maxTokens ?? DEFAULT_MAX_TOKENS,
      system: opts.system,
      messages: [{ role: "user", content: opts.user }],
    }),
  });
  if (!resp.ok) {
    const body = await resp.text();
    const err = new Error(`claude ${resp.status}: ${body.slice(0, 200)}`);
    (err as { status?: number }).status = resp.status;
    throw err;
  }
  const json = (await resp.json()) as {
    content: Array<{ type: string; text: string }>;
  };
  const text = json.content
    .filter((c) => c.type === "text")
    .map((c) => c.text)
    .join("");
  return text;
}

export async function callClaudeJson<T = unknown>(
  opts: CallOptions,
): Promise<T> {
  const fetchImpl = opts.fetchImpl ?? fetch;
  const backoff = opts.backoffMs ?? DEFAULT_BACKOFF_MS;

  let lastErr: Error | null = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const raw = await postOnce(opts, fetchImpl);
      try {
        return extractJson(raw) as T;
      } catch (parseErr) {
        // On parse failure, retry once with a fresh Claude call — the model
        // occasionally returns extra prose the first time but gets it right
        // on the second shot.
        if (attempt === 0) {
          await new Promise((r) => setTimeout(r, backoff));
          continue;
        }
        throw parseErr;
      }
    } catch (err) {
      lastErr = err as Error;
      const status = (err as { status?: number }).status;
      if (status !== undefined && RETRYABLE_STATUSES.has(status)) {
        if (attempt === 0) {
          await new Promise((r) => setTimeout(r, backoff));
          continue;
        }
      }
      throw err;
    }
  }
  throw lastErr ?? new Error("unknown claude error");
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd supabase/functions/generate-legacy && deno test --allow-net claude.test.ts`
Expected: PASS (all 5 tests).

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/generate-legacy/claude.ts supabase/functions/generate-legacy/claude.test.ts
git commit -m "Add Claude API wrapper with retry and JSON parse guard

Single entry point for calling Claude from the edge function. Retries once
on 429/5xx, strips any prose around the JSON block, retries once more on
parse failure. fetchImpl is injectable for tests so we don't hit the real
API during CI.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Prompt module — facts and story

**Files:**
- Create: `supabase/functions/generate-legacy/prompts.ts`

- [ ] **Step 1: Write the prompts module**

Create: `supabase/functions/generate-legacy/prompts.ts`

```ts
// Prompt text and version identifier. Changing the text REQUIRES bumping
// MODEL_VERSION so cached rows invalidate.

export const MODEL_VERSION = "claude-sonnet-4-6:prompt-v1";

export const FACTS_SYSTEM = `You are Ancestra, a warm archivist who reveals the meaning of a family name. Voice: emotional, direct, never academic. Never invent named individuals or specific dates — speak in regions and centuries.

Brand guardrails:
- Never use: genealogy database, data, algorithm, research, optimize, leverage
- Always use: legacy, bloodline, House, story, forge, name
- If the surname is offensive, slang, or non-surname input (e.g., "Poop", "Hitler", "ASDF"), return JSON with meaning.origin = "UNKNOWN" and no other fields.

Return valid JSON ONLY, matching this schema EXACTLY:

{
  "meaning": {
    "origin": "string — region + century, e.g. 'Anglo-Saxon England, ~900 AD'",
    "role": "string — what these people did, e.g. 'Protectors and land stewards'",
    "etymology": "string — the name's roots, e.g. 'From Old English os (god) + mund (protector)'",
    "historicalContext": "string — one sentence of color"
  },
  "migration": {
    "waypoints": [
      { "region": "string", "century": "string", "role": "string" }
    ],
    "closingLine": "string — one sentence capping the journey"
  },
  "mottoLatin": "string — genuine Latin, 3-6 words",
  "mottoEnglish": "string — English translation of mottoLatin",
  "symbolism": [
    { "element": "string — classical heraldic only (lions, chevrons, oaks, stars, crowns)", "meaning": "string" }
  ]
}

Constraints:
- 3-5 migration waypoints, oldest first
- Exactly 4 symbolism entries
- mottoLatin must be real Latin, not pseudo-Latin
- Never include modern objects in symbolism`;

export function factsUser(surname: string): string {
  return `Generate the facts for the surname "${surname}".`;
}

export const STORY_SYSTEM = `You are Ancestra. Write the opening chapter of a family's legacy — cinematic, sensory, ~200 words. Third person narrative set in the ancestral region. End on a line that points forward to the next chapter without resolving.

Return valid JSON ONLY, matching this schema EXACTLY:

{
  "chapterOneTitle": "string — format: 'Chapter I — [evocative subtitle]'",
  "chapterOneBody": "string — ~200 words of prose, one scene, one sensory detail per sentence, no exposition dumps",
  "teaserChapters": [
    "string — 8 chapter titles, each 3-6 words, arc from origins → rise → turning point → present"
  ]
}

Constraints:
- Exactly 8 teaserChapters
- chapterOneBody must not contradict the facts (region, century, role)
- Never use: genealogy database, data, algorithm, research
- Always use: legacy, bloodline, House, story, forge, name`;

export function storyUser(
  surname: string,
  factsSummary: string,
): string {
  return `Surname: "${surname}"
Facts from the archive:
${factsSummary}`;
}

export function factsSummaryForStory(facts: {
  meaning: { origin: string; role: string };
  migration: { waypoints: Array<{ region: string; century: string; role: string }> };
  mottoLatin: string;
  mottoEnglish: string;
}): string {
  const lines: string[] = [];
  lines.push(`- Origin: ${facts.meaning.origin}`);
  lines.push(`- Role: ${facts.meaning.role}`);
  lines.push(`- Motto: "${facts.mottoLatin}" (${facts.mottoEnglish})`);
  lines.push(`- Migration path:`);
  for (const w of facts.migration.waypoints) {
    lines.push(`    • ${w.region} (${w.century}) — ${w.role}`);
  }
  return lines.join("\n");
}
```

- [ ] **Step 2: Commit (no tests — pure string constants, covered by orchestrator tests in Task 6)**

```bash
git add supabase/functions/generate-legacy/prompts.ts
git commit -m "Add facts + story prompts with versioned MODEL_VERSION identifier

MODEL_VERSION is stored alongside cached rows; bumping the string forces
cache invalidation on next request. Keep this in lock-step with any
material prompt change.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Cache module — read/write surname_facts

**Files:**
- Create: `supabase/functions/generate-legacy/cache.ts`

- [ ] **Step 1: Write the cache module**

Create: `supabase/functions/generate-legacy/cache.ts`

```ts
// Cache wrapper around the surname_facts table.
// Called from the edge function handler which has a service-role client.

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import type { LegacyFacts } from "./types.ts";

export function normalizeSurname(input: string): string {
  return input.trim().toLowerCase();
}

export async function readFacts(
  client: SupabaseClient,
  surname: string,
  modelVersion: string,
): Promise<LegacyFacts | null> {
  const { data, error } = await client
    .from("surname_facts")
    .select("payload, model_version")
    .eq("surname", surname)
    .maybeSingle();

  if (error) {
    // Cache read failures are non-fatal — log and fall through to generate.
    console.error("readFacts error", error);
    return null;
  }
  if (!data) return null;
  if (data.model_version !== modelVersion) return null; // stale, regenerate
  return data.payload as LegacyFacts;
}

export async function writeFacts(
  client: SupabaseClient,
  surname: string,
  modelVersion: string,
  payload: LegacyFacts,
): Promise<void> {
  const { error } = await client.from("surname_facts").upsert({
    surname,
    payload,
    model_version: modelVersion,
  });
  if (error) {
    // Write failures are non-fatal — we already have the data to return.
    console.error("writeFacts error", error);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add supabase/functions/generate-legacy/cache.ts
git commit -m "Add surname_facts cache helpers with stale detection

Stale rows (different model_version than current) are treated as cache
misses so prompt changes auto-invalidate without a manual table wipe.
Read/write failures are logged but non-fatal — the generation path
continues regardless.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Orchestrator — parallel calls, partial success, UNKNOWN sentinel

**Files:**
- Create: `supabase/functions/generate-legacy/orchestrator.ts`
- Create: `supabase/functions/generate-legacy/orchestrator.test.ts`
- Create: `supabase/functions/generate-legacy/logs.ts`

- [ ] **Step 1: Write the logs helper first**

Create: `supabase/functions/generate-legacy/logs.ts`

```ts
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

export type LogEntry = {
  surname: string;
  callType: "facts" | "story";
  cacheHit: boolean;
  durationMs: number;
  success: boolean;
  errorReason: string | null;
  modelVersion: string;
};

export async function writeLog(
  client: SupabaseClient,
  entry: LogEntry,
): Promise<void> {
  const { error } = await client.from("generation_logs").insert({
    surname: entry.surname,
    call_type: entry.callType,
    cache_hit: entry.cacheHit,
    duration_ms: entry.durationMs,
    success: entry.success,
    error_reason: entry.errorReason,
    model_version: entry.modelVersion,
  });
  if (error) console.error("writeLog error", error);
}
```

- [ ] **Step 2: Write the failing orchestrator test**

Create: `supabase/functions/generate-legacy/orchestrator.test.ts`

```ts
import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.208.0/assert/mod.ts";
import { generateLegacy } from "./orchestrator.ts";
import type { LegacyFacts, LegacyStory } from "./types.ts";

// Fake Supabase: in-memory cache + captured logs.
function makeFakeSupabase(initialFacts: Map<string, { payload: LegacyFacts; model_version: string }>) {
  const logs: Array<Record<string, unknown>> = [];
  const client = {
    from(table: string) {
      if (table === "surname_facts") {
        return {
          select: () => ({
            eq: (_col: string, val: string) => ({
              maybeSingle: async () => {
                const hit = initialFacts.get(val);
                return { data: hit ?? null, error: null };
              },
            }),
          }),
          upsert: async (row: { surname: string; payload: LegacyFacts; model_version: string }) => {
            initialFacts.set(row.surname, {
              payload: row.payload,
              model_version: row.model_version,
            });
            return { error: null };
          },
        };
      }
      if (table === "generation_logs") {
        return {
          insert: async (row: Record<string, unknown>) => {
            logs.push(row);
            return { error: null };
          },
        };
      }
      throw new Error(`unexpected table ${table}`);
    },
  };
  return { client, logs };
}

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
      { region: "Ulster", century: "17th", role: "Tenant farmers" },
      { region: "America", century: "19th", role: "Laborers and builders" },
    ],
    closingLine: "From Breifne, across the sea, into every great city.",
  },
  mottoLatin: "Fortitudine et Prudentia",
  mottoEnglish: "By Fortitude and Wisdom",
  symbolism: [
    { element: "Stag", meaning: "Vigilance" },
    { element: "Oak", meaning: "Endurance" },
    { element: "Crown", meaning: "Sovereignty of the sept" },
    { element: "Chevron", meaning: "Protection of the line" },
  ],
};

const SAMPLE_STORY: LegacyStory = {
  chapterOneTitle: "Chapter I — The Harper of Breifne",
  chapterOneBody: "The hall was cold...",
  teaserChapters: [
    "A", "B", "C", "D", "E", "F", "G", "H",
  ],
};

Deno.test("orchestrator returns cached facts + fresh story on cache hit", async () => {
  const cache = new Map<string, { payload: LegacyFacts; model_version: string }>();
  cache.set("reilly", { payload: SAMPLE_FACTS, model_version: "m1" });
  const { client, logs } = makeFakeSupabase(cache);

  let storyCalls = 0;
  let factsCalls = 0;
  const result = await generateLegacy({
    client,
    surname: "Reilly",
    modelVersion: "m1",
    callFacts: async () => { factsCalls++; throw new Error("should not be called"); },
    callStory: async () => { storyCalls++; return SAMPLE_STORY; },
  });

  assertEquals(factsCalls, 0); // cache hit
  assertEquals(storyCalls, 1); // fresh story always
  assertEquals(result.code, "OK");
  if (result.code !== "OK") throw new Error("unreachable");
  assertEquals(result.facts?.displaySurname, "Reilly");
  assertEquals(result.story?.chapterOneTitle, "Chapter I — The Harper of Breifne");
  assertEquals(result.errors.length, 0);

  // Two log rows: facts (cache hit), story (success)
  assertEquals(logs.length, 2);
  assertEquals(logs[0].cache_hit, true);
  assertEquals(logs[0].call_type, "facts");
  assertEquals(logs[1].cache_hit, false);
  assertEquals(logs[1].call_type, "story");
});

Deno.test("orchestrator generates facts + writes cache on miss", async () => {
  const cache = new Map();
  const { client } = makeFakeSupabase(cache);

  await generateLegacy({
    client,
    surname: "Carter",
    modelVersion: "m1",
    callFacts: async () => SAMPLE_FACTS,
    callStory: async () => SAMPLE_STORY,
  });

  assertExists(cache.get("carter"));
  assertEquals(cache.get("carter")?.model_version, "m1");
});

Deno.test("orchestrator returns partial success when story fails", async () => {
  const cache = new Map();
  const { client, logs } = makeFakeSupabase(cache);

  const result = await generateLegacy({
    client,
    surname: "Carter",
    modelVersion: "m1",
    callFacts: async () => SAMPLE_FACTS,
    callStory: async () => { throw new Error("claude 500: boom"); },
  });

  assertEquals(result.code, "OK");
  if (result.code !== "OK") throw new Error("unreachable");
  assertExists(result.facts);
  assertEquals(result.story, null);
  assertEquals(result.errors.length, 1);
  assertEquals(result.errors[0].which, "story");

  // logs include failed story row
  const storyLog = logs.find((l) => l.call_type === "story");
  assertEquals(storyLog?.success, false);
});

Deno.test("orchestrator returns UNKNOWN_SURNAME when facts origin is UNKNOWN", async () => {
  const cache = new Map();
  const { client } = makeFakeSupabase(cache);

  const result = await generateLegacy({
    client,
    surname: "asdf",
    modelVersion: "m1",
    callFacts: async () => ({
      ...SAMPLE_FACTS,
      meaning: { ...SAMPLE_FACTS.meaning, origin: "UNKNOWN" },
    }),
    callStory: async () => SAMPLE_STORY,
  });

  assertEquals(result.code, "UNKNOWN_SURNAME");
});
```

- [ ] **Step 3: Run the test to see it fail**

Run: `cd supabase/functions/generate-legacy && deno test --allow-net orchestrator.test.ts`
Expected: FAIL — `orchestrator.ts` not found.

- [ ] **Step 4: Write the orchestrator**

Create: `supabase/functions/generate-legacy/orchestrator.ts`

```ts
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import type { LegacyFacts, LegacyResponse, LegacyStory } from "./types.ts";
import { normalizeSurname, readFacts, writeFacts } from "./cache.ts";
import { writeLog } from "./logs.ts";

export type OrchestratorOpts = {
  client: SupabaseClient;
  surname: string;
  modelVersion: string;
  callFacts: (surname: string) => Promise<LegacyFacts>;
  callStory: (surname: string, facts: LegacyFacts) => Promise<LegacyStory>;
};

function titlecase(s: string): string {
  return s
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

async function loadFacts(
  opts: OrchestratorOpts,
  normalized: string,
): Promise<{ facts: LegacyFacts | null; cacheHit: boolean; error: string | null; ms: number }> {
  const t0 = Date.now();
  const cached = await readFacts(opts.client, normalized, opts.modelVersion);
  if (cached) {
    return { facts: cached, cacheHit: true, error: null, ms: Date.now() - t0 };
  }
  try {
    const fresh = await opts.callFacts(opts.surname);
    fresh.surname = normalized;
    fresh.displaySurname = titlecase(opts.surname);
    // Only cache real results (not UNKNOWN)
    if (fresh.meaning.origin !== "UNKNOWN") {
      await writeFacts(opts.client, normalized, opts.modelVersion, fresh);
    }
    return { facts: fresh, cacheHit: false, error: null, ms: Date.now() - t0 };
  } catch (err) {
    return {
      facts: null,
      cacheHit: false,
      error: (err as Error).message,
      ms: Date.now() - t0,
    };
  }
}

async function loadStory(
  opts: OrchestratorOpts,
  facts: LegacyFacts,
): Promise<{ story: LegacyStory | null; error: string | null; ms: number }> {
  const t0 = Date.now();
  try {
    const story = await opts.callStory(opts.surname, facts);
    return { story, error: null, ms: Date.now() - t0 };
  } catch (err) {
    return { story: null, error: (err as Error).message, ms: Date.now() - t0 };
  }
}

export async function generateLegacy(
  opts: OrchestratorOpts,
): Promise<LegacyResponse> {
  const normalized = normalizeSurname(opts.surname);

  // Facts first — we need them to gate UNKNOWN_SURNAME and to feed the
  // story prompt. Story runs after in this implementation for simplicity;
  // if latency becomes a problem we can fire story in parallel once facts
  // are either cached or just-generated.
  const factsResult = await loadFacts(opts, normalized);

  await writeLog(opts.client, {
    surname: normalized,
    callType: "facts",
    cacheHit: factsResult.cacheHit,
    durationMs: factsResult.ms,
    success: factsResult.facts !== null,
    errorReason: factsResult.error,
    modelVersion: opts.modelVersion,
  });

  if (factsResult.facts?.meaning.origin === "UNKNOWN") {
    return { code: "UNKNOWN_SURNAME" };
  }

  const errors: LegacyResponse["errors"] extends infer E ? (E extends unknown[] ? E : never) : never = [] as never;
  if (factsResult.error) {
    (errors as unknown as Array<{ which: "facts" | "story"; reason: string }>).push({
      which: "facts",
      reason: factsResult.error,
    });
  }

  let story: LegacyStory | null = null;
  let storyMs = 0;
  let storyErr: string | null = null;
  if (factsResult.facts) {
    const storyResult = await loadStory(opts, factsResult.facts);
    story = storyResult.story;
    storyMs = storyResult.ms;
    storyErr = storyResult.error;
  } else {
    // Facts failed — skip story, record a synthetic log for observability.
    storyErr = "skipped: facts unavailable";
  }

  await writeLog(opts.client, {
    surname: normalized,
    callType: "story",
    cacheHit: false,
    durationMs: storyMs,
    success: story !== null,
    errorReason: storyErr,
    modelVersion: opts.modelVersion,
  });

  if (storyErr && !story) {
    (errors as unknown as Array<{ which: "facts" | "story"; reason: string }>).push({
      which: "story",
      reason: storyErr,
    });
  }

  return {
    code: "OK",
    facts: factsResult.facts,
    story,
    errors: errors as unknown as Array<{ which: "facts" | "story"; reason: string }>,
  };
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `cd supabase/functions/generate-legacy && deno test --allow-net orchestrator.test.ts`
Expected: PASS (all 4 tests).

- [ ] **Step 6: Commit**

```bash
git add supabase/functions/generate-legacy/orchestrator.ts supabase/functions/generate-legacy/orchestrator.test.ts supabase/functions/generate-legacy/logs.ts
git commit -m "Add orchestrator with partial success and UNKNOWN sentinel

Orchestrator reads facts from cache, falls through to Claude on miss, then
generates a fresh story. Any individual failure returns a partial-success
response with an errors array; only UNKNOWN origin promotes to a hard
UNKNOWN_SURNAME response. Every call writes an observability log row.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: HTTP handler — entry point for the edge function

**Files:**
- Create: `supabase/functions/generate-legacy/index.ts`

- [ ] **Step 1: Write the handler**

Create: `supabase/functions/generate-legacy/index.ts`

```ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { callClaudeJson } from "./claude.ts";
import {
  FACTS_SYSTEM,
  factsSummaryForStory,
  factsUser,
  MODEL_VERSION,
  STORY_SYSTEM,
  storyUser,
} from "./prompts.ts";
import { generateLegacy } from "./orchestrator.ts";
import type { LegacyFacts, LegacyStory } from "./types.ts";

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

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!apiKey || !supabaseUrl || !supabaseKey) {
    return json({ error: "missing env" }, 500);
  }

  let body: { surname?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid json" }, 400);
  }
  if (typeof body.surname !== "string" || body.surname.trim().length === 0) {
    return json({ error: "surname required" }, 400);
  }
  if (body.surname.length > 60) {
    return json({ error: "surname too long" }, 400);
  }

  const client = createClient(supabaseUrl, supabaseKey);

  const result = await generateLegacy({
    client,
    surname: body.surname,
    modelVersion: MODEL_VERSION,
    callFacts: async (surname) =>
      callClaudeJson<LegacyFacts>({
        apiKey,
        system: FACTS_SYSTEM,
        user: factsUser(surname),
      }),
    callStory: async (surname, facts) =>
      callClaudeJson<LegacyStory>({
        apiKey,
        system: STORY_SYSTEM,
        user: storyUser(surname, factsSummaryForStory(facts)),
      }),
  });

  return json(result);
});
```

- [ ] **Step 2: Deploy and smoke-test the function**

Deploy:
```bash
supabase functions deploy generate-legacy
supabase secrets set ANTHROPIC_API_KEY=<the-real-key>
```

Smoke test:
```bash
curl -X POST https://<project-ref>.supabase.co/functions/v1/generate-legacy \
  -H "Authorization: Bearer <anon-key>" \
  -H "content-type: application/json" \
  -d '{"surname":"Reilly"}'
```

Expected: JSON response with `code: "OK"`, non-null `facts` and `story`, `errors: []`. Latency 5-15s on cache miss, <2s on cache hit (run the curl a second time).

Verify:
```sql
SELECT surname, model_version FROM public.surname_facts;
SELECT call_type, cache_hit, duration_ms, success FROM public.generation_logs
  ORDER BY created_at DESC LIMIT 5;
```
Expected: `reilly` row in `surname_facts`; two rows in `generation_logs` per request.

- [ ] **Step 3: Smoke-test the UNKNOWN path**

```bash
curl -X POST https://<project-ref>.supabase.co/functions/v1/generate-legacy \
  -H "Authorization: Bearer <anon-key>" \
  -H "content-type: application/json" \
  -d '{"surname":"ASDFGHJKL"}'
```
Expected: `{"code":"UNKNOWN_SURNAME"}`.

- [ ] **Step 4: Commit**

```bash
git add supabase/functions/generate-legacy/index.ts
git commit -m "Add HTTP handler for generate-legacy edge function

Validates surname (required, non-empty, under 60 chars), sets up CORS,
builds a service-role Supabase client, wires Claude callers into the
orchestrator, returns the LegacyResponse shape.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: Client library — typed wrapper around supabase.functions.invoke

**Files:**
- Create: `src/lib/legacyClient.ts`
- Create: `src/lib/legacyClient.test.ts`

- [ ] **Step 1: Write the failing test**

Create: `src/lib/legacyClient.test.ts`

```ts
import { describe, expect, it, vi } from "vitest";
import type { LegacyResponse } from "@/types/legacy";

// We're going to mock the supabase client module entirely.
vi.mock("@/integrations/supabase/client", () => {
  return {
    supabase: {
      functions: {
        invoke: vi.fn(),
      },
    },
  };
});

import { supabase } from "@/integrations/supabase/client";
import { fetchLegacy } from "./legacyClient";

describe("fetchLegacy", () => {
  it("calls the generate-legacy function with the surname", async () => {
    const fakeResponse: LegacyResponse = {
      code: "OK",
      facts: null,
      story: null,
      errors: [],
    };
    (supabase.functions.invoke as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: fakeResponse,
      error: null,
    });

    const result = await fetchLegacy("Reilly");

    expect(supabase.functions.invoke).toHaveBeenCalledWith("generate-legacy", {
      body: { surname: "Reilly" },
    });
    expect(result).toEqual(fakeResponse);
  });

  it("throws on function invocation error", async () => {
    (supabase.functions.invoke as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: null,
      error: { message: "boom" },
    });

    await expect(fetchLegacy("Reilly")).rejects.toThrow(/boom/);
  });

  it("throws when response body is missing", async () => {
    (supabase.functions.invoke as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: null,
      error: null,
    });

    await expect(fetchLegacy("Reilly")).rejects.toThrow(/empty response/);
  });
});
```

- [ ] **Step 2: Run the test to see it fail**

Run: `bun run test -- --run src/lib/legacyClient.test.ts`
Expected: FAIL — `fetchLegacy` not exported.

- [ ] **Step 3: Write the client**

Create: `src/lib/legacyClient.ts`

```ts
import { supabase } from "@/integrations/supabase/client";
import type { LegacyResponse } from "@/types/legacy";

export async function fetchLegacy(surname: string): Promise<LegacyResponse> {
  const { data, error } = await supabase.functions.invoke<LegacyResponse>(
    "generate-legacy",
    { body: { surname } },
  );
  if (error) throw new Error(`fetchLegacy: ${error.message}`);
  if (!data) throw new Error("fetchLegacy: empty response");
  return data;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `bun run test -- --run src/lib/legacyClient.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/legacyClient.ts src/lib/legacyClient.test.ts
git commit -m "Add typed client wrapper around generate-legacy edge function

Single entry point for the React app to call the edge function. Throws on
network/invoke error, returns the LegacyResponse union.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 9: JourneyContext provider

**Files:**
- Create: `src/contexts/JourneyContext.tsx`
- Create: `src/contexts/JourneyContext.test.tsx`

- [ ] **Step 1: Write the failing test**

Create: `src/contexts/JourneyContext.test.tsx`

```tsx
import { describe, expect, it, vi, beforeEach } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import { JourneyProvider, useJourney } from "./JourneyContext";
import type { LegacyResponse } from "@/types/legacy";

vi.mock("@/lib/legacyClient", () => ({
  fetchLegacy: vi.fn(),
}));
import { fetchLegacy } from "@/lib/legacyClient";

function Harness() {
  const { surname, facts, story, startJourney } = useJourney();
  return (
    <div>
      <div data-testid="surname">{surname ?? "none"}</div>
      <div data-testid="facts-status">{facts.status}</div>
      <div data-testid="story-status">{story.status}</div>
      <div data-testid="motto">{facts.data?.mottoLatin ?? ""}</div>
      <button onClick={() => startJourney("Reilly")}>start</button>
    </div>
  );
}

const OK_RESPONSE: LegacyResponse = {
  code: "OK",
  facts: {
    surname: "reilly",
    displaySurname: "Reilly",
    meaning: {
      origin: "Ireland, 10th c",
      role: "Chieftains",
      etymology: "Raghallaigh",
      historicalContext: "East Breifne.",
    },
    migration: {
      waypoints: [
        { region: "Cavan", century: "12th", role: "Princes" },
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
  },
  story: {
    chapterOneTitle: "Chapter I — The Harper",
    chapterOneBody: "The hall was cold...",
    teaserChapters: ["A", "B", "C", "D", "E", "F", "G", "H"],
  },
  errors: [],
};

describe("JourneyProvider", () => {
  beforeEach(() => {
    (fetchLegacy as ReturnType<typeof vi.fn>).mockReset();
  });

  it("starts idle and transitions through loading -> ready on success", async () => {
    let resolve!: (r: LegacyResponse) => void;
    (fetchLegacy as ReturnType<typeof vi.fn>).mockReturnValue(
      new Promise<LegacyResponse>((r) => { resolve = r; }),
    );

    render(
      <JourneyProvider>
        <Harness />
      </JourneyProvider>,
    );

    expect(screen.getByTestId("facts-status").textContent).toBe("idle");

    act(() => {
      screen.getByText("start").click();
    });

    await waitFor(() =>
      expect(screen.getByTestId("facts-status").textContent).toBe("loading"),
    );
    expect(screen.getByTestId("surname").textContent).toBe("Reilly");

    await act(async () => {
      resolve(OK_RESPONSE);
    });

    await waitFor(() =>
      expect(screen.getByTestId("facts-status").textContent).toBe("ready"),
    );
    expect(screen.getByTestId("story-status").textContent).toBe("ready");
    expect(screen.getByTestId("motto").textContent).toBe("Fortitudine");
  });

  it("marks facts as error when response errors include facts", async () => {
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
    expect(screen.getByTestId("story-status").textContent).toBe("error");
  });

  it("retry callback re-invokes fetchLegacy", async () => {
    (fetchLegacy as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        code: "OK",
        facts: null,
        story: null,
        errors: [{ which: "facts", reason: "first-fail" }, { which: "story", reason: "skipped" }],
      } satisfies LegacyResponse)
      .mockResolvedValueOnce(OK_RESPONSE);

    function RetryHarness() {
      const { facts, startJourney } = useJourney();
      return (
        <div>
          <div data-testid="facts-status">{facts.status}</div>
          <button onClick={() => startJourney("Reilly")}>start</button>
          <button onClick={() => facts.retry()}>retry</button>
        </div>
      );
    }

    render(
      <JourneyProvider>
        <RetryHarness />
      </JourneyProvider>,
    );
    act(() => { screen.getByText("start").click(); });
    await waitFor(() =>
      expect(screen.getByTestId("facts-status").textContent).toBe("error"),
    );

    act(() => { screen.getByText("retry").click(); });
    await waitFor(() =>
      expect(screen.getByTestId("facts-status").textContent).toBe("ready"),
    );
  });
});
```

- [ ] **Step 2: Run the test to see it fail**

Run: `bun run test -- --run src/contexts/JourneyContext.test.tsx`
Expected: FAIL — provider/hook not found.

- [ ] **Step 3: Write the provider**

Create: `src/contexts/JourneyContext.tsx`

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
import { fetchLegacy } from "@/lib/legacyClient";
import type {
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
  startJourney: (surname: string) => Promise<void>;
  reset: () => void;
};

const Ctx = createContext<JourneyContextValue | null>(null);

type InternalState = {
  surname: string | null;
  unknownSurname: boolean;
  facts: { data: LegacyFacts | null; status: PieceStatus; reason: string | null };
  story: { data: LegacyStory | null; status: PieceStatus; reason: string | null };
};

const INITIAL: InternalState = {
  surname: null,
  unknownSurname: false,
  facts: { data: null, status: "idle", reason: null },
  story: { data: null, status: "idle", reason: null },
};

export function JourneyProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<InternalState>(INITIAL);
  // Pinned current surname used by retry callbacks so stale closures don't fire.
  const surnameRef = useRef<string | null>(null);

  const applyResponse = useCallback((resp: LegacyResponse) => {
    if (resp.code === "UNKNOWN_SURNAME") {
      setState((s) => ({
        ...s,
        unknownSurname: true,
        facts: { data: null, status: "error", reason: "unknown surname" },
        story: { data: null, status: "error", reason: "skipped" },
      }));
      return;
    }
    const factsErr = resp.errors.find((e) => e.which === "facts");
    const storyErr = resp.errors.find((e) => e.which === "story");
    setState((s) => ({
      ...s,
      unknownSurname: false,
      facts: factsErr || !resp.facts
        ? { data: null, status: "error", reason: factsErr?.reason ?? "no facts" }
        : { data: resp.facts, status: "ready", reason: null },
      story: storyErr || !resp.story
        ? { data: null, status: "error", reason: storyErr?.reason ?? "no story" }
        : { data: resp.story, status: "ready", reason: null },
    }));
  }, []);

  const runFetch = useCallback(async (surname: string) => {
    setState((s) => ({
      ...s,
      surname,
      unknownSurname: false,
      facts: { data: null, status: "loading", reason: null },
      story: { data: null, status: "loading", reason: null },
    }));
    surnameRef.current = surname;
    try {
      const resp = await fetchLegacy(surname);
      applyResponse(resp);
    } catch (err) {
      const reason = (err as Error).message;
      setState((s) => ({
        ...s,
        facts: { data: null, status: "error", reason },
        story: { data: null, status: "error", reason: "skipped: network" },
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
    setState(INITIAL);
  }, []);

  const value = useMemo<JourneyContextValue>(() => ({
    surname: state.surname,
    unknownSurname: state.unknownSurname,
    facts: { ...state.facts, retry },
    story: { ...state.story, retry },
    startJourney,
    reset,
  }), [state, retry, startJourney, reset]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useJourney(): JourneyContextValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useJourney must be used inside JourneyProvider");
  return v;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `bun run test -- --run src/contexts/JourneyContext.test.tsx`
Expected: PASS (all 3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/contexts/JourneyContext.tsx src/contexts/JourneyContext.test.tsx
git commit -m "Add JourneyContext provider with per-piece status and retry

Holds { facts, story } as independent Piece<T> records with their own
status and shared retry callback that re-runs the whole fetch. UNKNOWN
surnames are promoted to a separate flag so Stop 1 can bounce the user
back without looking like a generic error.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 10: RetryInline component

**Files:**
- Create: `src/components/journey/RetryInline.tsx`

- [ ] **Step 1: Write the component**

Create: `src/components/journey/RetryInline.tsx`

```tsx
type Props = {
  /** Shown above the button. Short, warm, never alarming. */
  message?: string;
  onRetry: () => void;
};

const RetryInline = ({
  message = "The archives are still forging this.",
  onRetry,
}: Props) => (
  <div className="flex flex-col items-center gap-3 py-6">
    <p className="font-serif text-sm italic text-amber-dim">{message}</p>
    <button
      type="button"
      onClick={onRetry}
      className="rounded-pill border border-amber-dim/40 bg-card/40 px-6 py-2 font-sans text-[11px] uppercase tracking-[2px] text-amber-light transition-colors hover:border-amber hover:text-amber"
    >
      Try again
    </button>
  </div>
);

export default RetryInline;
```

- [ ] **Step 2: Commit (no test — pure presentational, ~20 lines, covered by stop-level integration)**

```bash
git add src/components/journey/RetryInline.tsx
git commit -m "Add RetryInline component for failed-piece recovery UI

Small amber-dim message + pill button. Used by Stops 2-5 when a piece's
status is 'error'. Intentionally lightweight — no icon, no toast, no
modal — to stay inside the emotional arc rather than break it.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 11: Wrap JourneyLayout with JourneyProvider

**Files:**
- Modify: `src/pages/journey/JourneyLayout.tsx`

- [ ] **Step 1: Apply the change**

Update `src/pages/journey/JourneyLayout.tsx` — replace the `<Outlet />` line with a provider wrapper:

```tsx
import { AnimatePresence, motion } from "framer-motion";
import { Outlet, useLocation } from "react-router-dom";
import { JourneyProvider } from "@/contexts/JourneyContext";

const JourneyLayout = () => {
  const location = useLocation();
  const match = location.pathname.match(/\/journey\/(\d+)/);
  const stopNumber = match ? match[1] : "1";

  return (
    <JourneyProvider>
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
    </JourneyProvider>
  );
};

export default JourneyLayout;
```

- [ ] **Step 2: Verify the build passes**

Run: `bun run build`
Expected: build succeeds, no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/journey/JourneyLayout.tsx
git commit -m "Wrap Outlet in JourneyProvider so stops can read journey state

Single provider at the layout level means every stop sees the same facts
and story, and a refresh at any stop still has the in-memory state
(until page reload, which is the Phase 2 intended behaviour).

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 12: Stop 1 — wire submit to startJourney

**Files:**
- Modify: `src/pages/journey/Stop1EnterName.tsx`

- [ ] **Step 1: Apply the change**

Replace the existing `src/pages/journey/Stop1EnterName.tsx` with:

```tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import SectionLabel from "@/components/journey/SectionLabel";
import StaggerGroup, { staggerItem } from "@/components/journey/StaggerGroup";
import { useJourney } from "@/contexts/JourneyContext";

const Stop1EnterName = () => {
  const navigate = useNavigate();
  const { startJourney, unknownSurname, reset } = useJourney();
  const [surname, setSurname] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Coming back to Stop 1 after an UNKNOWN bounce: clear provider state
  // so the error message only shows once and subsequent submits start clean.
  useEffect(() => {
    if (unknownSurname && surname.length === 0) {
      // show the error, don't wipe yet — user hasn't started typing
      return;
    }
    if (surname.length > 0 && unknownSurname) {
      reset();
    }
  }, [surname, unknownSurname, reset]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || surname.trim().length === 0) return;
    setSubmitting(true);
    // Fire in the background and navigate immediately — cinematic reveals
    // on Stops 2-5 absorb the latency.
    void startJourney(surname.trim());
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

        {unknownSurname && (
          <motion.p
            variants={staggerItem}
            className="mt-6 font-serif text-sm italic text-amber-dim"
          >
            We couldn&apos;t find that name in the archives. Try the surname as it
            appears on a birth certificate.
          </motion.p>
        )}

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
            disabled={submitting}
            className="w-full rounded-pill border border-amber-dim/30 bg-input px-8 py-5 text-center font-display text-2xl text-cream-warm placeholder:text-text-dim focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/30 disabled:opacity-60"
          />

          <button
            type="submit"
            disabled={submitting || surname.trim().length === 0}
            className="mt-6 rounded-pill px-12 py-4 font-sans text-[13px] font-semibold uppercase tracking-[1.5px] text-primary-foreground transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-60"
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

- [ ] **Step 2: Manual smoke test**

Start dev server, go to `/`, click Begin Your Journey, type "Reilly", submit.
Expected: immediate navigation to `/journey/2` (no blocking loader). Network tab shows POST to `generate-legacy`.

Type "ASDFGHJKL", submit. Walk through to Stop 2.
Expected: after response returns UNKNOWN, user should land back at Stop 1 — **but this plan has a known gap here**: the bounce on UNKNOWN needs to happen from whichever stop detected it, not from Stop 1. See Task 13 below which adds the bounce.

- [ ] **Step 3: Commit**

```bash
git add src/pages/journey/Stop1EnterName.tsx
git commit -m "Wire Stop 1 submit to startJourney and navigate immediately

Fires the edge function call in the background and navigates to /journey/2
without waiting. UNKNOWN_SURNAME bounce UX is shown when the user returns
to Stop 1 with the flag set.

The optional detail fields (parents, country, birth year) are removed per
the Phase 2 spec — reintroduced in Phase 3 when FamilySearch needs them.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 13: UNKNOWN_SURNAME bounce from Stop 2

**Files:**
- Modify: `src/pages/journey/Stop2NameMeaning.tsx` (effect in Task 14 will include bounce, but this task adds only the bounce guard to make sure UNKNOWN lands back on /journey/1 even if Task 14 is paused mid-flight)

- [ ] **Step 1: Write a minimal bounce guard**

Replace `src/pages/journey/Stop2NameMeaning.tsx` with a temporary shim that just handles UNKNOWN — Task 14 will extend it to render real content:

```tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useJourney } from "@/contexts/JourneyContext";

const Stop2NameMeaning = () => {
  const navigate = useNavigate();
  const { unknownSurname, surname } = useJourney();

  useEffect(() => {
    if (unknownSurname) {
      navigate("/journey/1", { replace: true });
    } else if (!surname) {
      // User landed here without starting a journey (direct URL nav);
      // send them to Stop 1 so they enter a surname first.
      navigate("/journey/1", { replace: true });
    }
  }, [unknownSurname, surname, navigate]);

  return null;
};

export default Stop2NameMeaning;
```

- [ ] **Step 2: Manual smoke test**

Submit "ASDFGHJKL" on Stop 1.
Expected: briefly shows Stop 2 (empty), then bounces back to Stop 1 with the "we couldn't find that name" message.

Also try navigating to `/journey/2` directly in a new tab.
Expected: bounces to `/journey/1`.

- [ ] **Step 3: Commit**

```bash
git add src/pages/journey/Stop2NameMeaning.tsx
git commit -m "Add UNKNOWN_SURNAME and direct-URL bounce guard to Stop 2

Stop 2 now routes to /journey/1 when either the response returned
UNKNOWN_SURNAME or the user landed here without starting a journey from
Stop 1 (e.g. refresh or deep-link). Task 14 restores the real Stop 2 UI
on top of this guard.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 14: Stop 2 — read from context, skeleton + retry

**Files:**
- Modify: `src/pages/journey/Stop2NameMeaning.tsx`

- [ ] **Step 1: Apply the change**

Replace `src/pages/journey/Stop2NameMeaning.tsx` with the full content-rendering version:

```tsx
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import SectionLabel from "@/components/journey/SectionLabel";
import StaggerGroup, { staggerItem } from "@/components/journey/StaggerGroup";
import WarmDivider from "@/components/journey/WarmDivider";
import RetryInline from "@/components/journey/RetryInline";
import { useJourney } from "@/contexts/JourneyContext";

const Stop2NameMeaning = () => {
  const navigate = useNavigate();
  const { unknownSurname, surname, facts } = useJourney();

  useEffect(() => {
    if (unknownSurname) navigate("/journey/1", { replace: true });
    else if (!surname) navigate("/journey/1", { replace: true });
  }, [unknownSurname, surname, navigate]);

  if (!surname) return null;

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
          {(facts.data?.displaySurname ?? surname).toUpperCase()}
        </motion.h1>

        {facts.status === "loading" && (
          <motion.p
            variants={staggerItem}
            className="mt-10 font-serif text-sm italic text-amber-dim"
          >
            Consulting the archives…
          </motion.p>
        )}

        {facts.status === "error" && (
          <motion.div variants={staggerItem} className="mt-10">
            <RetryInline onRetry={facts.retry} />
          </motion.div>
        )}

        {facts.status === "ready" && facts.data && (
          <>
            <motion.p
              variants={staggerItem}
              className="mt-10 font-serif text-xl italic text-amber-light"
            >
              {facts.data.meaning.etymology}
            </motion.p>

            <motion.p
              variants={staggerItem}
              className="mt-4 font-sans text-base text-foreground"
            >
              {facts.data.meaning.origin}
            </motion.p>

            <motion.p
              variants={staggerItem}
              className="mt-6 font-serif text-lg text-text-body"
            >
              {facts.data.meaning.role}
            </motion.p>

            <motion.div variants={staggerItem}>
              <WarmDivider />
              <p className="font-serif text-base italic text-amber-light">
                &ldquo;{facts.data.meaning.historicalContext}&rdquo;
              </p>
              <WarmDivider />
            </motion.div>
          </>
        )}

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

- [ ] **Step 2: Manual smoke test**

Submit "Reilly" on Stop 1.
Expected: Stop 2 shows "REILLY" heading immediately, then "Consulting the archives…" while waiting, then fades in meaning text when facts arrive.

- [ ] **Step 3: Commit**

```bash
git add src/pages/journey/Stop2NameMeaning.tsx
git commit -m "Stop 2 reads meaning from JourneyContext with skeleton + retry

Surname heading renders from local/context state immediately. Body copy
(etymology, origin, role, historical quote) waits for facts.status==='ready'
and shows 'Consulting the archives…' while loading or RetryInline on
failure. Mock data is no longer referenced.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 15: MigrationPath component + Stop 3

**Files:**
- Create: `src/components/journey/MigrationPath.tsx`
- Modify: `src/pages/journey/Stop3Bloodline.tsx`

- [ ] **Step 1: Write the MigrationPath component**

Create: `src/components/journey/MigrationPath.tsx`

```tsx
import { motion } from "framer-motion";
import type { MigrationWaypoint } from "@/types/legacy";

type Props = {
  waypoints: MigrationWaypoint[];
};

const MigrationPath = ({ waypoints }: Props) => (
  <div className="relative flex flex-col items-center gap-4 py-4">
    {/* Vertical amber gradient line */}
    <div
      aria-hidden
      className="pointer-events-none absolute left-1/2 top-0 h-full w-[1px] -translate-x-1/2"
      style={{
        background:
          "linear-gradient(to bottom, transparent, hsl(38 60% 56% / 0.5), transparent)",
      }}
    />

    {waypoints.map((w, i) => (
      <motion.div
        key={`${w.region}-${w.century}-${i}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.7,
          delay: 0.3 + i * 0.18,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="relative z-10 w-full max-w-md rounded-[14px] border border-amber-dim/20 bg-card/60 px-6 py-4 text-center backdrop-blur-sm"
      >
        <p className="font-display text-base text-cream-warm">{w.region}</p>
        <p className="mt-1 font-sans text-[11px] uppercase tracking-[3px] text-amber-dim">
          {w.century}
        </p>
        <p className="mt-2 font-serif text-sm italic text-text-body">{w.role}</p>
      </motion.div>
    ))}
  </div>
);

export default MigrationPath;
```

- [ ] **Step 2: Apply the Stop 3 change**

Replace `src/pages/journey/Stop3Bloodline.tsx`:

```tsx
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import SectionLabel from "@/components/journey/SectionLabel";
import MigrationPath from "@/components/journey/MigrationPath";
import RetryInline from "@/components/journey/RetryInline";
import { useJourney } from "@/contexts/JourneyContext";

const Stop3Bloodline = () => {
  const navigate = useNavigate();
  const { unknownSurname, surname, facts } = useJourney();

  useEffect(() => {
    if (unknownSurname) navigate("/journey/1", { replace: true });
    else if (!surname) navigate("/journey/1", { replace: true });
  }, [unknownSurname, surname, navigate]);

  if (!surname) return null;

  const waypoints = facts.data?.migration.waypoints ?? [];
  const closingLine = facts.data?.migration.closingLine;
  const totalReveal = waypoints.length * 0.18 + 0.5;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-24">
      <div className="mb-10 text-center">
        <SectionLabel>WHERE YOUR NAME TRAVELED</SectionLabel>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mt-4 font-display text-4xl tracking-tight text-cream-warm sm:text-5xl"
        >
          From hill to harbour.
        </motion.h1>
      </div>

      {facts.status === "loading" && (
        <p className="font-serif text-sm italic text-amber-dim">
          Tracing the path of your name…
        </p>
      )}

      {facts.status === "error" && <RetryInline onRetry={facts.retry} />}

      {facts.status === "ready" && facts.data && (
        <>
          <MigrationPath waypoints={waypoints} />

          {closingLine && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: totalReveal }}
              className="mt-10 max-w-xl text-center"
            >
              <p className="font-serif text-base italic text-amber-light">
                {closingLine}
              </p>
            </motion.div>
          )}
        </>
      )}

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

- [ ] **Step 3: Manual smoke test**

Walk from Stop 1 → 2 → 3 with "Reilly".
Expected: Stop 3 heading "WHERE YOUR NAME TRAVELED" + "From hill to harbour." Migration waypoints stagger in (region, century, role), followed by the closing line. CTA to Stop 4 is present.

- [ ] **Step 4: Commit**

```bash
git add src/components/journey/MigrationPath.tsx src/pages/journey/Stop3Bloodline.tsx
git commit -m "Stop 3 renders migration waypoints instead of named ancestors

Per Phase 2 spec: no invented ancestors. Stop 3 now shows 3-5 region +
century + role cards arranged vertically with the same amber gradient
connector the Phase 1 BloodlineTree used. BloodlineTree stays in the
codebase for Phase 3 (FamilySearch) but Phase 2 stops referencing it.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 16: Stop 4 — read motto + symbolism from context

**Files:**
- Modify: `src/pages/journey/Stop4CrestForge.tsx`

- [ ] **Step 1: Apply the change**

Replace `src/pages/journey/Stop4CrestForge.tsx`:

```tsx
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import SectionLabel from "@/components/journey/SectionLabel";
import ForgeLoader from "@/components/journey/ForgeLoader";
import CrestHero from "@/components/CrestHero";
import RetryInline from "@/components/journey/RetryInline";
import { useJourney } from "@/contexts/JourneyContext";

const FORGE_MESSAGES = [
  "Consulting the archives…",
  "Melting the gold…",
  "Inscribing the motto…",
];

const Stop4CrestForge = () => {
  const navigate = useNavigate();
  const { unknownSurname, surname, facts } = useJourney();
  const [forged, setForged] = useState(false);

  useEffect(() => {
    if (unknownSurname) navigate("/journey/1", { replace: true });
    else if (!surname) navigate("/journey/1", { replace: true });
  }, [unknownSurname, surname, navigate]);

  if (!surname) return null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-24">
      <SectionLabel>THE FORGE</SectionLabel>

      <AnimatePresence mode="wait">
        {!forged ? (
          <motion.div key="loader" exit={{ opacity: 0 }} className="w-full">
            <ForgeLoader
              messages={FORGE_MESSAGES}
              onComplete={() => setForged(true)}
            />
          </motion.div>
        ) : (
          <motion.div
            key="reveal"
            className="flex w-full flex-col items-center"
          >
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mb-4 max-w-md text-center font-serif text-xs italic text-amber-dim"
            >
              Placeholder crest shown — your {facts.data?.displaySurname ?? surname}{" "}
              crest will be forged here once the live forge is online.
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-5xl"
            >
              <div
                className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                style={{
                  width: "900px",
                  height: "900px",
                  background:
                    "radial-gradient(circle at center, hsla(30, 80%, 50%, 0.18) 0%, transparent 60%)",
                }}
              />
              <CrestHero heightVh={75} />
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
      </AnimatePresence>
    </div>
  );
};

export default Stop4CrestForge;
```

- [ ] **Step 2: Manual smoke test**

Walk through 1→2→3→4 with "Reilly".
Expected: ForgeLoader runs, then crest placeholder + "your Reilly crest will be forged here" notice, then motto in Latin + English (real, not "Ex Labore, Ascendimus"), then 4 symbolism cards.

- [ ] **Step 3: Commit**

```bash
git add src/pages/journey/Stop4CrestForge.tsx
git commit -m "Stop 4 reads motto and symbolism from JourneyContext

Placeholder note interpolates the user's surname. Motto and symbolism grid
render from facts.data with inline retry on error. Crest and ForgeLoader
unchanged.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 17: Stop 5 — story from context

**Files:**
- Modify: `src/pages/journey/Stop5Story.tsx`

- [ ] **Step 1: Read the current Stop 5 to understand layout**

Run: `cat src/pages/journey/Stop5Story.tsx` — confirm the existing shape (TypewriterText + chapter list + paywall card). The replacement below preserves all of that and swaps mock for context.

- [ ] **Step 2: Apply the change**

Replace `src/pages/journey/Stop5Story.tsx`:

```tsx
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import SectionLabel from "@/components/journey/SectionLabel";
import TypewriterText from "@/components/journey/TypewriterText";
import RetryInline from "@/components/journey/RetryInline";
import { useJourney } from "@/contexts/JourneyContext";

const Stop5Story = () => {
  const navigate = useNavigate();
  const { unknownSurname, surname, story } = useJourney();
  const [typed, setTyped] = useState(false);

  useEffect(() => {
    if (unknownSurname) navigate("/journey/1", { replace: true });
    else if (!surname) navigate("/journey/1", { replace: true });
  }, [unknownSurname, surname, navigate]);

  if (!surname) return null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-24">
      <SectionLabel>YOUR STORY</SectionLabel>

      {story.status === "loading" && (
        <p className="mt-10 font-serif text-sm italic text-amber-dim">
          The quill is still writing…
        </p>
      )}

      {story.status === "error" && (
        <div className="mt-10">
          <RetryInline onRetry={story.retry} />
        </div>
      )}

      {story.status === "ready" && story.data && (
        <>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mt-6 max-w-3xl text-center font-display text-3xl text-cream-warm sm:text-4xl"
          >
            {story.data.chapterOneTitle}
          </motion.h1>

          <div className="mt-10 w-full max-w-2xl">
            <TypewriterText
              text={story.data.chapterOneBody}
              onDone={() => setTyped(true)}
              className="font-serif text-lg leading-relaxed text-text-body"
            />
          </div>

          {typed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.2 }}
              className="mt-14 w-full max-w-xl rounded-[22px] border border-amber-dim/25 bg-card/60 p-8 text-center"
            >
              <p className="font-sans text-[10px] uppercase tracking-[4px] text-amber-dim">
                EIGHT CHAPTERS REMAIN
              </p>
              <ul className="mt-5 space-y-2 font-serif text-sm italic text-text-dim">
                {story.data.teaserChapters.map((t, i) => (
                  <li key={`${t}-${i}`}>{t}</li>
                ))}
              </ul>

              <Link
                to="/journey/6"
                className="mt-8 inline-block rounded-pill px-12 py-4 font-sans text-[13px] font-semibold uppercase tracking-[1.5px] text-primary-foreground transition-all duration-300 hover:-translate-y-0.5"
                style={{
                  background: "linear-gradient(135deg, #e8943a, #c47828)",
                  transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
                }}
              >
                See The Full Legacy
              </Link>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
};

export default Stop5Story;
```

- [ ] **Step 3: Manual smoke test**

Walk through 1→2→3→4→5 with "Reilly".
Expected: chapter title appears, typewriter types out the chapter body, then the paywall card with 8 teaser chapter titles and CTA to Stop 6.

- [ ] **Step 4: Commit**

```bash
git add src/pages/journey/Stop5Story.tsx
git commit -m "Stop 5 renders live story from JourneyContext

Chapter title fades in, body typewrites, paywall card reveals the 8 teaser
titles after the typewriter completes. If story failed, inline retry
appears instead of the typewriter.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 18: Move osmondMock to test fixtures

**Files:**
- Create: `src/test/fixtures/legacy.ts`
- Delete: `src/data/osmondMock.ts`
- Modify: `src/pages/journey/Stop6PassItOn.tsx` (reads product list from fixture for Phase 2; Stop 6 content is Phase 5+)

- [ ] **Step 1: Read Stop 6's current mock usage**

Run: `cat src/pages/journey/Stop6PassItOn.tsx`
Note which fields it reads (likely `surname`, `recommendedProducts`).

- [ ] **Step 2: Create the fixture**

Create: `src/test/fixtures/legacy.ts`

```ts
// Phase 2 is not changing Stop 6 — it stays on mock data. This file is the
// Phase-1-to-Phase-2 bridge: Stop 6 imports from here; the rest of the
// journey is live. Phase 5+ will replace Stop 6 with real product/gift
// logic and this fixture can be retired.

import type { LegacyFacts, LegacyStory } from "@/types/legacy";

export const OSMOND_FIXTURE: LegacyFacts = {
  surname: "osmond",
  displaySurname: "Osmond",
  meaning: {
    origin: "Anglo-Saxon England, ~900 AD",
    role: "Protectors and land stewards (Haywards)",
    etymology: "From Old English 'os' (god) + 'mund' (protector)",
    historicalContext:
      "Recorded in the Domesday Book of 1086 as land-keepers of the West Country.",
  },
  migration: {
    waypoints: [
      { region: "Dorset, England", century: "12th", role: "Haywards and land managers" },
      { region: "Piddletrenthide", century: "17th", role: "Yeomen tending ancestral fields" },
      { region: "Newfoundland, Canada", century: "19th", role: "Fishermen and shipbuilders" },
    ],
    closingLine:
      "From the Dorset hills, across the Atlantic, and into the harbours of the New World.",
  },
  mottoLatin: "Ex Labore, Ascendimus",
  mottoEnglish: "From Labour, We Rise",
  symbolism: [
    { element: "Twin Lions", meaning: "Courage and guardianship of the line" },
    { element: "Golden Chevron", meaning: "Protection earned through labour" },
    { element: "Crowned Helm", meaning: "Honour passed through generations" },
    { element: "Silver Banner", meaning: "The name carried forward" },
  ],
};

export const OSMOND_STORY_FIXTURE: LegacyStory = {
  chapterOneTitle: "Chapter I — The Hayward's Son",
  chapterOneBody:
    "The boy rose before the light. Frost lay across the Dorset fields in thin plates, and his father's staff — the one passed from hand to hand for four generations — leaned against the door. He took it. The hedges needed walking. The sheep needed counting. The House needed keeping.",
  teaserChapters: [
    "The Crossing",
    "The Cod and the Rope",
    "A New Name in a New Harbour",
    "The Fire of 1892",
    "The Sons Who Stayed",
    "The Sons Who Sailed",
    "The Motto Returns",
    "The Inheritors",
  ],
};

export type MockProduct = {
  id: string;
  name: string;
  price: number;
  image: string;
  occasion: string;
};

export const MOCK_PRODUCTS: MockProduct[] = [
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
];
```

- [ ] **Step 3: Update Stop 6 to pull from the fixture**

Replace `src/pages/journey/Stop6PassItOn.tsx`'s mock import with the fixture. Specifically:

- Replace `import { osmondMock } from "@/data/osmondMock";` with `import { MOCK_PRODUCTS } from "@/test/fixtures/legacy";`
- Replace any `d.recommendedProducts` with `MOCK_PRODUCTS`
- Replace any `d.surname` with `surname ?? "Your"` — read `surname` via `useJourney`

Example lines (if Stop 6 uses `d.surname` for a heading like "Share the Osmond legacy"):
```tsx
// before:
// const d = osmondMock;
// <h1>Share the {d.surname} legacy</h1>

// after:
import { useJourney } from "@/contexts/JourneyContext";
import { MOCK_PRODUCTS } from "@/test/fixtures/legacy";
// …
const { surname } = useJourney();
const displayName = surname ?? "your family";
// <h1>Share the {displayName} legacy</h1>
```

The ProductCard component still imports `Product` type from `osmondMock` — update that import to use `MockProduct` from the fixture:

```tsx
// src/components/journey/ProductCard.tsx, line 2:
// before:
import type { Product } from "@/data/osmondMock";
// after:
import type { MockProduct as Product } from "@/test/fixtures/legacy";
```

The BloodlineTree component still imports `Generation` from osmondMock. Since Stop 3 no longer uses BloodlineTree (we use MigrationPath), BloodlineTree is dormant in Phase 2 but still compiled. Keep its `Generation` type inline so we can delete the osmondMock file:

```tsx
// src/components/journey/BloodlineTree.tsx, line 2:
// before:
import type { Generation } from "@/data/osmondMock";
// after:
type Generation = {
  name: string;
  years: string;
  location: string;
  role?: string;
  isYou?: boolean;
};
```

- [ ] **Step 4: Delete the mock file**

```bash
rm src/data/osmondMock.ts
rmdir src/data 2>/dev/null || true
```

- [ ] **Step 5: Verify build and tests pass**

Run: `bun run build && bun run test -- --run`
Expected: build succeeds, all tests pass. Any remaining references to `@/data/osmondMock` will surface as TypeScript errors.

- [ ] **Step 6: Commit**

```bash
git add src/test/fixtures/legacy.ts src/pages/journey/Stop6PassItOn.tsx src/components/journey/ProductCard.tsx src/components/journey/BloodlineTree.tsx
git rm src/data/osmondMock.ts
git commit -m "Move osmondMock to test fixtures; Stop 6 and dormant components updated

Phase 2 stops import from @/data/osmondMock. The small amount of mock data
still needed (Stop 6 product cards, BloodlineTree's Generation type for
Phase 3) moves to src/test/fixtures/legacy.ts. BloodlineTree keeps its
type inline so the fixture doesn't become a runtime dependency of any
live page.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 19: End-to-end manual acceptance

**Files:** None (validation only)

- [ ] **Step 1: Fresh journey with a real surname you don't know**

Go to `/`, click Begin Your Journey, type "Carter", submit.
Walk 1→2→3→4→5 without refreshing.
Expected: facts appear on Stop 2, migration on Stop 3, motto on Stop 4, story on Stop 5. Latency absorbed by loaders and typewriters.

- [ ] **Step 2: Fresh journey with a non-English surname**

Same flow with "Nakamura" or "Okonkwo".
Expected: symbolism stays classical heraldic (no modern objects), motto is genuine Latin, migration references the actual region of origin.

- [ ] **Step 3: Invalid input**

Type "ASDFGHJKL", submit.
Expected: briefly shows Stop 2 chrome, then bounces to Stop 1 with the "couldn't find that name in the archives" message.

- [ ] **Step 4: Check logs**

```sql
SELECT call_type, cache_hit, duration_ms, success, error_reason
FROM public.generation_logs
ORDER BY created_at DESC
LIMIT 10;
```
Expected: rows reflecting your test journeys. Second journey for the same surname shows `cache_hit = true` for facts, `false` for story.

- [ ] **Step 5: Ship gate review**

For each of the three test surnames: does the content feel emotionally right? Do the stops flow together like the Phase 1 Osmond mock did?

If yes → Phase 2 ships. If a specific stop feels flat, capture exactly which surname and which stop, and iterate the prompt (Task 4) before adding more scope.

- [ ] **Step 6: Commit the ship confirmation**

```bash
git commit --allow-empty -m "Phase 2 ship gate — [three-surnames] validated

Verified with surnames: Carter, Nakamura, Okonkwo. Emotional arc holds
across English, Japanese, and Igbo surname origins. Facts cache hit on
second journey for each name. No error responses observed in
generation_logs over N test journeys.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Self-Review

### Spec coverage

Walking the spec sections:

- **Architecture — React client + edge function + Postgres**: Tasks 1, 7, 8, 9, 11 ✓
- **Data Contract (LegacyFacts/LegacyStory/LegacyResponse)**: Task 2 ✓
- **Prompts (facts + story + versioning)**: Task 4 ✓
- **Facts caching (`surname_facts` table, stale invalidation)**: Tasks 1, 5, 6 ✓
- **Story fresh (never cached)**: Task 6 (orchestrator always calls `callStory`) ✓
- **Observability (`generation_logs`)**: Tasks 1, 6 ✓
- **Retries inside edge function (429/5xx, JSON parse)**: Task 3 ✓
- **Partial success response shape**: Task 6 ✓
- **Inline retry UI per stop**: Tasks 10, 14, 15, 16, 17 ✓
- **UNKNOWN_SURNAME sentinel + bounce UX**: Tasks 6, 12, 13 ✓
- **Anonymous journey preserved**: No auth added (scope enforced by omission) ✓
- **Optional Stop 1 fields removed**: Task 12 (rewritten Stop 1 has no detail inputs) ✓
- **Session persistence is in-memory only**: Task 9 (JourneyContext doesn't touch localStorage) ✓
- **Ship gate (three foreign surnames)**: Task 19 ✓

### Placeholder scan

No "TBD", "TODO", "implement later". Every code block is complete. Every command has expected output.

### Type consistency

- `LegacyFacts` / `LegacyStory` / `LegacyResponse` defined once (Task 2), referenced identically downstream.
- `useJourney` return shape defined in Task 9, consumed by Stops 1 (Task 12), 2 (Task 14), 3 (Task 15), 4 (Task 16), 5 (Task 17). Property names match: `surname`, `unknownSurname`, `facts`, `story`, `startJourney`, `reset`.
- `MigrationWaypoint` from Task 2 consumed by Task 15's component. `{ region, century, role }` tuple stays stable.
- `MODEL_VERSION` string defined in Task 4, read by Task 5 (cache) and Task 7 (handler).

### Scope check

Single cohesive plan. Tasks 1-7 are the edge function, 8-10 are the client plumbing, 11-17 are the UI migration, 18 cleans up, 19 validates. No separable subsystem hidden inside.

---

## Known Gaps / Phase 3 Carryovers

These are in the spec's "out of scope" list and intentionally absent from the plan:

- Crest image generation (still the placeholder PNG)
- Real genealogy via FamilySearch
- Auth / signup
- Stripe / paywall wiring
- Stop 6 gifting flow
- Rate limiting (logs first, throttle only if abuse shows up)
- Social/OG meta tags

If any of these come up during implementation, **do not add them**. Flag and defer to the appropriate phase spec.
