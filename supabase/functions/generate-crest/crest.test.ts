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

  const result = await generateCrest({
    client,
    surname: "  OSMOND  ",
    facts: SAMPLE_FACTS,
    callDalle: async () => { throw new Error("should not be called"); },
    downloadAndUpload: async () => { throw new Error("should not be called"); },
  });

  assertEquals(result, "https://storage.example.com/crests/osmond.png");
});
