import { supabase } from "@/integrations/supabase/client";
import type { LegacyResponse, LegacyFacts, LegacyCrest } from "@/types/legacy";

export async function fetchLegacy(surname: string): Promise<LegacyResponse> {
  const { data, error } = await supabase.functions.invoke<LegacyResponse>(
    "generate-legacy",
    { body: { surname } },
  );
  if (error) throw new Error(`fetchLegacy: ${error.message}`);
  if (!data) throw new Error("fetchLegacy: empty response");
  return data;
}

export async function fetchCrest(
  surname: string,
  facts: LegacyFacts,
): Promise<LegacyCrest> {
  const { data, error } = await supabase.functions.invoke<{
    code: string;
    imageUrl?: string;
    reason?: string;
  }>("generate-crest", { body: { surname, facts } });
  if (error) throw new Error(`fetchCrest: ${error.message}`);
  if (!data || data.code !== "OK" || !data.imageUrl) {
    throw new Error(`fetchCrest: ${data?.reason ?? "empty response"}`);
  }
  return { imageUrl: data.imageUrl };
}
