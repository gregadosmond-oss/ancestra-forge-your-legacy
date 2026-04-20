import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SITE_ORIGIN = "https://ancestorsqr.com";
const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/ancestra-crest-3d.png`;
const DEFAULT_TITLE = "AncestorsQR — Every Family Has a Story Worth Telling";
const DEFAULT_DESCRIPTION =
  "Discover your ancestry, forge your family crest, and pass on your legacy. AncestorsQR turns your surname into a story worth telling.";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function titleCase(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function buildOgTags(args: {
  title: string;
  description: string;
  image: string;
  url: string;
}): string {
  const title = escapeHtml(args.title);
  const description = escapeHtml(args.description);
  const image = escapeHtml(args.image);
  const url = escapeHtml(args.url);
  return [
    `<meta name="description" content="${description}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="AncestorsQR" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:image" content="${image}" />`,
    `<meta property="og:image:alt" content="${title}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${description}" />`,
    `<meta name="twitter:image" content="${image}" />`,
  ].join("\n    ");
}

function stripExistingTags(html: string): string {
  return html
    .replace(/\s*<meta\s+name="description"[^>]*>/gi, "")
    .replace(/\s*<meta\s+property="og:[^"]*"[^>]*>/gi, "")
    .replace(/\s*<meta\s+name="twitter:[^"]*"[^>]*>/gi, "");
}

function injectTags(html: string, tags: string, pageTitle: string): string {
  const cleaned = stripExistingTags(html);
  const withTitle = cleaned.replace(
    /<title>[\s\S]*?<\/title>/i,
    `<title>${escapeHtml(pageTitle)}</title>`,
  );
  if (/<\/head>/i.test(withTitle)) {
    return withTitle.replace(/<\/head>/i, `    ${tags}\n  </head>`);
  }
  return withTitle;
}

function fallbackShell(tags: string, title: string, shareUrl: string): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    ${tags}
    <meta http-equiv="refresh" content="0; url=${escapeHtml(shareUrl)}" />
  </head>
  <body>
    <p>Loading your legacy…</p>
    <script>window.location.replace(${JSON.stringify(shareUrl)});</script>
  </body>
</html>`;
}

serve(async (req) => {
  const url = new URL(req.url);

  // Accept surname from ?surname=... (Netlify :splat) or trailing path segment.
  let surname = url.searchParams.get("surname") ?? "";
  if (!surname) {
    const parts = url.pathname.split("/").filter(Boolean);
    surname = parts[parts.length - 1] ?? "";
  }
  surname = decodeURIComponent(surname).toLowerCase().trim().replace(/[^a-z0-9'\- ]/g, "");

  const shareUrl = surname
    ? `${SITE_ORIGIN}/f/${encodeURIComponent(surname)}`
    : SITE_ORIGIN;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  // Fetch upstream index.html in parallel with DB lookups.
  // og=1 is a cache-buster hint; the root path serves index.html, not og-preview.
  const [htmlRes, factsRes, crestRes] = await Promise.all([
    fetch(`${SITE_ORIGIN}/?og=1`, { redirect: "follow" }).catch(() => null),
    surname
      ? supabase.from("surname_facts").select("payload").eq("surname", surname).maybeSingle()
      : Promise.resolve({ data: null, error: null } as const),
    surname
      ? supabase.from("surname_crests").select("image_url").eq("surname", surname).maybeSingle()
      : Promise.resolve({ data: null, error: null } as const),
  ]);

  const payload = (factsRes as { data: { payload?: unknown } | null }).data?.payload as
    | {
        displaySurname?: string;
        mottoEnglish?: string;
        meaning?: { origin?: string; role?: string };
      }
    | null
    | undefined;

  const crestUrl = (crestRes as { data: { image_url?: string } | null }).data?.image_url;

  const display = payload?.displaySurname ?? titleCase(surname);

  const title = display ? `House of ${display} — Their Legacy` : DEFAULT_TITLE;

  const description = (() => {
    if (payload?.meaning) {
      const motto = payload.mottoEnglish ? `"${payload.mottoEnglish}." ` : "";
      const body = [payload.meaning.origin, payload.meaning.role]
        .filter(Boolean)
        .join(" — ");
      const combined = `${motto}${body}`.trim();
      if (combined) return combined.slice(0, 280);
    }
    if (display) {
      return `Discover the story, crest, and legacy of House ${display}. Every family has a story worth telling.`;
    }
    return DEFAULT_DESCRIPTION;
  })();

  const image = crestUrl || DEFAULT_OG_IMAGE;

  const tags = buildOgTags({ title, description, image, url: shareUrl });

  let body: string;
  if (htmlRes && htmlRes.ok) {
    const upstream = await htmlRes.text();
    body = injectTags(upstream, tags, title);
  } else {
    body = fallbackShell(tags, title, shareUrl);
  }

  return new Response(body, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=300, s-maxage=600",
      "x-og-preview": surname || "default",
    },
  });
});
