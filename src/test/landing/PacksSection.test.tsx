import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect } from "vitest";
import PacksSection from "@/components/landing/PacksSection";

describe("PacksSection", () => {
  const renderComponent = () =>
    render(
      <MemoryRouter>
        <PacksSection />
      </MemoryRouter>
    );

  it("renders the section label", () => {
    renderComponent();
    expect(screen.getByText("Choose Your Legacy")).toBeInTheDocument();
  });

  it("renders the section title", () => {
    renderComponent();
    expect(
      screen.getByText("Pick the pack that's right for you")
    ).toBeInTheDocument();
  });

  it("renders all three pack names", () => {
    renderComponent();
    expect(screen.getByText("Explorer")).toBeInTheDocument();
    expect(screen.getByText("Legacy Pack")).toBeInTheDocument();
    expect(screen.getByText("Heirloom Shop")).toBeInTheDocument();
  });

  it("renders the Legacy Pack price", () => {
    renderComponent();
    expect(screen.getByText("$29")).toBeInTheDocument();
  });

  it("renders the Most Popular badge", () => {
    renderComponent();
    expect(screen.getByText("Most Popular")).toBeInTheDocument();
  });

  it("renders CTA buttons with correct links", () => {
    renderComponent();
    const startFreeLink = screen.getByRole("link", { name: /start free/i });
    expect(startFreeLink).toHaveAttribute("href", "/journey");

    const unlockLink = screen.getByRole("link", { name: /unlock my legacy/i });
    expect(unlockLink).toHaveAttribute("href", "/journey");

    const shopLink = screen.getByRole("link", { name: /browse heirloom shop/i });
    expect(shopLink).toHaveAttribute("href", "/shop");
  });

  it("renders free items list", () => {
    renderComponent();
    expect(screen.getByText("Surname meaning & origin")).toBeInTheDocument();
  });

  it("renders legacy pack items list", () => {
    renderComponent();
    expect(
      screen.getByText("Custom coat of arms (hi-res)")
    ).toBeInTheDocument();
  });

  it("renders heirloom items list", () => {
    renderComponent();
    expect(screen.getByText("Legacy Pack included with every item")).toBeInTheDocument();
  });
});
