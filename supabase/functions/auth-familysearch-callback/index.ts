// Exchange FamilySearch OAuth authorization code for tokens, persist per-user.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

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
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return json(401, {
        success: false,
        error: "Must be authenticated to AncestorsQR first",
      });
    }

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return json(401, {
        success: false,
        error: "Must be authenticated to AncestorsQR first",
      });
    }
    const user_id = userData.user.id;

    const { code, state } = await req.json().catch(() => ({}));
    if (!code || typeof code !== "string") {
      return json(400, { success: false, error: "missing code" });
    }
    if (!state || typeof state !== "string") {
      return json(400, { success: false, error: "missing state" });
    }

    const APP_KEY = Deno.env.get("FAMILYSEARCH_APP_KEY");
    const APP_SECRET = Deno.env.get("FAMILYSEARCH_APP_SECRET");
    if (!APP_KEY) {
      console.error("[auth-familysearch-callback] FAILED: missing FAMILYSEARCH_APP_KEY");
      return json(500, { success: false, error: "server misconfigured" });
    }
    const AUTH_BASE =
      Deno.env.get("FAMILYSEARCH_AUTH_BASE_URL") ||
      "https://identbeta.familysearch.org";

    console.log("[auth-familysearch-callback] received code for user:", user_id);

    const formBody = new URLSearchParams();
    formBody.set("grant_type", "authorization_code");
    formBody.set("code", code);
    formBody.set("client_id", APP_KEY);
    formBody.set("redirect_uri", REDIRECT_URI);
    if (APP_SECRET) formBody.set("client_secret", APP_SECRET);

    const tokenResp = await fetch(`${AUTH_BASE}/cis-web/oauth2/v3/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: formBody.toString(),
    });

    console.log("[auth-familysearch-callback] token exchange status:", tokenResp.status);

    const tokenText = await tokenResp.text();
    if (!tokenResp.ok) {
      console.error(
        "[auth-familysearch-callback] FAILED:",
        JSON.stringify({ status: tokenResp.status, body: tokenText }),
      );
      return json(502, {
        success: false,
        error: `FamilySearch token exchange failed: ${tokenText}`,
        status: tokenResp.status,
      });
    }

    let parsed: {
      access_token: string;
      refresh_token?: string;
      expires_in?: number;
      token_type?: string;
    };
    try {
      parsed = JSON.parse(tokenText);
    } catch {
      console.error("[auth-familysearch-callback] FAILED: non-JSON token response");
      return json(502, {
        success: false,
        error: "FamilySearch returned non-JSON token response",
        status: tokenResp.status,
      });
    }

    const expiresInSec = typeof parsed.expires_in === "number" ? parsed.expires_in : 3600;
    const expiresAt = new Date(Date.now() + expiresInSec * 1000);

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { error: upsertErr } = await admin
      .from("familysearch_sessions")
      .upsert(
        {
          user_id,
          access_token: parsed.access_token,
          refresh_token: parsed.refresh_token ?? null,
          token_expires_at: expiresAt.toISOString(),
          last_used_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );

    if (upsertErr) {
      console.error(
        "[auth-familysearch-callback] FAILED:",
        JSON.stringify({ upsertErr }),
      );
      return json(500, { success: false, error: upsertErr.message });
    }

    console.log(
      "[auth-familysearch-callback] session upserted, expires:",
      expiresAt.toISOString(),
    );

    return json(200, { success: true, expires_at: expiresAt.toISOString() });
  } catch (err) {
    console.error(
      "[auth-familysearch-callback] FAILED:",
      JSON.stringify({ message: (err as Error).message }),
    );
    return json(500, { success: false, error: (err as Error).message });
  }
});
