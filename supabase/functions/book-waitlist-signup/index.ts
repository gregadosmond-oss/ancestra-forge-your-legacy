import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, surname } = await req.json();

    if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email)) {
      return new Response(JSON.stringify({ error: "Please enter a valid email address." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanSurname = surname && typeof surname === "string" ? surname.trim().slice(0, 100) : null;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { error: insertError } = await supabase
      .from("book_waitlist")
      .insert({ email: cleanEmail, surname: cleanSurname, source: "shop" });

    // 23505 = unique violation. Treat as success so we don't leak which emails are signed up.
    const isDuplicate = insertError?.code === "23505";

    if (insertError && !isDuplicate) {
      console.error("[book-waitlist-signup] insert error:", insertError);
      return new Response(JSON.stringify({ error: "Could not save your signup. Please try again." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send confirmation email via Resend (best effort — don't fail the signup if email fails)
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (resendKey && !isDuplicate) {
      try {
        const resendResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "AncestorsQR <noreply@ancestorsqr.com>",
            to: cleanEmail,
            subject: "You're on the list — your Legacy Book is coming",
            html: `
              <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; padding: 32px; color: #1a1510; background: #ffffff;">
                <h1 style="font-size: 24px; color: #1a1510; margin: 0 0 16px;">Welcome to the Legacy Book waitlist.</h1>
                <p style="font-size: 16px; line-height: 1.6; color: #3d3020;">Thank you for being among the first.</p>
                <p style="font-size: 16px; line-height: 1.6; color: #3d3020;">The Legacy Book is a hardcover heirloom — your full family story, your custom coat of arms, your migration path, all bound in cream cloth with gold-foil detail. It's the most permanent way we know to pass a story forward.</p>
                <p style="font-size: 16px; line-height: 1.6; color: #3d3020;">We'll email you the moment it's ready to order. No spam, no other lists.</p>
                <p style="font-size: 15px; font-style: italic; color: #a07830; margin-top: 32px;">Every family has a story worth telling.</p>
                <p style="font-size: 14px; color: #8a7e6e; margin-top: 8px;">— The AncestorsQR team</p>
              </div>
            `,
          }),
        });

        if (!resendResponse.ok) {
          const errorBody = await resendResponse.text();
          console.error("[book-waitlist-signup] resend rejected:", resendResponse.status, errorBody);
        } else {
          console.log("[book-waitlist-signup] confirmation email sent to", cleanEmail);
        }
      } catch (emailError) {
        console.error("[book-waitlist-signup] resend network error (non-fatal):", emailError);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[book-waitlist-signup] unexpected error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message || "Unexpected error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
