import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function usePurchase() {
  const { user, loading: authLoading } = useAuth();
  const [hasPurchased, setHasPurchased] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setHasPurchased(false);
      setLoading(false);
      return;
    }

    const check = async () => {
      const { data } = await supabase
        .from("purchases")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "paid")
        .limit(1);

      setHasPurchased(!!data && data.length > 0);
      setLoading(false);
    };

    check();
  }, [user, authLoading]);

  return { user, hasPurchased, loading: loading || authLoading };
}
