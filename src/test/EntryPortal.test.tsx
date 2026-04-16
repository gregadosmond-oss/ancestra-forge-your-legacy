import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import EntryPortal from "@/components/EntryPortal";

describe("EntryPortal", () => {
  it("renders the crest image", () => {
    render(<EntryPortal onEnter={() => {}} />);
    expect(screen.getByAltText("Ancestra crest")).toBeInTheDocument();
  });

  it("renders the welcome headline", () => {
    render(<EntryPortal onEnter={() => {}} />);
    expect(screen.getByText("Welcome to Ancestra")).toBeInTheDocument();
  });

  it("renders the Begin Your Journey button", () => {
    render(<EntryPortal onEnter={() => {}} />);
    expect(screen.getByRole("button", { name: /begin your journey/i })).toBeInTheDocument();
  });

  it("calls onEnter when button is clicked", () => {
    const onEnter = vi.fn();
    render(<EntryPortal onEnter={onEnter} />);
    fireEvent.click(screen.getByRole("button", { name: /begin your journey/i }));
    expect(onEnter).toHaveBeenCalledOnce();
  });
});
