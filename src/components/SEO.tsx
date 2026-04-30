import { Helmet } from "react-helmet-async";
import { useEffect, useState } from "react";
import { useLocation, useParams, matchPath } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const SITE = "https://ancestorsqr.com";
const DEFAULT_OG_IMAGE = `${SITE}/ancestra-crest-3d.png`;

const DEFAULT_TITLE = "AncestorsQR — Every Family Has a Story Worth Telling";
const DEFAULT_OG_TITLE = DEFAULT_TITLE;
const DEFAULT_OG_DESC =
  "Discover the meaning behind your family name. Forge your custom coat of arms, family story, and bloodline tree in minutes.";

const cap = (s: string) =>
  s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s;

type Meta = {
  title: string;
  ogTitle: string;
  ogDesc: string;
  ogType?: string;
  ogImage?: string;
};

const STATIC_META: Record<string, Meta> = {
  "/": { title: DEFAULT_TITLE, ogTitle: DEFAULT_OG_TITLE, ogDesc: DEFAULT_OG_DESC },
  "/journey/1": {
    title: "Begin Your Journey | AncestorsQR",
    ogTitle: "Begin Your Journey",
    ogDesc:
      "Enter your surname and discover the story your family has been waiting to tell.",
  },
  "/journey/2": {
    title: "Your Name's Story | AncestorsQR",
    ogTitle: "Every name is a story",
    ogDesc:
      "Discover the meaning behind your surname — its origin, its role, its place in history.",
  },
  "/journey/3": {
    title: "Your Bloodline | AncestorsQR",
    ogTitle: "Meet your bloodline",
    ogDesc: "The names, places, and journeys that shaped your family.",
  },
  "/journey/6": {
    title: "Pass It On | AncestorsQR",
    ogTitle: "Pass it on",
    ogDesc: "Share your family's legacy with the people it belongs to.",
  },
  "/tools": {
    title: "Free Tools | AncestorsQR",
    ogTitle: "Free heritage tools",
    ogDesc:
      "Surname lookup, bloodline quiz, motto generator, ancestor chat — all free.",
  },
  "/tools/quiz": {
    title: "Bloodline Quiz | AncestorsQR",
    ogTitle: "What kind of bloodline do you carry?",
    ogDesc: "A 5-question quiz that reveals your family archetype.",
  },
  "/tools/surname": {
    title: "Surname Lookup | AncestorsQR",
    ogTitle: "Where does your name come from?",
    ogDesc: "Discover the meaning, origin, and history of any surname.",
  },
  "/tools/motto": {
    title: "Motto Generator | AncestorsQR",
    ogTitle: "Forge your family motto",
    ogDesc: "Three values become a Latin motto carved for your family.",
  },
  "/tools/chat": {
    title: "Ancestor Chat | AncestorsQR",
    ogTitle: "Talk with your ancestor",
    ogDesc: "Have a real conversation with someone from your bloodline.",
  },
  "/pricing": {
    title: "Pricing | AncestorsQR",
    ogTitle: "Simple pricing for your legacy",
    ogDesc:
      "Start free. Unlock your full story for $29.99. Add an heirloom to make it last.",
  },
  "/shop": {
    title: "Heirloom Shop | AncestorsQR",
    ogTitle: "Heirloom Shop",
    ogDesc:
      "Mugs, canvas, blankets, and keepsakes — all forged with your family crest.",
  },
  "/cart": {
    title: "Your Cart | AncestorsQR",
    ogTitle: "Your cart",
    ogDesc: DEFAULT_OG_DESC,
  },
  "/checkout": {
    title: "Checkout | AncestorsQR",
    ogTitle: "Checkout",
    ogDesc: DEFAULT_OG_DESC,
  },
  "/heirloom-order": {
    title: "Order Your Heirloom Mug | AncestorsQR",
    ogTitle: "Order your heirloom mug",
    ogDesc:
      "Custom ceramic mug with your family crest — includes the full Legacy Pack.",
  },
  "/product-order": {
    title: "Order Your Heirloom | AncestorsQR",
    ogTitle: "Order your heirloom",
    ogDesc: DEFAULT_OG_DESC,
  },
  "/deep-legacy": {
    title: "Deep Legacy — Premium Research | AncestorsQR",
    ogTitle: "Deep Legacy — your family's full story uncovered",
    ogDesc:
      "A guided AI interview + deep historical research reveals 5 generations of your bloodline.",
  },
  "/about": {
    title: "Our Story | AncestorsQR",
    ogTitle: "Our story",
    ogDesc:
      "The Osmond family traced back to 1066 — and why every family deserves their story told.",
  },
  "/my-legacy": {
    title: "My Legacy | AncestorsQR",
    ogTitle: "My Legacy",
    ogDesc: DEFAULT_OG_DESC,
  },
  "/privacy-policy": {
    title: "Privacy Policy | AncestorsQR",
    ogTitle: "Privacy Policy",
    ogDesc: DEFAULT_OG_DESC,
  },
  "/terms": {
    title: "Terms of Service | AncestorsQR",
    ogTitle: "Terms of Service",
    ogDesc: DEFAULT_OG_DESC,
  },
};

