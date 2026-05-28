import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { fetchLegacy } from "@/lib/legacyClient";
import type {
  LegacyFacts,
  LegacyCrest,
  LegacyResponse,
  LegacyStory,
} from "@/types/legacy";

type PieceStatus = "idle" | "loading" | "ready" | "error";

type Piece<T> = {
  data: T | null;
  status: PieceStatus;
  reason: string | null;
  retry: () => void;
};

type JourneyContextValue = {
  surname: string | null;
  unknownSurname: boolean;
  facts: Piece<LegacyFacts>;
  story: Piece<LegacyStory>;
  crest: Piece<LegacyCrest>;
  startJourney: (surname: string) => Promise<void>;
  reset: () => void;
};

const Ctx = createContext<JourneyContextValue | null>(null);

type InternalState = {
  surname: string | null;
  unknownSurname: boolean;
  facts: { data: LegacyFacts | null; status: PieceStatus; reason: string | null };
  story: { data: LegacyStory | null; status: PieceStatus; reason: string | null };
  crest: { data: LegacyCrest | null; status: PieceStatus; reason: string | null };
};

const SESSION_KEY = "ancestra_journey_surname";
const REMEMBERED_KEY = "ancestorsqr_surname";

const INITIAL: InternalState = {
  surname: null,
  unknownSurname: false,
  facts: { data: null, status: "idle", reason: null },
  story: { data: null, status: "idle", reason: null },
  crest: { data: null, status: "idle", reason: null },
};

export function JourneyProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<InternalState>(() => {
    // Rehydrate surname from localStorage so it survives auth redirects and tabs
    try {
      const saved = localStorage.getItem(SESSION_KEY);
      return saved ? { ...INITIAL, surname: saved } : INITIAL;
    } catch {
      return INITIAL;
    }
  });

  // Pinned current surname used by retry callbacks so stale closures don't fire.
  const surnameRef = useRef<string | null>(null);

  const applyResponse = useCallback((resp: LegacyResponse) => {
    if (resp.code === "UNKNOWN_SURNAME") {
      setState((s) => ({
        ...s,
        unknownSurname: true,
        facts: { data: null, status: "error", reason: "unknown surname" },
        story: { data: null, status: "error", reason: "skipped" },
      }));
      return;
    }
    const factsErr = resp.errors.find((e) => e.which === "facts");
    const storyErr = resp.errors.find((e) => e.which === "story");
    setState((s) => ({
      ...s,
      unknownSurname: false,
      facts: factsErr || !resp.facts
        ? { data: null, status: "error", reason: factsErr?.reason ?? "no facts" }
        : { data: resp.facts, status: "ready", reason: null },
      story: storyErr || !resp.story
        ? { data: null, status: "error", reason: storyErr?.reason ?? "no story" }
        : { data: resp.story, status: "ready", reason: null },
    }));
  }, []);

  const runFetch = useCallback(async (surname: string) => {
    try {
      localStorage.setItem(SESSION_KEY, surname);
      localStorage.setItem(REMEMBERED_KEY, surname);
    } catch { /* ignore */ }

    setState((s) => ({
      ...s,
      surname,
      unknownSurname: false,
      facts: { data: null, status: "loading", reason: null },
      story: { data: null, status: "loading", reason: null },
    }));
    surnameRef.current = surname;
    try {
      const resp = await fetchLegacy(surname);
      // Bail if another startJourney has taken ownership since this one started.
      if (surnameRef.current !== surname) return;
      applyResponse(resp);
    } catch (err) {
      if (surnameRef.current !== surname) return;
      const reason = (err as Error).message;
      const friendlyReason = reason.includes("too long")
        ? "Surnames must be 60 characters or fewer"
        : reason;
      setState((s) => ({
        ...s,
        facts: { data: null, status: "error", reason: friendlyReason },
        story: { data: null, status: "error", reason: "skipped: network" },
      }));
    }
  }, [applyResponse]);

  const retry = useCallback(() => {
    const current = surnameRef.current;
    if (!current) return;
    void runFetch(current);
  }, [runFetch]);

  const crestRetry = useCallback(() => { /* no-op: crest generated server-side after payment */ }, []);

  const startJourney = useCallback(async (surname: string) => {
    await runFetch(surname);
  }, [runFetch]);

  // On mount: if surname was rehydrated from localStorage but data is missing, re-fetch
  useEffect(() => {
    let saved: string | null = null;
    try { saved = localStorage.getItem(SESSION_KEY); } catch { /* ignore */ }
    if (saved && state.facts.status === "idle") {
      void runFetch(saved);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reset = useCallback(() => {
    try { localStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
    surnameRef.current = null;
    setState(INITIAL);
  }, []);


  const value = useMemo<JourneyContextValue>(() => ({
    surname: state.surname,
    unknownSurname: state.unknownSurname,
    facts: { ...state.facts, retry },
    story: { ...state.story, retry },
    crest: { ...state.crest, retry: crestRetry },
    startJourney,
    reset,
  }), [state, retry, crestRetry, startJourney, reset]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useJourney(): JourneyContextValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useJourney must be used inside JourneyProvider");
  return v;
}
