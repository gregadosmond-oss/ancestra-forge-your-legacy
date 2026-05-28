import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const REQUIRED_TOOLS = 10;

export default function NovelGuard({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<"loading" | "ok" | "login" | "dashboard">("loading");

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return setState("login");
      const { data } = await supabase
        .from("tool_completions")
        .select("tool_key")
        .eq("user_id", user.id);
      const distinct = new Set((data ?? []).map((r: any) => r.tool_key));
      setState(distinct.size >= REQUIRED_TOOLS ? "ok" : "dashboard");
    })();
  }, []);

  if (state === "loading") return null;
  if (state === "login") return <Navigate to="/login" replace />;
  if (state === "dashboard") return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}