function MetaTags({
  title,
  ogTitle,
  ogDesc,
  ogType = "website",
  ogImage = DEFAULT_OG_IMAGE,
  url,
}: {
  title: string;
  ogTitle: string;
  ogDesc: string;
  ogType?: string;
  ogImage?: string;
  url: string;
}) {
  return (
    <Helmet prioritizeSeoTags>
      <title>{title}</title>
      <meta name="description" content={ogDesc} />
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content="AncestorsQR" />
      <meta property="og:title" content={ogTitle} />
      <meta property="og:description" content={ogDesc} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={url} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={ogTitle} />
      <meta name="twitter:description" content={ogDesc} />
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  );
}

/** Surname share page /f/:surname — fetches cached crest from surname_crests */
function ShareSEO() {
  const { surname: rawSurname } = useParams<{ surname: string }>();
  const surname = (rawSurname ?? "").toLowerCase().trim();
  const display = cap(surname);
  const [crestUrl, setCrestUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!surname) return;
    let active = true;
    supabase
      .from("surname_crests")
      .select("image_url")
      .eq("surname", surname)
      .maybeSingle()
      .then(({ data }) => {
        if (active && data?.image_url) setCrestUrl(data.image_url);
      });
    return () => {
      active = false;
    };
  }, [surname]);

  const title = `The ${display} Family Story | AncestorsQR`;
  const ogTitle = `The ${display} Family Story`;
  const ogDesc = `Discover the meaning of ${display} and the family that came before you. Forged on AncestorsQR.`;
  const url = `${SITE}/f/${surname}`;

  return (
    <MetaTags
      title={title}
      ogTitle={ogTitle}
      ogDesc={ogDesc}
      ogType="article"
      ogImage={crestUrl ?? DEFAULT_OG_IMAGE}
      url={url}
    />
  );
}

/** Default/static SEO router — handles every non-dynamic route */
export default function SEO() {
  const location = useLocation();
  const path = location.pathname;
  const url = `${SITE}${path}`;

  // Dynamic share page
  if (matchPath("/f/:surname", path)) {
    return <ShareSEO />;
  }

  // Journey stops 4 and 5 are handled inside JourneyLayout (need JourneyContext)
  if (path === "/journey/4" || path === "/journey/5") {
    return null;
  }

  // 404 fallback handled by NotFound page-level — but route still gets here.
  // We'll detect it by matching against the static map first; anything else → default.
  let meta = STATIC_META[path];

  // Treat /home, /journey, and unknowns specially
  if (!meta) {
    if (path === "/checkout/return") {
      meta = STATIC_META["/checkout"];
    } else {
      // Default fallback (also covers 404)
      meta = {
        title: DEFAULT_TITLE,
        ogTitle: DEFAULT_OG_TITLE,
        ogDesc: DEFAULT_OG_DESC,
      };
    }
  }

  return (
    <MetaTags
      title={meta.title}
      ogTitle={meta.ogTitle}
      ogDesc={meta.ogDesc}
      ogType={meta.ogType ?? "website"}
      ogImage={meta.ogImage ?? DEFAULT_OG_IMAGE}
      url={url}
    />
  );
}

/** Mounted inside JourneyLayout — has access to JourneyContext for surname */
export function JourneyDynamicSEO({ surname }: { surname: string | null }) {
  const location = useLocation();
  const path = location.pathname;
  const url = `${SITE}${path}`;

  if (path !== "/journey/4" && path !== "/journey/5") return null;

  const display = surname ? cap(surname.trim()) : null;

  let title = DEFAULT_TITLE;
  let ogTitle = DEFAULT_OG_TITLE;
  let ogDesc = DEFAULT_OG_DESC;

  if (path === "/journey/4") {
    title = display
      ? `House of ${display} — Your Crest | AncestorsQR`
      : "Your Crest | AncestorsQR";
    ogTitle = display ? `The crest of House ${display}` : "Your crest";
    ogDesc =
      "Your family's coat of arms, motto, and symbolism — forged from history.";
  } else if (path === "/journey/5") {
    title = display
      ? `Your Family Story | AncestorsQR`
      : "Your Family Story | AncestorsQR";
    ogTitle = display ? `The ${display} family story` : "Your family story";
    ogDesc = "The full 9-chapter story of where you came from.";
  }

  return (
    <MetaTags
      title={title}
      ogTitle={ogTitle}
      ogDesc={ogDesc}
      ogType="website"
      url={url}
    />
  );
}
