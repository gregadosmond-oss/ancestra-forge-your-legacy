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
import { fetchLegacy, fetchCrest } from "@/lib/legacyClient";
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

const INITIAL: InternalState = {
  surname: null,
  unknownSurname: false,
  facts: { data: null, status: "idle", reason: null },
  story: { data: null, status: "idle", reason: null },
  crest: { data: null, status: "idle", reason: null },
};

export function JourneyProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<InternalState>(() => {
    // Rehydrate surname from sessionStorage so it survives auth redirects
    const saved = sessionStorage.getItem(SESSION_KEY);
    return saved ? { ...INITIAL, surname: saved } : INITIAL;
  });
  // Pinned current surname used by retry callbacks so stale closures don't fire.
  const surnameRef = useRef<string | null>(null);
  const factsRef = useRef<LegacyFacts | null>(null);

  const runCrestFetch = useCallback(async (surname: string, facts: LegacyFacts) => {
    setState((s) => ({ ...s, crest: { data: null, status: "loading", reason: null } }));
    try {
      const crest = await fetchCrest(surname, facts);
      setState((s) => ({ ...s, crest: { data: crest, status: "ready", reason: null } }));
    } catch (err) {
      setState((s) => ({
        ...s,
        crest: { data: null, status: "error", reason: (err as Error).message },
      }));
    }
  }, []);

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
    // Fire crest generation in the background when facts are ready.
    if (!factsErr && resp.facts && surnameRef.current) {
      factsRef.current = resp.facts;
      void runCrestFetch(surnameRef.current, resp.facts);
    }
  }, [runCrestFetch]);

  const runFetch = useCallback(async (surname: string) => {
    sessionStorage.setItem(SESSION_KEY, surname);
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
      setState((s) => ({
        ...s,
        facts: { data: null, status: "error", reason },
        story: { data: null, status: "error", reason: "skipped: network" },
      }));
    }
  }, [applyResponse]);

  const retry = useCallback(() => {
    const current = surnameRef.current;
    if (!current) return;
    void runFetch(current);
  }, [runFetch]);

  const crestRetry = useCallback(() => {
    const current = surnameRef.current;
    const facts = factsRef.current;
    if (!current || !facts) return;
    void runCrestFetch(current, facts);
  }, [runCrestFetch]);

  const startJourney = useCallback(async (surname: string) => {
    await runFetch(surname);
  }, [runFetch]);

  // On mount: if surname was rehydrated from sessionStorage but data is missing, re-fetch
  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved && state.facts.status === "idle") {
      void runFetch(saved);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reset = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    surnameRef.current = null;
    factsRef.current = null;
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
