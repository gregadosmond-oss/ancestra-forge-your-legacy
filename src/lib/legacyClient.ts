import { supabase } from "@/integrations/supabase/client";
import type { LegacyResponse } from "@/types/legacy";

export async function fetchLegacy(surname: string): Promise<LegacyResponse> {
  const { data, error } = await supabase.functions.invoke<LegacyResponse>(
    "generate-legacy",
    { body: { surname } },
  );
  if (error) throw new Error(`fetchLegacy: ${error.message}`);
  if (!data) throw new Error("fetchLegacy: empty response");
  return data;
}
