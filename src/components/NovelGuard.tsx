import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const REQUIRED_TOOLS = 10;

type State =
  | { kind: "loading" }
  | { kind: "ok" }
  | { kind: "login" }
  | { kind: "dashboard" };

export default function NovelGuard({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;

    const evaluate = async () => {
      // Wait for the auth session to be resolved from storage.
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user ?? null;
      if (cancelled) return;
      if (!user) {
        setState({ kind: "login" });
        return;
      }

      const { data, error } = await supabase
        .from("tool_completions")
        .select("tool_key")
        .eq("user_id", user.id);
      if (cancelled) return;

      // If the query itself failed, do NOT bounce a logged-in user — fail open
      // and let the page handle it. Bouncing on a transient error is the bug.
      if (error) {
        console.error("NovelGuard: tool_completions query failed", error);
        setState({ kind: "ok" });
        return;
      }

      const distinct = new Set((data ?? []).map((r: any) => r.tool_key));
      setState(distinct.size >= REQUIRED_TOOLS ? { kind: "ok" } : { kind: "dashboard" });
    };

    evaluate();

    // If auth state changes while we're evaluating (e.g. session hydrates late),
    // re-run so we never lock a freshly-signed-in user out.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      evaluate();
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  if (state.kind === "loading") {
    return (
      <div className="min-h-screen bg-background px-6 py-24 text-center">
        <p className="font-serif italic text-amber-light">Opening the archive…</p>
      </div>
    );
  }
  if (state.kind === "login") return <Navigate to="/login" replace />;
  if (state.kind === "dashboard") return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}
