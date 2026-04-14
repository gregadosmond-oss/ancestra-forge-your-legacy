import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { callClaudeJson } from "./claude.ts";
import {
  FACTS_SYSTEM,
  factsSummaryForStory,
  factsUser,
  MODEL_VERSION,
  STORY_SYSTEM,
  storyUser,
} from "./prompts.ts";
import { generateLegacy } from "./orchestrator.ts";
import type { LegacyFacts, LegacyStory } from "./types.ts";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "content-type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return json({ error: "method not allowed" }, 405);
  }

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!apiKey || !supabaseUrl || !supabaseKey) {
    return json({ error: "missing env" }, 500);
  }

  let body: { surname?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid json" }, 400);
  }
  if (typeof body.surname !== "string" || body.surname.trim().length === 0) {
    return json({ error: "surname required" }, 400);
  }
  if (body.surname.length > 60) {
    return json({ error: "surname too long" }, 400);
  }

  const client = createClient(supabaseUrl, supabaseKey);

  const result = await generateLegacy({
    client,
    surname: body.surname,
    modelVersion: MODEL_VERSION,
    callFacts: async (surname) =>
      callClaudeJson<LegacyFacts>({
        apiKey,
        system: FACTS_SYSTEM,
        user: factsUser(surname),
      }),
    callStory: async (surname, facts) =>
      callClaudeJson<LegacyStory>({
        apiKey,
        system: STORY_SYSTEM,
        user: storyUser(surname, factsSummaryForStory(facts)),
      }),
  });

  return json(result);
});
