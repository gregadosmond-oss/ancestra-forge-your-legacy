import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import Stop4CrestForge from "@/pages/journey/Stop4CrestForge";

vi.mock("@/contexts/JourneyContext", () => ({
  useJourney: vi.fn(),
}));
import { useJourney } from "@/contexts/JourneyContext";

const BASE = {
  surname: "Reilly",
  unknownSurname: false,
  facts: { data: null, status: "idle" as const, reason: null, retry: vi.fn() },
  story: { data: null, status: "idle" as const, reason: null, retry: vi.fn() },
  startJourney: vi.fn(),
  reset: vi.fn(),
};

function renderStop4(crest: ReturnType<typeof useJourney>["crest"]) {
  (useJourney as ReturnType<typeof vi.fn>).mockReturnValue({ ...BASE, crest });
  return render(
    <MemoryRouter>
      <Stop4CrestForge />
    </MemoryRouter>,
  );
}

describe("Stop4CrestForge", () => {
  it("shows ForgeLoader while crest is loading", () => {
    renderStop4({ data: null, status: "loading", reason: null, retry: vi.fn() });
    // ForgeLoader renders the first message
    expect(screen.getByText("Consulting the archives…")).toBeInTheDocument();
  });

  it("shows ForgeLoader while crest is idle", () => {
    renderStop4({ data: null, status: "idle", reason: null, retry: vi.fn() });
    expect(screen.getByText("Consulting the archives…")).toBeInTheDocument();
  });

  it("shows RetryInline on crest error", () => {
    renderStop4({ data: null, status: "error", reason: "boom", retry: vi.fn() });
    // RetryInline renders a retry button
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("shows crest image when ready", () => {
    renderStop4({
      data: { imageUrl: "https://storage.example.com/crests/reilly.png" },
      status: "ready",
      reason: null,
      retry: vi.fn(),
    });
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "https://storage.example.com/crests/reilly.png");
    expect(img).toHaveAttribute("alt", expect.stringContaining("Reilly"));
  });

  it("does not render CrestHero (placeholder removed)", () => {
    renderStop4({
      data: { imageUrl: "https://storage.example.com/crests/reilly.png" },
      status: "ready",
      reason: null,
      retry: vi.fn(),
    });
    // CrestHero renders an SVG with data-testid="crest-hero" — should be gone
    expect(document.querySelector('[data-testid="crest-hero"]')).toBeNull();
  });
});
