import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import ProductPreviewSection from "@/components/landing/ProductPreviewSection";

describe("ProductPreviewSection", () => {
  it("renders the section headline", () => {
    render(<ProductPreviewSection />);
    expect(
      screen.getByText("Your complete family legacy, delivered instantly.")
    ).toBeInTheDocument();
  });

  it("renders all 4 product card headings", () => {
    render(<ProductPreviewSection />);
    expect(screen.getByText("Custom Coat of Arms")).toBeInTheDocument();
    expect(screen.getByText("AI Family Story")).toBeInTheDocument();
    expect(screen.getByText("Bloodline Tree")).toBeInTheDocument();
    expect(screen.getByText("Legacy Certificate")).toBeInTheDocument();
  });

  it("renders the $29 price", () => {
    render(<ProductPreviewSection />);
    expect(screen.getByText("$29.99")).toBeInTheDocument();
  });

  it("renders the one-time delivery note", () => {
    render(<ProductPreviewSection />);
    expect(
      screen.getByText("One-time · Instant digital delivery · No subscription")
    ).toBeInTheDocument();
  });
});
