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
