import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const fail = (step: string, error: string) =>
  json(500, { success: false, step, error });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  let surname = "Osmond";
  try {
    const body = await req.json().catch(() => ({}));
    if (body && typeof body.surname === "string" && body.surname.trim()) {
      surname = body.surname.trim();
    }
  } catch (_) {
    // no body — keep default
  }

  const authHeader = {
    Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    apikey: SERVICE_ROLE_KEY,
    "Content-Type": "application/json",
  };

  // Step 1: generate-legacy
  let legacy: any;
  try {
    const res = await fetch(
      `${SUPABASE_URL}/functions/v1/generate-legacy`,
      {
        method: "POST",
        headers: authHeader,
        body: JSON.stringify({ surname }),
      },
    );
    const text = await res.text();
    if (!res.ok) {
      return fail("generate-legacy", `HTTP ${res.status}: ${text}`);
    }
    try {
      legacy = JSON.parse(text);
    } catch (_) {
      return fail("generate-legacy", `Invalid JSON: ${text.slice(0, 500)}`);
    }
  } catch (err) {
    return fail("generate-legacy", (err as Error).message);
  }

  // Pull out facts, story, and teaserChapters (be permissive on shape)
  const facts = legacy?.facts ?? legacy?.LegacyFacts ?? legacy;
  const story = legacy?.story ?? legacy?.LegacyStory ?? legacy?.story_payload;
  const teaserChapters =
    story?.teaserChapters ??
    legacy?.teaserChapters ??
    legacy?.story?.teaserChapters ??
    [];

  // Step 2: expand-chapters
  let chapters: any;
  try {
    const res = await fetch(
      `${SUPABASE_URL}/functions/v1/expand-chapters`,
      {
        method: "POST",
        headers: authHeader,
        body: JSON.stringify({ surname, teaserChapters }),
      },
    );
    const text = await res.text();
    if (!res.ok) {
      return fail("expand-chapters", `HTTP ${res.status}: ${text}`);
    }
    try {
      chapters = JSON.parse(text);
    } catch (_) {
      return fail("expand-chapters", `Invalid JSON: ${text.slice(0, 500)}`);
    }
  } catch (err) {
    return fail("expand-chapters", (err as Error).message);
  }

  // Merge
  const merged = {
    surname,
    generatedAt: new Date().toISOString(),
    facts,
    story,
    chapters,
  };

  const payload = JSON.stringify(merged, null, 2);
  const bytes = new TextEncoder().encode(payload);

  // Upload to Storage
  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const path = "fixtures/osmond-fixture.json";
    const { error: uploadErr } = await supabase.storage
      .from("print-designs")
      .upload(path, bytes, {
        contentType: "application/json",
        upsert: true,
      });
    if (uploadErr) {
      return fail("upload", uploadErr.message);
    }

    const { data: pub } = supabase.storage
      .from("print-designs")
      .getPublicUrl(path);

    const chapterCount = Array.isArray(chapters)
      ? chapters.length
      : Array.isArray(chapters?.chapters)
        ? chapters.chapters.length
        : Array.isArray(chapters?.expandedChapters)
          ? chapters.expandedChapters.length
          : 0;

    return json(200, {
      success: true,
      url: pub.publicUrl,
      bytes: bytes.byteLength,
      chapters: chapterCount,
    });
  } catch (err) {
    return fail("upload", (err as Error).message);
  }
});
