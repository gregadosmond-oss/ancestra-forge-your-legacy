import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Idempotent marker — when `done` becomes true, upserts a row into
 * tool_completions for the current authenticated user. Safe to call
 * repeatedly; only fires once per mount. No-op when logged out.
 */
export function useMarkToolComplete(toolKey: string, done: boolean) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (!done || firedRef.current) return;
    firedRef.current = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id;
      if (!uid) return;
      const { error } = await supabase
        .from("tool_completions")
        .upsert(
          { user_id: uid, tool_key: toolKey },
          { onConflict: "user_id,tool_key", ignoreDuplicates: true },
        );
      if (error) console.error("useMarkToolComplete failed", error);
    })();
  }, [done, toolKey]);
}
