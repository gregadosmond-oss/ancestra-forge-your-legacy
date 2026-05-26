// AI-assisted ancestor search via Claude with web_search tool.
// Used as fallback when WikiTree returns 0 matches.

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
  birthYear?: string | number;
  birthPlace?: string;
  fatherName?: string;
  motherName?: string;
  motherMaidenName?: string;
}

interface ClaudeMatch {
  name?: string;
  birthDate?: string;
  birthPlace?: string;
  deathDate?: string;
  deathPlace?: string;
  fatherName?: string;
  motherName?: string;
  summary?: string;
  sourceUrl?: string;
  confidence?: "high" | "medium" | "low";
}

function extractJson(raw: string): { matches?: ClaudeMatch[] } | null {
  const first = raw.indexOf("{");
  const last = raw.lastIndexOf("}");
  if (first === -1 || last === -1 || last < first) return null;
  try {
    return JSON.parse(raw.slice(first, last + 1));
  } catch {
    return null;
  }
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
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) {
      return json(200, {
        success: false,
        error: "AI search is not configured (missing API key)",
      });
    }

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
    const givenName = (body.givenName || "").trim();
    const birthYear =
      typeof body.birthYear === "number"
        ? String(body.birthYear)
        : (body.birthYear || "").toString().trim();
    const birthPlace = (body.birthPlace || "").trim();
    const fatherName = (body.fatherName || "").trim();
    const motherName = (body.motherName || "").trim();
    const motherMaiden = (body.motherMaidenName || "").trim();

    if (!surname && !givenName) {
      return json(200, {
        success: false,
        error: "Surname or first name is required",
      });
    }

    const prompt = `Search the web for historical genealogical records about this person:

Name: ${givenName} ${surname}
Born: approximately ${birthYear || "unknown"} in ${birthPlace || "unknown"}
Father: ${fatherName || "unknown"}
Mother: ${motherName} ${motherMaiden}

Search across genealogy forums, FamilySearch public profile pages, Ancestry public trees, BillionGraves, newspaper archives, census records, and obituary databases.

Return JSON with up to 5 plausible matches in this exact shape:
{
  "matches": [
    {
      "name": "<full name>",
      "birthDate": "<year or full date if known>",
      "birthPlace": "<location>",
      "deathDate": "<if known>",
      "deathPlace": "<if known>",
      "fatherName": "<if known>",
      "motherName": "<if known>",
      "summary": "<1-2 sentence biographical note>",
      "sourceUrl": "<best primary URL>",
      "confidence": "high|medium|low"
    }
  ]
}

Only return matches you have at least medium confidence in based on search results. Return empty matches array if nothing solid found. Output ONLY the JSON, no other text.`;

    console.log("[claude-ancestor-search] querying Claude for:", givenName, surname);

    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-opus-4-5",
        max_tokens: 4096,
        tools: [
          {
            type: "web_search_20250305",
            name: "web_search",
            max_uses: 5,
          },
        ],
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!resp.ok) {
      const txt = await resp.text().catch(() => "");
      console.error(
        "[claude-ancestor-search] upstream non-2xx:",
        resp.status,
        txt.slice(0, 500),
      );
      return json(200, {
        success: false,
        error: `Claude upstream error (${resp.status})`,
      });
    }

    const claudeJson = (await resp.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };
    const text = (claudeJson.content || [])
      .filter((c) => c.type === "text" && c.text)
      .map((c) => c.text as string)
      .join("\n");

    const parsed = extractJson(text);
    const matches = parsed?.matches ?? [];

    const results = matches
      .filter((m) => m && m.name)
      .slice(0, 5)
      .map((m) => ({
        id: crypto.randomUUID(),
        source: "claude-web" as const,
        name: m.name!,
        birthDate: m.birthDate || null,
        birthPlace: m.birthPlace || null,
        deathDate: m.deathDate || null,
        deathPlace: m.deathPlace || null,
        fatherName: m.fatherName || null,
        motherName: m.motherName || null,
        summary: m.summary || null,
        profileUrl: m.sourceUrl || null,
        confidence: m.confidence || "medium",
      }));

    console.log("[claude-ancestor-search] matches:", results.length);

    return json(200, { success: true, results });
  } catch (err) {
    console.error("[claude-ancestor-search] FAILED:", (err as Error).message);
    return json(200, { success: false, error: (err as Error).message });
  }
});
