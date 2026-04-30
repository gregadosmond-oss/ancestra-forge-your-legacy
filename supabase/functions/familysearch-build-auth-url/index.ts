// Build the FamilySearch OAuth authorization URL server-side so AppKey is not exposed.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const REDIRECT_URI = "https://ancestorsqr.com/auth/familysearch/callback";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json(405, { success: false, error: "Method not allowed" });
  }

  try {
    const { state } = await req.json().catch(() => ({}));
    if (!state || typeof state !== "string") {
      return json(400, { success: false, error: "missing state" });
    }

    const APP_KEY = Deno.env.get("FAMILYSEARCH_APP_KEY");
    if (!APP_KEY) {
      console.error("[familysearch-build-auth-url] FAILED: missing FAMILYSEARCH_APP_KEY");
      return json(500, { success: false, error: "server misconfigured" });
    }

    const AUTH_BASE =
      Deno.env.get("FAMILYSEARCH_AUTH_BASE_URL") ||
      "https://identbeta.familysearch.org";

    const url =
      `${AUTH_BASE}/cis-web/oauth2/v3/authorization` +
      `?response_type=code` +
      `&client_id=${encodeURIComponent(APP_KEY)}` +
      `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
      `&state=${encodeURIComponent(state)}`;

    console.log("[familysearch-build-auth-url] built url for state:", state);
    return json(200, { success: true, url });
  } catch (err) {
    console.error("[familysearch-build-auth-url] FAILED:", JSON.stringify({ message: (err as Error).message }));
    return json(500, { success: false, error: (err as Error).message });
  }
});
