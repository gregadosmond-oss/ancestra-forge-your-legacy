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
  assertEquals(cache.size, 0); // UNKNOWN must not be cached
});
