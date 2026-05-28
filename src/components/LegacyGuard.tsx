import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function LegacyGuard({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<"loading" | "ok" | "login" | "upgrade">("loading");

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return setState("login");
      const { data } = await supabase
        .from("profiles")
        .select("tier")
        .eq("id", user.id)
        .maybeSingle();
      if (data?.tier === "legacy") setState("ok");
      else setState("upgrade");
    })();
  }, []);

  if (state === "loading") return null;
  if (state === "login") return <Navigate to="/login" replace />;
  if (state === "upgrade") return <Navigate to="/upgrade" replace />;
  return <>{children}</>;
}
