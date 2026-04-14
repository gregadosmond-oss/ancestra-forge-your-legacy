import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import OccasionsSection from "@/components/landing/OccasionsSection";

describe("OccasionsSection", () => {
  it("renders the section headline", () => {
    render(<OccasionsSection />);
    expect(screen.getByText("The gift they'll never forget.")).toBeInTheDocument();
  });

  it("renders the 4 highlighted occasions", () => {
    render(<OccasionsSection />);
    expect(screen.getByText("Father's Day")).toBeInTheDocument();
    expect(screen.getByText("Christmas")).toBeInTheDocument();
    expect(screen.getByText("Wedding")).toBeInTheDocument();
    expect(screen.getByText("Graduation")).toBeInTheDocument();
  });

  it("renders the 8 standard occasions", () => {
    render(<OccasionsSection />);
    expect(screen.getByText("Birthday")).toBeInTheDocument();
    expect(screen.getByText("Anniversary")).toBeInTheDocument();
    expect(screen.getByText("New Baby")).toBeInTheDocument();
    expect(screen.getByText("Mother's Day")).toBeInTheDocument();
    expect(screen.getByText("Housewarming")).toBeInTheDocument();
    expect(screen.getByText("Retirement")).toBeInTheDocument();
    expect(screen.getByText("Family Reunion")).toBeInTheDocument();
    expect(screen.getByText("Valentine's Day")).toBeInTheDocument();
  });
});
