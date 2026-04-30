// Pull a multi-generation ancestry pedigree from FamilySearch for an authenticated user.

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

interface PullBody {
  person_id?: string;
  generations?: number;
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
    const requestedPersonId = body.person_id?.trim() || undefined;
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

    // STEP 1 — load FS session
    const { data: session, error: sessionErr } = await admin
      .from("familysearch_sessions")
      .select(
        "access_token, refresh_token, token_expires_at, familysearch_person_id",
      )
      .eq("user_id", user_id)
      .maybeSingle();

    if (sessionErr) {
      console.error(
        "[familysearch-pull-tree] FAILED:",
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
        "[familysearch-pull-tree] FAILED: missing FAMILYSEARCH_APP_KEY",
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

    if (needsRefresh) {
      if (!refresh_token) {
        await admin
          .from("familysearch_sessions")
          .delete()
          .eq("user_id", user_id);
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

      const refreshResp = await fetch(`${AUTH_BASE}/cis-web/oauth2/v3/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body: refreshForm.toString(),
      });

      if (!refreshResp.ok) {
        const txt = await refreshResp.text();
        console.error(
          "[familysearch-pull-tree] FAILED:",
          JSON.stringify({ refreshStatus: refreshResp.status, body: txt }),
        );
        await admin
          .from("familysearch_sessions")
          .delete()
          .eq("user_id", user_id);
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

    console.log(
      "[familysearch-pull-tree] token refresh applied:",
      didRefresh,
    );

    // STEP 3 — resolve root person id
    let rootPersonId: string | null = null;

    if (requestedPersonId) {
      rootPersonId = requestedPersonId;
    } else if (session.familysearch_person_id) {
      rootPersonId = session.familysearch_person_id as string;
    } else {
      const currentResp = await fetch(
        `${API_BASE}/platform/tree/current-person`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${access_token}`,
            Accept: "application/json",
          },
        },
      );

      if (currentResp.status === 401) {
        await admin
          .from("familysearch_sessions")
          .delete()
          .eq("user_id", user_id);
        return json(412, {
          success: false,
          error: "FamilySearch session expired, please reconnect",
        });
      }

      if (currentResp.ok) {
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
      } else {
        const txt = await currentResp.text();
        console.warn(
          "[familysearch-pull-tree] current-person failed:",
          currentResp.status,
          txt,
        );
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

    const fsResp = await fetch(ancestryUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${access_token}`,
        Accept: "application/json",
      },
    });

    if (fsResp.status === 401) {
      await admin
        .from("familysearch_sessions")
        .delete()
        .eq("user_id", user_id);
      return json(412, {
        success: false,
        error: "FamilySearch session expired, please reconnect",
      });
    }
    if (fsResp.status === 403) {
      const txt = await fsResp.text();
      console.error(
        "[familysearch-pull-tree] FAILED:",
        JSON.stringify({ status: 403, body: txt }),
      );
      return json(502, {
        success: false,
        error: "FamilySearch declined the request: insufficient permissions",
      });
    }
    if (fsResp.status === 404) {
      console.log(
        "[familysearch-pull-tree] persons returned: 0 gens: 0 (no tree)",
      );
      return json(200, {
        success: true,
        root_id: rootPersonId,
        persons: [],
        generation_count: 0,
        generations_requested: generationsRequested,
      });
    }
    if (fsResp.status >= 500) {
      const txt = await fsResp.text();
      console.error(
        "[familysearch-pull-tree] FAILED:",
        JSON.stringify({ status: fsResp.status, body: txt }),
      );
      return json(502, {
        success: false,
        error: "FamilySearch upstream error",
      });
    }
    if (!fsResp.ok) {
      const txt = await fsResp.text();
      console.error(
        "[familysearch-pull-tree] FAILED:",
        JSON.stringify({ status: fsResp.status, body: txt }),
      );
      return json(502, {
        success: false,
        error: `FamilySearch error: ${txt}`,
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

        // FS sets the ancestry display number on each person via the
        // `display.ascendancyNumber` (Ahnentafel) — e.g. 1=root, 2=father, 3=mother…
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

    // STEP 5b — wire parent_ids from relationships
    for (const rel of rawRelationships) {
      try {
        const type = (rel?.type ?? "") as string;
        if (!type.toLowerCase().includes("parentchild")) continue;

        // GEDCOM-X: person1 = parent, person2 = child (resourceId or resource)
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
    console.error(
      "[familysearch-pull-tree] FAILED:",
      JSON.stringify({ message: (err as Error).message }),
    );
    return json(500, { success: false, error: (err as Error).message });
  }
});
