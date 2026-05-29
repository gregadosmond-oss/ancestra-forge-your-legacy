import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

const PREWARM_TOOLS = new Set(["tree", "collect"]);

/**
 * Idempotent marker — when `done` becomes true, upserts a row into
 * tool_completions for the current authenticated user. Safe to call
 * repeatedly; only fires once per mount. No-op when logged out.
 *
 * When the completed tool is "tree" or "collect", also kicks off a
 * fire-and-forget background call to generate-personal-story so the
 * digital novel and printed book open instantly later.
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

      // Fire-and-forget pre-warm: generate the personalized story in the
      // background so /novel and the printed book open with no wait.
      if (PREWARM_TOOLS.has(toolKey)) {
        supabase.functions
          .invoke("generate-personal-story", { body: { user_id: uid } })
          .catch((e) => console.warn("pre-warm generate-personal-story failed", e));
      }
    })();
  }, [done, toolKey]);
}
