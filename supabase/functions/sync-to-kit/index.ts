// Sync emails from journey_subscribers into Kit.com (ConvertKit) V3
// and tag them as "ancestorsqr-subscriber" so they enter the
// AncestorsQR newsletter sequence (separate from RelocateIQ).

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const TAG_NAME = "ancestorsqr-subscriber";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiSecret = Deno.env.get("KIT_API_SECRET");
    if (!apiSecret) {
      return json({ success: false, error: "KIT_API_SECRET not configured" }, 500);
    }

    let payload: { email?: string; first_name?: string; source?: string } = {};
    try {
      payload = await req.json();
    } catch {
      return json({ success: false, error: "Invalid JSON body" }, 400);
    }

    const email = (payload.email || "").trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ success: false, error: "Invalid email" }, 400);
    }

    const firstName =
      (payload.first_name && payload.first_name.trim()) ||
      email.split("@")[0];
    const source = payload.source || "ancestorsqr";

    // Step 1: fetch all tags
    let tagId: number | null = null;
    try {
      const tagsRes = await fetch(
        `https://api.convertkit.com/v3/tags?api_secret=${encodeURIComponent(apiSecret)}`,
      );
      if (!tagsRes.ok) {
        const text = await tagsRes.text();
        return json({
          success: false,
          error: `Kit tags lookup failed: ${tagsRes.status} ${text}`,
        }, 502);
      }
      const tagsData = await tagsRes.json();
      const tags: Array<{ id: number; name: string }> = tagsData?.tags || [];
      const map = new Map(tags.map((t) => [t.name, t.id]));
      tagId = map.get(TAG_NAME) ?? null;
    } catch (err) {
      return json({
        success: false,
        error: `Kit tags fetch error: ${(err as Error).message}`,
      }, 502);
    }

    if (!tagId) {
      return json({
        success: false,
        error: `Tag "${TAG_NAME}" not found in Kit account. Create it first (expected ID 19238603).`,
      }, 404);
    }

    // Step 2: subscribe email to tag
    try {
      const subRes = await fetch(
        `https://api.convertkit.com/v3/tags/${tagId}/subscribe`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            api_secret: apiSecret,
            email,
            first_name: firstName,
            fields: { source },
          }),
        },
      );

      const data = await subRes.json().catch(() => ({}));

      if (!subRes.ok) {
        return json({
          success: false,
          error: `Kit subscribe failed: ${subRes.status} ${JSON.stringify(data)}`,
        }, 502);
      }

      return json({
        success: true,
        tag_id: tagId,
        subscriber_id: data?.subscription?.subscriber?.id ?? null,
        email,
      });
    } catch (err) {
      return json({
        success: false,
        error: `Kit subscribe error: ${(err as Error).message}`,
      }, 502);
    }
  } catch (err) {
    return json({
      success: false,
      error: `Unexpected error: ${(err as Error).message}`,
    }, 500);
  }
});
