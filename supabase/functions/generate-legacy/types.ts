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

export type LegacyCrest = {
  imageUrl: string;
};
