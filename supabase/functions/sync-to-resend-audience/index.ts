// Sync new AncestorsQR signups to the default Resend Audience for future broadcasts.
// Idempotent: duplicate contacts are treated as success.

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json(405, { success: false, error: "Method not allowed" });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      console.error(
        "[sync-to-resend-audience] FAILED:",
        JSON.stringify({ error: "RESEND_API_KEY not configured" }),
      );
      return json(500, { success: false, error: "RESEND_API_KEY not configured" });
    }

    let payload: { email?: string; first_name?: string | null; source?: string };
    try {
      payload = await req.json();
    } catch {
      return json(400, { success: false, error: "Invalid JSON body" });
    }

    const email = (payload.email || "").trim().toLowerCase();
    const firstName =
      payload.first_name && payload.first_name.trim().length > 0
        ? payload.first_name.trim()
        : null;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json(400, { success: false, error: "Valid email is required" });
    }

    console.log("[sync-to-resend-audience] received request for:", email);

    // Step 1 — discover audience id
    const audRes = await fetch("https://api.resend.com/audiences", {
      method: "GET",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}` },
    });
    const audBody = await audRes.json().catch(() => ({}));

    if (!audRes.ok) {
      console.error(
        "[sync-to-resend-audience] FAILED:",
        JSON.stringify({ step: "list-audiences", status: audRes.status, body: audBody }),
      );
      return json(200, {
        success: false,
        error: `Failed to list audiences (${audRes.status})`,
        details: audBody,
      });
    }

    const audiences = Array.isArray(audBody?.data) ? audBody.data : [];
    if (audiences.length === 0) {
      console.error(
        "[sync-to-resend-audience] FAILED:",
        JSON.stringify({ error: "No audiences found" }),
      );
      return json(200, { success: false, error: "No audiences found" });
    }

    const audienceId: string = audiences[0].id;
    console.log("[sync-to-resend-audience] discovered audience_id:", audienceId);

    // Step 2 — add contact
    const addRes = await fetch(
      `https://api.resend.com/audiences/${audienceId}/contacts`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          first_name: firstName,
          unsubscribed: false,
        }),
      },
    );
    const addBody = await addRes.json().catch(() => ({}));
    console.log(
      "[sync-to-resend-audience] add contact status:",
      addRes.status,
      "body:",
      JSON.stringify(addBody),
    );

    // Success
    if (addRes.status === 201 || addRes.ok) {
      return json(200, {
        success: true,
        audience_id: audienceId,
        contact_id: addBody?.id ?? addBody?.data?.id ?? null,
        email,
      });
    }

    // Idempotent: treat "already exists" as success
    const errMsg = (addBody?.message || addBody?.error || "").toString().toLowerCase();
    if (addRes.status === 409 || errMsg.includes("already exists") || errMsg.includes("already")) {
      return json(200, {
        success: true,
        audience_id: audienceId,
        contact_id: null,
        email,
        already_exists: true,
      });
    }

    console.error(
      "[sync-to-resend-audience] FAILED:",
      JSON.stringify({ step: "add-contact", status: addRes.status, body: addBody }),
    );
    return json(200, {
      success: false,
      error: `Failed to add contact (${addRes.status})`,
      details: addBody,
    });
  } catch (err) {
    console.error(
      "[sync-to-resend-audience] FAILED:",
      JSON.stringify({ error: (err as Error)?.message || String(err) }),
    );
    return json(200, {
      success: false,
      error: (err as Error)?.message || "Unknown error",
    });
  }
});
