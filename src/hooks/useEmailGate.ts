import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "journey_email_captured";

/**
 * Shared email-gate helper used by Stop1 and every Free Tool entry point.
 * - `gateOpen` controls the JourneyGate modal visibility.
 * - `requestProceed(fn)` runs `fn` immediately if email already captured
 *   OR the user is already authenticated; otherwise opens the gate and
 *   stores `fn` to run after success.
 * - `handleGateSuccess()` should be passed to JourneyGate's onSuccess.
 */
export function useEmailGate() {
  const [gateOpen, setGateOpen] = useState(false);
  const [pending, setPending] = useState<(() => void) | null>(null);

  const isCaptured = () => {
    try {
      return sessionStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  };

  const markCaptured = () => {
    try {
      sessionStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // sessionStorage may be unavailable; continue regardless.
    }
  };

  const requestProceed = useCallback((fn: () => void) => {
    if (isCaptured()) {
      fn();
      return;
    }

    // Check auth session — authenticated users skip the gate entirely.
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (session?.user) {
          markCaptured();
          fn();
          return;
        }
        setPending(() => fn);
        setGateOpen(true);
      })
      .catch(() => {
        setPending(() => fn);
        setGateOpen(true);
      });
  }, []);

  const handleGateSuccess = useCallback(() => {
    setGateOpen(false);
    if (pending) {
      pending();
      setPending(null);
    }
  }, [pending]);

  return { gateOpen, requestProceed, handleGateSuccess };
}
