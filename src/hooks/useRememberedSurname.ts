import { useCallback, useEffect, useState } from "react";

const KEY = "ancestorsqr_surname";

function read(): string | null {
  try {
    const v = localStorage.getItem(KEY);
    return v && v.trim().length > 0 ? v : null;
  } catch {
    return null;
  }
}

export function useRememberedSurname() {
  const [surname, setSurnameState] = useState<string | null>(() => read());

  useEffect(() => {
    // Re-hydrate in case mount happened before storage was available
    setSurnameState(read());

    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) {
        setSurnameState(e.newValue && e.newValue.trim().length > 0 ? e.newValue : null);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setSurname = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      localStorage.setItem(KEY, trimmed);
    } catch {
      /* ignore */
    }
    setSurnameState(trimmed);
  }, []);

  const clearSurname = useCallback(() => {
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
    setSurnameState(null);
  }, []);

  return { surname, setSurname, clearSurname };
}

export const REMEMBERED_SURNAME_KEY = KEY;
