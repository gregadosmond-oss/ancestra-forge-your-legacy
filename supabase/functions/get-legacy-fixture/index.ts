import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

function slugify(surname: string): string {
  return (
    surname
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "") || ""
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  let surname = "";
  try {
    const body = await req.json().catch(() => ({}));
    if (body && typeof body.surname === "string") surname = body.surname;
  } catch (_) {
    // ignore
  }

  const slug = slugify(surname);
  if (!slug) {
    return json(400, { error: "surname required" });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const path = `fixtures/${slug}-fixture.json`;

  const { data, error } = await supabase.storage
    .from("print-designs")
    .download(path);

  if (error || !data) {
    return json(404, { error: "fixture_not_found", path });
  }

  try {
    const fixture = JSON.parse(await data.text());
    return json(200, { fixture, path });
  } catch (err) {
    return json(500, { error: "invalid_fixture_json", detail: (err as Error).message });
  }
});
