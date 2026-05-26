// Search WikiTree's free public API for ancestor matches.
// No WikiTree account required — public API. AncestorsQR auth still required.

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
  givenName?: string;
  // legacy/alt field names used by the existing frontend
  first_name?: string;
  birth_year_approx?: number;
  birth_place?: string;
  father_first_name?: string;
  mother_first_name?: string;
  mother_maiden_name?: string;
  birthYear?: string | number;
  birthPlace?: string;
  fatherName?: string;
  motherName?: string;
  motherMaidenName?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json(405, { success: false, error: "Method not allowed" });
  }

  try {
    // Auth gate
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
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

    const body = (await req.json().catch(() => ({}))) as SearchBody;
    const surname = (body.surname || "").trim();
    const givenName = (body.givenName || body.first_name || "").trim();
    const birthYearRaw =
      body.birthYear ?? body.birth_year_approx ?? undefined;
    const birthYear =
      typeof birthYearRaw === "number"
        ? String(birthYearRaw)
        : (birthYearRaw || "").toString().trim();
    const birthPlace = (body.birthPlace || body.birth_place || "").trim();
    const fatherFirst = (body.fatherName || body.father_first_name || "").trim();
    const motherFirst = (body.motherName || body.mother_first_name || "").trim();
    const motherMaiden = (
      body.motherMaidenName || body.mother_maiden_name || ""
    ).trim();

    if (!surname && !givenName) {
      return json(200, {
        success: false,
        error: "Surname or first name is required",
      });
    }

    // Build WikiTree request (form-encoded). BirthDate format YYYY-MM-DD.
    const form = new URLSearchParams();
    form.set("action", "searchPerson");
    form.set("format", "json");
    if (givenName) form.set("FirstName", givenName);
    if (surname) form.set("LastName", surname);
    if (birthYear && /^\d{4}$/.test(birthYear)) {
      form.set("BirthDate", `${birthYear}-00-00`);
      form.set("dateSpread", "5");
    }
    if (birthPlace) form.set("BirthLocation", birthPlace);
    if (fatherFirst) form.set("fatherFirstName", fatherFirst);
    if (motherFirst) form.set("motherFirstName", motherFirst);
    if (motherMaiden) form.set("motherLastName", motherMaiden);
    form.set(
      "fields",
      "Id,Name,FirstName,LastNameAtBirth,LastNameCurrent,BirthDate,BirthLocation,DeathDate,DeathLocation,Father,Mother",
    );
    form.set("limit", "20");

    console.log(
      "[wikitree-search] querying WikiTree:",
      JSON.stringify({
        surname,
        givenName,
        birthYear,
        birthPlace,
        fatherFirst,
        motherFirst,
        motherMaiden,
      }),
    );

    const fsResp = await fetch("https://api.wikitree.com/api.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: form.toString(),
    });

    if (!fsResp.ok) {
      const txt = await fsResp.text().catch(() => "");
      console.error(
        "[wikitree-search] upstream non-2xx:",
        fsResp.status,
        txt.slice(0, 500),
      );
      return json(200, {
        success: false,
        error: `WikiTree upstream error (${fsResp.status})`,
      });
    }

    const raw = await fsResp.json().catch(() => null);
    // API returns an array; first element holds matches.
    const node = Array.isArray(raw) ? raw[0] : raw;
    const matches: any[] = Array.isArray(node?.matches) ? node.matches : [];

    const yearOnly = (d?: string | null) =>
      d && typeof d === "string" && d.length >= 4 && d !== "0000-00-00"
        ? d.slice(0, 4)
        : null;

    const nameOf = (p?: { FirstName?: string; LastNameAtBirth?: string; LastNameCurrent?: string } | null) => {
      if (!p) return null;
      const last = p.LastNameAtBirth || p.LastNameCurrent || "";
      const full = `${p.FirstName ?? ""} ${last}`.trim();
      return full || null;
    };

    const results = matches
      .filter((m) => m && (m.Name || m.Id))
      .map((m) => {
        const slug = m.Name as string | undefined;
        const birth = m.BirthDate as string | undefined;
        const death = m.DeathDate as string | undefined;
        return {
          id: String(m.Id ?? slug ?? ""),
          source: "wikitree",
          name: nameOf(m) || slug || "Unknown",
          birthDate: yearOnly(birth) || birth || null,
          birthPlace: m.BirthLocation || null,
          deathDate: yearOnly(death) || death || null,
          deathPlace: m.DeathLocation || null,
          fatherName: nameOf(m.Father),
          motherName: nameOf(m.Mother),
          profileUrl: slug ? `https://www.wikitree.com/wiki/${slug}` : null,
        };
      });

    console.log("[wikitree-search] matches:", results.length);

    return json(200, { success: true, results });
  } catch (err) {
    console.error("[wikitree-search] FAILED:", (err as Error).message);
    return json(200, { success: false, error: (err as Error).message });
  }
});
