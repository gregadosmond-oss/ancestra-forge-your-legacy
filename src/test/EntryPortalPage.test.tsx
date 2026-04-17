import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import EntryPortalPage from "@/pages/EntryPortalPage";

// Mock navigation
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

// Mock ambient audio module
vi.mock("@/lib/ambientAudio", () => ({
  startAmbientAudio: vi.fn(),
}));

const renderPage = () =>
  render(
    <MemoryRouter>
      <EntryPortalPage />
    </MemoryRouter>
  );

describe("EntryPortalPage", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
  });

  it("renders the crest image", () => {
    renderPage();
    expect(screen.getByAltText("AncestorsQR crest")).toBeInTheDocument();
  });

  it("renders the welcome headline", () => {
    renderPage();
    expect(screen.getByText("Welcome to AncestorsQR")).toBeInTheDocument();
  });

  it("renders the Begin Your Journey button", () => {
    renderPage();
    expect(screen.getByRole("button", { name: /begin your experience/i })).toBeInTheDocument();
  });

  it("navigates to /home on button click", () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /begin your experience/i }));
    expect(mockNavigate).toHaveBeenCalledWith("/home");
  });

  it("renders a background video element", () => {
    renderPage();
    expect(document.querySelector("video")).toBeInTheDocument();
  });
});
