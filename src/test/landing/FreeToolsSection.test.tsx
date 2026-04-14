import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import FreeToolsSection from "@/components/landing/FreeToolsSection";

describe("FreeToolsSection", () => {
  it("renders the section headline", () => {
    render(<FreeToolsSection />);
    expect(
      screen.getByText("Curious? Start here — no commitment.")
    ).toBeInTheDocument();
  });

  it("renders all 3 tool card headings", () => {
    render(<FreeToolsSection />);
    expect(screen.getByText("Bloodline Quiz")).toBeInTheDocument();
    expect(screen.getByText("Surname Lookup")).toBeInTheDocument();
    expect(screen.getByText("Motto Generator")).toBeInTheDocument();
  });

  it("renders 3 Coming Soon badges", () => {
    render(<FreeToolsSection />);
    const badges = screen.getAllByText("Coming Soon");
    expect(badges).toHaveLength(3);
  });

  it("tool cards have no links", () => {
    render(<FreeToolsSection />);
    const links = document.querySelectorAll("a");
    expect(links).toHaveLength(0);
  });
});
