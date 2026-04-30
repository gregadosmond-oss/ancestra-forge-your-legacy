import { supabase } from "@/integrations/supabase/client";

/**
 * Initiate the FamilySearch OAuth flow.
 * Generates state, persists it, asks the edge function for the auth URL,
 * then redirects the browser to FamilySearch.
 */
export async function initiateFamilySearchOAuth(): Promise<void> {
  const state = crypto.randomUUID();
  localStorage.setItem("fs_oauth_state", state);

  const { data, error } = await supabase.functions.invoke(
    "familysearch-build-auth-url",
    { body: { state } },
  );

  if (error || !data?.url) {
    throw new Error("Failed to build FamilySearch auth URL");
  }

  window.location.href = data.url as string;
}
