import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { fetchLegacy } from "@/lib/legacyClient";
import type {
  LegacyFacts,
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
  startJourney: (surname: string) => Promise<void>;
  reset: () => void;
};

const Ctx = createContext<JourneyContextValue | null>(null);

type InternalState = {
  surname: string | null;
  unknownSurname: boolean;
  facts: { data: LegacyFacts | null; status: PieceStatus; reason: string | null };
  story: { data: LegacyStory | null; status: PieceStatus; reason: string | null };
};

const INITIAL: InternalState = {
  surname: null,
  unknownSurname: false,
  facts: { data: null, status: "idle", reason: null },
  story: { data: null, status: "idle", reason: null },
};

export function JourneyProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<InternalState>(INITIAL);
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

  const startJourney = useCallback(async (surname: string) => {
    await runFetch(surname);
  }, [runFetch]);

  const reset = useCallback(() => {
    surnameRef.current = null;
    setState(INITIAL);
  }, []);

  const value = useMemo<JourneyContextValue>(() => ({
    surname: state.surname,
    unknownSurname: state.unknownSurname,
    facts: { ...state.facts, retry },
    story: { ...state.story, retry },
    startJourney,
    reset,
  }), [state, retry, startJourney, reset]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useJourney(): JourneyContextValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useJourney must be used inside JourneyProvider");
  return v;
}
