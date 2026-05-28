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
    expect(screen.getByText("Free")).toBeInTheDocument();
    expect(screen.getByText("Legacy")).toBeInTheDocument();
    expect(screen.getByText("Physical Book")).toBeInTheDocument();
  });

  it("renders the Legacy price", () => {
    renderComponent();
    expect(screen.getByText("$29.99")).toBeInTheDocument();
  });

  it("renders the Most Popular badge", () => {
    renderComponent();
    expect(screen.getByText("Most Popular")).toBeInTheDocument();
  });

  it("renders CTA buttons with correct links", () => {
    renderComponent();
    const startFreeLink = screen.getByRole("link", { name: /create free account/i });
    expect(startFreeLink).toHaveAttribute("href", "/signup");

    const unlockLink = screen.getByRole("link", { name: /unlock your legacy/i });
    expect(unlockLink).toHaveAttribute("href", "/signup");

    const shopLink = screen.getByRole("link", { name: /order the book/i });
    expect(shopLink).toHaveAttribute("href", "/shop");
  });

  it("renders free items list", () => {
    renderComponent();
    expect(screen.getByText("Surname Lookup")).toBeInTheDocument();
  });

  it("renders legacy items list with all 10 tools", () => {
    renderComponent();
    expect(screen.getByText("Forge Your Crest")).toBeInTheDocument();
    expect(
      screen.getByText("Complete all 10 tools to unlock your digital novel")
    ).toBeInTheDocument();
  });

  it("renders book items list", () => {
    renderComponent();
    expect(screen.getByText("Everything in Legacy")).toBeInTheDocument();
  });

  it("does not render Deep Legacy link", () => {
    renderComponent();
    expect(screen.queryByText(/deep legacy/i)).not.toBeInTheDocument();
  });
});
