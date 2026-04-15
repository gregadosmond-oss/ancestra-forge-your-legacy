import { describe, expect, it, vi, beforeEach } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import { JourneyProvider, useJourney } from "./JourneyContext";
import type { LegacyResponse } from "@/types/legacy";

vi.mock("@/lib/legacyClient", () => ({
  fetchLegacy: vi.fn(),
  fetchCrest: vi.fn(),
}));
import { fetchLegacy, fetchCrest } from "@/lib/legacyClient";

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
    (fetchCrest as ReturnType<typeof vi.fn>).mockReset();
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

describe("crest piece", () => {
  beforeEach(() => {
    (fetchLegacy as ReturnType<typeof vi.fn>).mockReset();
    (fetchCrest as ReturnType<typeof vi.fn>).mockReset();
  });

  it("transitions idle -> loading -> ready when facts succeed", async () => {
    (fetchLegacy as ReturnType<typeof vi.fn>).mockResolvedValue(OK_RESPONSE);
    (fetchCrest as ReturnType<typeof vi.fn>).mockResolvedValue({
      imageUrl: "https://storage.example.com/crests/reilly.png",
    });

    function CrestHarness() {
      const { crest, startJourney } = useJourney();
      return (
        <div>
          <div data-testid="crest-status">{crest.status}</div>
          <div data-testid="crest-url">{crest.data?.imageUrl ?? ""}</div>
          <button onClick={() => startJourney("Reilly")}>start</button>
        </div>
      );
    }

    render(<JourneyProvider><CrestHarness /></JourneyProvider>);
    expect(screen.getByTestId("crest-status").textContent).toBe("idle");

    act(() => { screen.getByText("start").click(); });
    await waitFor(() =>
      expect(screen.getByTestId("crest-status").textContent).toBe("ready"),
    );
    expect(screen.getByTestId("crest-url").textContent).toBe(
      "https://storage.example.com/crests/reilly.png",
    );
    expect(fetchCrest).toHaveBeenCalledWith("Reilly", OK_RESPONSE.facts);
  });

  it("crest stays idle when facts fail", async () => {
    (fetchLegacy as ReturnType<typeof vi.fn>).mockResolvedValue({
      code: "OK",
      facts: null,
      story: null,
      errors: [{ which: "facts", reason: "boom" }, { which: "story", reason: "skipped" }],
    } satisfies LegacyResponse);

    function CrestHarness() {
      const { crest, startJourney } = useJourney();
      return (
        <div>
          <div data-testid="crest-status">{crest.status}</div>
          <button onClick={() => startJourney("Reilly")}>start</button>
        </div>
      );
    }

    render(<JourneyProvider><CrestHarness /></JourneyProvider>);
    act(() => { screen.getByText("start").click(); });
    await waitFor(() =>
      expect(screen.getByTestId("crest-status").textContent).not.toBe("idle"),
    ).catch(() => {/* stays idle — assertion passes below */});

    // Wait a tick for any async side effects
    await act(async () => {});
    expect(screen.getByTestId("crest-status").textContent).toBe("idle");
    expect(fetchCrest).not.toHaveBeenCalled();
  });

  it("transitions to error when fetchCrest throws", async () => {
    (fetchLegacy as ReturnType<typeof vi.fn>).mockResolvedValue(OK_RESPONSE);
    (fetchCrest as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("DALL-E quota exceeded"),
    );

    function CrestHarness() {
      const { crest, startJourney } = useJourney();
      return (
        <div>
          <div data-testid="crest-status">{crest.status}</div>
          <div data-testid="crest-reason">{crest.reason ?? ""}</div>
          <button onClick={() => startJourney("Reilly")}>start</button>
        </div>
      );
    }

    render(<JourneyProvider><CrestHarness /></JourneyProvider>);
    act(() => { screen.getByText("start").click(); });
    await waitFor(() =>
      expect(screen.getByTestId("crest-status").textContent).toBe("error"),
    );
    expect(screen.getByTestId("crest-reason").textContent).toMatch(/DALL-E quota/);
  });
});
