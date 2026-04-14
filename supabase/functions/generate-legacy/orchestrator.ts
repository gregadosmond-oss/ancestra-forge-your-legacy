import type { LegacyFacts, LegacyResponse, LegacyStory } from "./types.ts";
import type { DbClient } from "./db_client.ts";
import { normalizeSurname, readFacts, writeFacts } from "./cache.ts";
import { writeLog } from "./logs.ts";

export type OrchestratorOpts = {
  client: DbClient;
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

  const errors: Array<{ which: "facts" | "story"; reason: string }> = [];
  if (factsResult.error) {
    errors.push({ which: "facts", reason: factsResult.error });
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
    errors.push({ which: "story", reason: storyErr });
  }

  return {
    code: "OK",
    facts: factsResult.facts,
    story,
    errors,
  };
}
