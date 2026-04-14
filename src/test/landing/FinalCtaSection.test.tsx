import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect } from "vitest";
import FinalCtaSection from "@/components/landing/FinalCtaSection";

describe("FinalCtaSection", () => {
  it("renders the headline", () => {
    render(
      <MemoryRouter>
        <FinalCtaSection />
      </MemoryRouter>
    );
    expect(
      screen.getByText("Every family has a story worth telling.")
    ).toBeInTheDocument();
  });

  it("renders the subtitle", () => {
    render(
      <MemoryRouter>
        <FinalCtaSection />
      </MemoryRouter>
    );
    expect(
      screen.getByText(
        "Yours has been waiting centuries. It takes five minutes to discover it."
      )
    ).toBeInTheDocument();
  });

  it("renders a link to /journey", () => {
    render(
      <MemoryRouter>
        <FinalCtaSection />
      </MemoryRouter>
    );
    const link = screen.getByRole("link", { name: /begin your journey/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/journey");
  });
});
