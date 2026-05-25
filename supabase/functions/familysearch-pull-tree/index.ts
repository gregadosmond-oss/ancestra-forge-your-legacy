// Pull a multi-generation ancestry pedigree from FamilySearch for an authenticated user.
// [DEBUG MODE] We no longer delete the familysearch_sessions row on 401/refresh failure.
// Instead we surface the full FS response so we can diagnose what FS is actually saying.

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

const redactBearer = (value?: string | null) => {
  if (!value) return null;
  return value.startsWith("Bearer ") ? "Bearer [REDACTED]" : value;
};

const sanitizeSentHeaders = (headers?: Record<string, string> | null) => {
  if (!headers) return null;
  return {
    ...headers,
    Authorization: redactBearer(headers.Authorization),
  };
};

const headersToObject = (h: Headers) => {
  const out: Record<string, string> = {};
  h.forEach((v, k) => {
    out[k] = v;
  });
  return out;
};

const buildFamilySearchHeaders = (accessToken: string) => ({
  Authorization: `Bearer ${accessToken}`,
  Accept: "application/x-fs-v1+json",
  "Accept-Language": "en",
  "User-Agent": "AncestorsQR/1.0 (https://ancestorsqr.com)",
});

interface PullBody {
  person_id?: string;
  personId?: string;
  generations?: number;
  debug?: boolean;
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

    const body = (await req.json().catch(() => ({}))) as PullBody;
    const requestedPersonId =
      (body.personId ?? body.person_id)?.toString().trim() || undefined;
    const generationsRequested = Math.min(
      Math.max(typeof body.generations === "number" ? body.generations : 4, 1),
      8,
    );

    console.log(
      "[familysearch-pull-tree] request user:",
      user_id,
      "person_id:",
      requestedPersonId,
      "generations:",
      generationsRequested,
    );

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const API_BASE_EARLY =
      Deno.env.get("FAMILYSEARCH_API_BASE_URL") ||
      "https://api-integ.familysearch.org";

    // ============================================================
    // MINIMAL personId BRANCH — direct fetch, no short-circuits
    // ============================================================
    if (requestedPersonId) {
      const { data: fsSession } = await admin
        .from("familysearch_sessions")
        .select("access_token")
        .eq("user_id", user_id)
        .maybeSingle();

      if (!fsSession?.access_token) {
        return json(200, {
          success: false,
          status: 401,
          error: "No FamilySearch session",
        });
      }

      const fsToken = fsSession.access_token as string;
      const fsUrl = `${API_BASE_EARLY}/platform/tree/persons/${encodeURIComponent(
        requestedPersonId,
      )}/ancestry?generations=${generationsRequested}`;

      console.log("[pull-tree] Calling FS:", fsUrl);

      const fsResp = await fetch(fsUrl, {
        headers: {
          Authorization: `Bearer ${fsToken}`,
          Accept: "application/x-fs-v1+json",
          "Accept-Language": "en",
          "User-Agent": "AncestorsQR/1.0 (https://ancestorsqr.com)",
        },
      });

      const fsText = await fsResp.text();
      console.log(
        "[pull-tree] FS status:",
        fsResp.status,
        "body length:",
        fsText.length,
      );

      if (body.debug) {
        return json(200, {
          success: true,
          fs_status: fsResp.status,
          fs_url: fsUrl,
          fs_response_body_raw: fsText,
          fs_response_headers: Object.fromEntries(fsResp.headers.entries()),
        });
      }

      if (!fsResp.ok) {
        return json(200, {
          success: false,
          status: fsResp.status,
          fs_url: fsUrl,
          error: fsText,
          fs_response_headers: Object.fromEntries(fsResp.headers.entries()),
        });
      }

      const fsJson = JSON.parse(fsText);
      const persons = fsJson.persons || [];

      return json(200, {
        success: true,
        root_id: requestedPersonId,
        persons,
        generation_count: persons.length > 0 ? generationsRequested : 0,
        generations_requested: generationsRequested,
      });
    }

    // STEP 1 — load FS session
    const { data: session, error: sessionErr } = await admin
      .from("familysearch_sessions")
      .select(
        "access_token, refresh_token, token_expires_at, familysearch_person_id, starting_person_id",
      )
      .eq("user_id", user_id)
      .maybeSingle();


    if (sessionErr) {
      console.error("[familysearch-pull-tree] session lookup failed:", sessionErr);
      return json(500, { success: false, error: sessionErr.message });
    }
    if (!session) {
      return json(200, {
        success: false,
        status: 412,
        error: "Connect with FamilySearch first",
        endpoint: "session",
      });
    }

    const APP_KEY = Deno.env.get("FAMILYSEARCH_APP_KEY");
    const APP_SECRET = Deno.env.get("FAMILYSEARCH_APP_SECRET");
    if (!APP_KEY) {
      console.error("[familysearch-pull-tree] missing FAMILYSEARCH_APP_KEY");
      return json(500, { success: false, error: "server misconfigured" });
    }
    const AUTH_BASE =
      Deno.env.get("FAMILYSEARCH_AUTH_BASE_URL") ||
      "https://identbeta.familysearch.org";
    const API_BASE =
      Deno.env.get("FAMILYSEARCH_API_BASE_URL") ||
      "https://api-integ.familysearch.org";

