import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import ForgeLoader from "@/components/journey/ForgeLoader";

describe("ForgeLoader", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const MESSAGES = ["Forging...", "Heating...", "Cooling..."];

  it("renders the first message immediately", () => {
    render(<ForgeLoader messages={MESSAGES} />);
    expect(screen.getByText("Forging...")).toBeInTheDocument();
  });

  it("calls onComplete after all messages when not in loop mode", () => {
    const onComplete = vi.fn();
    render(<ForgeLoader messages={MESSAGES} onComplete={onComplete} perMessageMs={100} />);
    // Advance through all 3 messages (300ms) + the 300ms completion delay
    act(() => { vi.advanceTimersByTime(100); }); // msg 0->1
    act(() => { vi.advanceTimersByTime(100); }); // msg 1->2
    act(() => { vi.advanceTimersByTime(100); }); // msg 2->3 (exhausted)
    act(() => { vi.advanceTimersByTime(300); }); // wait for onComplete
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("loops back to index 0 when loop=true and messages exhausted", () => {
    render(<ForgeLoader messages={MESSAGES} loop perMessageMs={100} />);
    // Exhaust all messages
    act(() => { vi.advanceTimersByTime(100); });
    act(() => { vi.advanceTimersByTime(100); });
    act(() => { vi.advanceTimersByTime(100); });
    // After loop reset, first message should re-appear
    expect(screen.getByText("Forging...")).toBeInTheDocument();
  });

  it("does not call onComplete when loop=true", () => {
    const onComplete = vi.fn();
    render(<ForgeLoader messages={MESSAGES} loop onComplete={onComplete} perMessageMs={100} />);
    // Advance through multiple cycles
    act(() => { vi.advanceTimersByTime(100 * 6); });
    expect(onComplete).not.toHaveBeenCalled();
  });
});
