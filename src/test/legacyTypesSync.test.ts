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