    // STEP 2 — token freshness (refresh if needed, but DO NOT delete row on failure)
    let access_token = session.access_token as string;
    let refresh_token = session.refresh_token as string | null;
    const expiresAtMs = new Date(session.token_expires_at as string).getTime();
    const needsRefresh = expiresAtMs <= Date.now() + 60_000;
    let didRefresh = false;

    if (needsRefresh) {
      if (!refresh_token) {
        return json(200, {
          success: false,
          status: 412,
          error: "FamilySearch session has no refresh_token",
          endpoint: "refresh-token",
        });
      }

      const refreshForm = new URLSearchParams();
      refreshForm.set("grant_type", "refresh_token");
      refreshForm.set("refresh_token", refresh_token);
      refreshForm.set("client_id", APP_KEY);
      if (APP_SECRET) refreshForm.set("client_secret", APP_SECRET);

      const refreshUrl = `${AUTH_BASE}/cis-web/oauth2/v3/token`;
      const refreshResp = await fetch(refreshUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body: refreshForm.toString(),
      });

      if (!refreshResp.ok) {
        const txt = await refreshResp.text();
        const respHeaders = headersToObject(refreshResp.headers);
        console.error("[FS refresh failed]", {
          url: refreshUrl,
          fs_response_status: refreshResp.status,
          fs_response_body: txt,
          fs_response_headers: respHeaders,
        });
        // [DEBUG] Do NOT delete the session row — preserve it for diagnosis.
        return json(200, {
          success: false,
          status: refreshResp.status,
          endpoint: "refresh-token",
          request_url: refreshUrl,
          fs_response_body: txt,
          fs_response_headers: respHeaders,
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

    console.log("[familysearch-pull-tree] token refresh applied:", didRefresh);

    // Helper: call FS, return structured debug payload on non-2xx (no deletes).
    const callFs = async (url: string, label: string) => {
      const sentHeaders = buildFamilySearchHeaders(access_token);
      console.log(`[familysearch-pull-tree] ${label} GET`, url, "headers:",
        JSON.stringify(sanitizeSentHeaders(sentHeaders)));
      const resp = await fetch(url, { method: "GET", headers: sentHeaders });
      return { resp, sentHeaders };
    };

    const fsErrorResponse = async (
      resp: Response,
      sentHeaders: Record<string, string>,
      url: string,
      endpointLabel: string,
    ) => {
      const txt = await resp.text();
      const respHeaders = headersToObject(resp.headers);
      if (resp.status === 401) {
        console.error("[FS 401]", {
          url,
          headers_sent: sanitizeSentHeaders(sentHeaders),
          fs_response_status: 401,
          fs_response_body: txt,
          fs_response_headers: respHeaders,
        });
      } else {
        console.error("[FS non-2xx]", {
          url,
          status: resp.status,
          headers_sent: sanitizeSentHeaders(sentHeaders),
          fs_response_body: txt,
          fs_response_headers: respHeaders,
        });
      }
      // [DEBUG] Do NOT delete the session row on 401 — preserve for diagnosis.
      return json(200, {
        success: false,
        status: resp.status,
        endpoint: endpointLabel,
        request_url: url,
        request_headers_sent: sanitizeSentHeaders(sentHeaders),
        fs_response_body: txt,
        fs_response_headers: respHeaders,
      });
    };

    // STEP 3 — resolve root person id
    // Prefer explicit param, then stored starting_person_id, then stored
    // familysearch_person_id. Only fall back to /current-person as last resort.
    let rootPersonId: string | null = null;

    if (requestedPersonId) {
      rootPersonId = requestedPersonId;
    } else if ((session as any).starting_person_id) {
      rootPersonId = (session as any).starting_person_id as string;
    } else if (session.familysearch_person_id) {
      rootPersonId = session.familysearch_person_id as string;
    } else {
      const currentUrl = `${API_BASE}/platform/tree/current-person`;
      const { resp: currentResp, sentHeaders } = await callFs(
        currentUrl,
        "current-person",
      );

      if (!currentResp.ok) {
        const txt = await currentResp.text();
        const respHeaders = headersToObject(currentResp.headers);
        console.error("[FS current-person failed]", {
          url: currentUrl,
          status: currentResp.status,
          fs_response_body: txt,
        });
        return json(200, {
          success: false,
          status: 428,
          endpoint: "current-person",
          error:
            "FamilySearch couldn't resolve your tree person. Enter your FamilySearch person ID (e.g. BMZC-MBD) to continue.",
          needs_person_id: true,
          fs_response_status: currentResp.status,
          fs_response_body: txt,
          fs_response_headers: respHeaders,
        });
      }


      const currentData = await currentResp.json().catch(() => ({}));
      const persons = Array.isArray(currentData?.persons)
        ? currentData.persons
        : [];
      rootPersonId = persons[0]?.id ?? null;

      if (rootPersonId) {
        await admin
          .from("familysearch_sessions")
          .update({
            familysearch_person_id: rootPersonId,
            last_used_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user_id);
      }
    }

    if (!rootPersonId) {
      return json(404, {
        success: false,
        error: "Could not resolve root person — user has no tree yet",
      });
    }

    console.log("[familysearch-pull-tree] root resolved:", rootPersonId);

    // STEP 4 — fetch ancestry
    const ancestryUrl = `${API_BASE}/platform/tree/persons/${encodeURIComponent(
      rootPersonId,
    )}/ancestry?generations=${generationsRequested}`;

    const { resp: fsResp, sentHeaders: ancestryHeaders } = await callFs(
      ancestryUrl,
      "ancestry",
    );

    if (fsResp.status === 404) {
      console.log("[familysearch-pull-tree] no tree (404)");
      return json(200, {
        success: true,
        root_id: rootPersonId,
        persons: [],
        generation_count: 0,
        generations_requested: generationsRequested,
      });
    }
    if (!fsResp.ok) {
      return await fsErrorResponse(
        fsResp,
        ancestryHeaders,
        ancestryUrl,
        "ancestry",
      );
    }

    // DEBUG bypass — return raw FS response without parsing
    if (body.debug) {
      const fsResponseText = await fsResp.text();
      const fsResponseHeaders = headersToObject(fsResp.headers);
      return json(200, {
        success: true,
        debug: true,
        personId_used: rootPersonId,
        fs_endpoint_called: ancestryUrl,
        fs_status: fsResp.status,
        fs_response_body_raw: fsResponseText,
        fs_response_headers: {
          "content-type": fsResponseHeaders["content-type"] ?? null,
          "content-length": fsResponseHeaders["content-length"] ?? null,
          "x-processing-time": fsResponseHeaders["x-processing-time"] ?? null,
          date: fsResponseHeaders["date"] ?? null,
          etag: fsResponseHeaders["etag"] ?? null,
          warning: fsResponseHeaders["warning"] ?? null,
          "www-authenticate": fsResponseHeaders["www-authenticate"] ?? null,
        },
      });
    }

    const data = await fsResp.json().catch(() => ({}));
    const rawPersons: any[] = Array.isArray(data?.persons) ? data.persons : [];
    const rawRelationships: any[] = Array.isArray(data?.relationships)
      ? data.relationships
      : [];

    // STEP 5 — parse persons
    const personsById = new Map<string, any>();
    let maxGen = 0;

    for (const person of rawPersons) {
      try {
        const id = person?.id;
        if (!id) continue;

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

        const facts = (person?.facts ?? []) as Array<any>;
        const birth = facts.find((f) =>
          (f.type ?? "").toLowerCase().includes("birth"),
        );
        const death = facts.find((f) =>
          (f.type ?? "").toLowerCase().includes("death"),
        );

        const ascNum =
          person?.display?.ascendancyNumber ??
          person?.display?.AscendancyNumber ??
          null;
        const generation = ascNum
          ? Math.floor(Math.log2(Number(ascNum))) + 1
          : 1;
        if (generation > maxGen) maxGen = generation;

        personsById.set(id, {
          id,
          name: fullText ?? null,
          given_name: givenPart ?? null,
          surname: surnamePart ?? null,
          birth_date: birth?.date?.original ?? birth?.date?.formal ?? null,
          birth_place: birth?.place?.original ?? null,
          death_date: death?.date?.original ?? death?.date?.formal ?? null,
          death_place: death?.place?.original ?? null,
          generation,
          parent_ids: [] as string[],
        });
      } catch (parseErr) {
        console.warn(
          "[familysearch-pull-tree] person parse failed:",
          (parseErr as Error).message,
        );
      }
    }

    for (const rel of rawRelationships) {
      try {
        const type = (rel?.type ?? "") as string;
        if (!type.toLowerCase().includes("parentchild")) continue;

        const parentRef =
          rel?.person1?.resourceId ??
          (rel?.person1?.resource ?? "").replace(/^#/, "");
        const childRef =
          rel?.person2?.resourceId ??
          (rel?.person2?.resource ?? "").replace(/^#/, "");

        if (!parentRef || !childRef) continue;
        const child = personsById.get(childRef);
        if (!child) continue;
        if (!child.parent_ids.includes(parentRef)) {
          child.parent_ids.push(parentRef);
        }
      } catch (relErr) {
        console.warn(
          "[familysearch-pull-tree] relationship parse failed:",
          (relErr as Error).message,
        );
      }
    }

    const persons = Array.from(personsById.values());

    console.log(
      "[familysearch-pull-tree] persons returned:",
      persons.length,
      "gens:",
      maxGen,
    );

    return json(200, {
      success: true,
      root_id: rootPersonId,
      persons,
      generation_count: maxGen,
      generations_requested: generationsRequested,
      refreshed: didRefresh,
    });
  } catch (err) {
    console.error("[familysearch-pull-tree] FAILED:", (err as Error).message);
    return json(200, {
      success: false,
      status: 500,
      error: (err as Error).message,
      endpoint: "internal",
    });
  }
});
