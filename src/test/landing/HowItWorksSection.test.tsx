import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import HowItWorksSection from "@/components/landing/HowItWorksSection";

describe("HowItWorksSection", () => {
  it("renders the section headline", () => {
    render(<HowItWorksSection />);
    expect(
      screen.getByText("Five minutes to discover 900 years.")
    ).toBeInTheDocument();
  });

  it("renders all 3 step card headings", () => {
    render(<HowItWorksSection />);
    expect(screen.getByText("Enter Your Name")).toBeInTheDocument();
    expect(screen.getByText("Your Legacy Unfolds")).toBeInTheDocument();
    expect(screen.getByText("Pass It On")).toBeInTheDocument();
  });

  it("renders step numbers 1, 2, 3", () => {
    render(<HowItWorksSection />);
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });
});
