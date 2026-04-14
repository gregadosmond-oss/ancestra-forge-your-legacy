import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect } from "vitest";
import FreeToolsSection from "@/components/landing/FreeToolsSection";

describe("FreeToolsSection", () => {
  it("renders the section headline", () => {
    render(<MemoryRouter><FreeToolsSection /></MemoryRouter>);
    expect(
      screen.getByText("Curious? Start here — no commitment.")
    ).toBeInTheDocument();
  });

  it("renders all 3 tool card headings", () => {
    render(<MemoryRouter><FreeToolsSection /></MemoryRouter>);
    expect(screen.getByText("Bloodline Quiz")).toBeInTheDocument();
    expect(screen.getByText("Surname Lookup")).toBeInTheDocument();
    expect(screen.getByText("Motto Generator")).toBeInTheDocument();
  });

  it("links to the correct tool pages", () => {
    render(<MemoryRouter><FreeToolsSection /></MemoryRouter>);
    expect(screen.getByRole("link", { name: /bloodline quiz/i })).toHaveAttribute("href", "/tools/quiz");
    expect(screen.getByRole("link", { name: /surname lookup/i })).toHaveAttribute("href", "/tools/surname");
    expect(screen.getByRole("link", { name: /motto generator/i })).toHaveAttribute("href", "/tools/motto");
  });

  it("has no Coming Soon badges", () => {
    render(<MemoryRouter><FreeToolsSection /></MemoryRouter>);
    expect(screen.queryByText("Coming Soon")).not.toBeInTheDocument();
  });
});
