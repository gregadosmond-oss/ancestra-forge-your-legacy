import { describe, expect, it, vi } from "vitest";
import type { LegacyResponse, LegacyFacts } from "@/types/legacy";

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
import { fetchLegacy, fetchCrest } from "./legacyClient";

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

describe("fetchCrest", () => {
  const fakeFacts: LegacyFacts = {
    surname: "bennett",
    displaySurname: "Bennett",
    meaning: {
      origin: "English",
      role: "bow-maker",
      etymology: "from benne, to bless",
      historicalContext: "A craftsman surname.",
    },
    migration: {
      waypoints: [],
      closingLine: "From England to Canada",
    },
    mottoLatin: "Per aspera ad astra",
    mottoEnglish: "Through hardship to the stars",
    symbolism: [
      { element: "eagle", meaning: "strength" },
      { element: "chevron", meaning: "protection" },
      { element: "oak", meaning: "endurance" },
      { element: "sword", meaning: "justice" },
    ],
  };

  it("calls the generate-crest function with surname and facts", async () => {
    (supabase.functions.invoke as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { code: "OK", imageUrl: "https://storage.example.com/crests/bennett.png" },
      error: null,
    });

    const result = await fetchCrest("Bennett", fakeFacts);

    expect(supabase.functions.invoke).toHaveBeenCalledWith("generate-crest", {
      body: { surname: "Bennett", facts: fakeFacts },
    });
    expect(result).toEqual({ imageUrl: "https://storage.example.com/crests/bennett.png" });
  });

  it("throws on invocation error", async () => {
    (supabase.functions.invoke as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: null,
      error: { message: "network failure" },
    });

    await expect(fetchCrest("Bennett", fakeFacts)).rejects.toThrow(/network failure/);
  });

  it("throws when code is not OK", async () => {
    (supabase.functions.invoke as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { code: "ERROR", reason: "image generation failed" },
      error: null,
    });

    await expect(fetchCrest("Bennett", fakeFacts)).rejects.toThrow(/image generation failed/);
  });

  it("throws when imageUrl is missing from OK response", async () => {
    (supabase.functions.invoke as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { code: "OK" },
      error: null,
    });

    await expect(fetchCrest("Bennett", fakeFacts)).rejects.toThrow(/empty response/);
  });
});
