// Search FamilySearch historical records on behalf of an authenticated AncestorsQR user.

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

interface SearchBody {
  surname?: string;
  first_name?: string;
  birth_year_approx?: number;
  birth_place?: string;
  father_first_name?: string;
  mother_first_name?: string;
  mother_maiden_name?: string;
}

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

    const body = (await req.json().catch(() => ({}))) as SearchBody;
    const surname = (body.surname || "").trim();
    if (!surname) {
      return json(400, { success: false, error: "Surname is required" });
    }

    const search_inputs = {
      surname,
      first_name: body.first_name?.trim() || undefined,
      birth_year_approx:
        typeof body.birth_year_approx === "number"
          ? body.birth_year_approx
          : undefined,
      birth_place: body.birth_place?.trim() || undefined,
      father_first_name: body.father_first_name?.trim() || undefined,
      mother_first_name: body.mother_first_name?.trim() || undefined,
      mother_maiden_name: body.mother_maiden_name?.trim() || undefined,
    };

    console.log(
      "[familysearch-search-records] search request for user:",
      user_id,
      "surname:",
      surname,
    );

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // STEP 1 — load FS session
    const { data: session, error: sessionErr } = await admin
      .from("familysearch_sessions")
      .select("access_token, refresh_token, token_expires_at")
      .eq("user_id", user_id)
      .maybeSingle();

    if (sessionErr) {
      console.error(
        "[familysearch-search-records] FAILED:",
        JSON.stringify({ sessionErr }),
      );
      return json(500, { success: false, error: sessionErr.message });
    }
    if (!session) {
      return json(412, {
        success: false,
        error: "Connect with FamilySearch first",
      });
    }

    const APP_KEY = Deno.env.get("FAMILYSEARCH_APP_KEY");
    const APP_SECRET = Deno.env.get("FAMILYSEARCH_APP_SECRET");
    if (!APP_KEY) {
      console.error(
        "[familysearch-search-records] FAILED: missing FAMILYSEARCH_APP_KEY",
      );
      return json(500, { success: false, error: "server misconfigured" });
    }
    const AUTH_BASE =
      Deno.env.get("FAMILYSEARCH_AUTH_BASE_URL") ||
      "https://identbeta.familysearch.org";
    const API_BASE =
      Deno.env.get("FAMILYSEARCH_API_BASE_URL") ||
      "https://api-beta.familysearch.org";

    // STEP 2 — token freshness
    let access_token = session.access_token as string;
    let refresh_token = session.refresh_token as string | null;
    const expiresAtMs = new Date(session.token_expires_at as string).getTime();
    const needsRefresh = expiresAtMs <= Date.now() + 60_000;
    let didRefresh = false;

    console.log(
      "[familysearch-search-records] token expires_at:",
      session.token_expires_at,
      "refreshed:",
      needsRefresh,
    );

    if (needsRefresh) {
      if (!refresh_token) {
        await admin.from("familysearch_sessions").delete().eq("user_id", user_id);
        return json(412, {
          success: false,
          error: "FamilySearch session expired, please reconnect",
        });
      }

      const refreshForm = new URLSearchParams();
      refreshForm.set("grant_type", "refresh_token");
      refreshForm.set("refresh_token", refresh_token);
      refreshForm.set("client_id", APP_KEY);
      if (APP_SECRET) refreshForm.set("client_secret", APP_SECRET);

      const refreshResp = await fetch(
        `${AUTH_BASE}/cis-web/oauth2/v3/token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/json",
          },
          body: refreshForm.toString(),
        },
      );

      if (!refreshResp.ok) {
        const txt = await refreshResp.text();
        console.error(
          "[familysearch-search-records] FAILED:",
          JSON.stringify({ refreshStatus: refreshResp.status, body: txt }),
        );
        await admin.from("familysearch_sessions").delete().eq("user_id", user_id);
        return json(412, {
          success: false,
          error: "FamilySearch session expired, please reconnect",
        });
      }

      const refreshed = (await refreshResp.json()) as {
        access_token: string;
        refresh_token?: string;
        expires_in?: number;
      };
      access_token = refreshed.access_token;
      refresh_token = refreshed.refresh_token ?? refresh_token;
      const newExpires = new Date(
        Date.now() +
          (typeof refreshed.expires_in === "number"
            ? refreshed.expires_in
            : 3600) *
            1000,
      );

      await admin
        .from("familysearch_sessions")
        .update({
          access_token,
          refresh_token,
          token_expires_at: newExpires.toISOString(),
          last_used_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user_id);

      didRefresh = true;
    }

    // STEP 3 — log search input (best effort)
    try {
      await admin.from("familysearch_search_inputs").insert({
        user_id,
        surname,
        first_name: search_inputs.first_name ?? null,
        birth_year_approx: search_inputs.birth_year_approx ?? null,
        birth_place: search_inputs.birth_place ?? null,
        father_first_name: search_inputs.father_first_name ?? null,
        mother_first_name: search_inputs.mother_first_name ?? null,
        mother_maiden_name: search_inputs.mother_maiden_name ?? null,
      });
    } catch (logErr) {
      console.warn(
        "[familysearch-search-records] search input log failed:",
        (logErr as Error).message,
      );
    }

    // STEP 4 — build query string
    const qParts: string[] = [`surname:${surname}`];
    if (search_inputs.first_name)
      qParts.push(`givenname:${search_inputs.first_name}`);
    if (search_inputs.birth_year_approx)
      qParts.push(`birthlikedate:${search_inputs.birth_year_approx}~`);
    if (search_inputs.birth_place)
      qParts.push(`birthlikeplace:"${search_inputs.birth_place}"`);
    if (search_inputs.father_first_name)
      qParts.push(`fatherGivenname:${search_inputs.father_first_name}`);
    if (search_inputs.mother_first_name)
      qParts.push(`motherGivenname:${search_inputs.mother_first_name}`);
    if (search_inputs.mother_maiden_name)
      qParts.push(`motherSurname:${search_inputs.mother_maiden_name}`);

    const q = encodeURIComponent(qParts.join(" "));
    const fsUrl = `${API_BASE}/platform/records/search?q=${q}&count=20`;

    const fsResp = await fetch(fsUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${access_token}`,
        Accept: "application/json",
      },
    });

    if (fsResp.status === 401) {
      await admin.from("familysearch_sessions").delete().eq("user_id", user_id);
      return json(412, {
        success: false,
        error: "FamilySearch session expired, please reconnect",
      });
    }
    if (fsResp.status === 403) {
      const txt = await fsResp.text();
      console.error(
        "[familysearch-search-records] FAILED:",
        JSON.stringify({ status: 403, body: txt }),
      );
      return json(502, {
        success: false,
        error: "FamilySearch declined the request: insufficient permissions",
      });
    }
    if (fsResp.status >= 500) {
      const txt = await fsResp.text();
      console.error(
        "[familysearch-search-records] FAILED:",
        JSON.stringify({ status: fsResp.status, body: txt }),
      );
      return json(502, { success: false, error: "FamilySearch upstream error" });
    }
    if (!fsResp.ok) {
      const txt = await fsResp.text();
      console.error(
        "[familysearch-search-records] FAILED:",
        JSON.stringify({ status: fsResp.status, body: txt }),
      );
      return json(502, {
        success: false,
        error: `FamilySearch error: ${txt}`,
      });
    }

    // STEP 5 — parse GEDCOM-X
    const data = await fsResp.json().catch(() => ({}));
    const entries: any[] = Array.isArray(data?.entries) ? data.entries : [];

    const matches = entries
      .map((entry) => {
        try {
          const person = entry?.content?.gedcomx?.persons?.[0];
          if (!person) return null;

          // Name
          const nameForms = person?.names?.[0]?.nameForms?.[0];
          const fullText = nameForms?.fullText as string | undefined;
          const parts = (nameForms?.parts ?? []) as Array<{
            type?: string;
            value?: string;
          }>;
          const givenPart = parts.find((p) =>
            (p.type ?? "").toLowerCase().includes("given"),
          )?.value;
          const surnamePart = parts.find((p) =>
            (p.type ?? "").toLowerCase().includes("surname"),
          )?.value;

          // Facts
          const facts = (person?.facts ?? []) as Array<any>;
          const birth = facts.find((f) =>
            (f.type ?? "").toLowerCase().includes("birth"),
          );
          const death = facts.find((f) =>
            (f.type ?? "").toLowerCase().includes("death"),
          );

          return {
            id: person.id ?? entry.id ?? null,
            name: fullText ?? null,
            given_name: givenPart ?? null,
            surname: surnamePart ?? null,
            birth_date: birth?.date?.original ?? birth?.date?.formal ?? null,
            birth_place: birth?.place?.original ?? null,
            death_date: death?.date?.original ?? death?.date?.formal ?? null,
            death_place: death?.place?.original ?? null,
            score:
              typeof entry?.score === "number" ? entry.score : entry?.score ?? null,
          };
        } catch (parseErr) {
          console.warn(
            "[familysearch-search-records] entry parse failed:",
            (parseErr as Error).message,
          );
          return null;
        }
      })
      .filter((m) => m !== null);

    const total_count =
      typeof data?.results === "number" ? data.results : matches.length;

    console.log(
      "[familysearch-search-records] FS API status:",
      fsResp.status,
      "matches:",
      matches.length,
    );

    return json(200, {
      success: true,
      matches,
      total_count,
      search_inputs,
      refreshed: didRefresh,
    });
  } catch (err) {
    console.error(
      "[familysearch-search-records] FAILED:",
      JSON.stringify({ message: (err as Error).message }),
    );
    return json(500, { success: false, error: (err as Error).message });
  }
});
