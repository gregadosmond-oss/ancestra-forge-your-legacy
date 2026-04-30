import { useEffect } from "react";

interface PageMeta {
  title: string;
  description?: string;
  image?: string;
  url?: string;
  type?: "website" | "article";
}

const DEFAULT_DESCRIPTION = "Discover the meaning behind your family name. Forge your custom coat of arms, family story, and bloodline tree in minutes.";
const DEFAULT_IMAGE = "https://ancestorsqr.com/og-default.png";

function setMeta(selector: string, attr: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    const match = selector.match(/\[([^=]+)="([^"]+)"\]/);
    if (match) el.setAttribute(match[1], match[2]);
    document.head.appendChild(el);
  }
  el.setAttribute(attr, content);
}

export function usePageMeta({ title, description = DEFAULT_DESCRIPTION, image = DEFAULT_IMAGE, url, type = "website" }: PageMeta) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;
    const canonicalUrl = url || window.location.href;
    setMeta('meta[name="description"]', "content", description);
    setMeta('meta[property="og:title"]', "content", title);
    setMeta('meta[property="og:description"]', "content", description);
    setMeta('meta[property="og:image"]', "content", image);
    setMeta('meta[property="og:url"]', "content", canonicalUrl);
    setMeta('meta[property="og:type"]', "content", type);
    setMeta('meta[name="twitter:card"]', "content", "summary_large_image");
    setMeta('meta[name="twitter:title"]', "content", title);
    setMeta('meta[name="twitter:description"]', "content", description);
    setMeta('meta[name="twitter:image"]', "content", image);
    return () => { document.title = previousTitle; };
  }, [title, description, image, url, type]);
}
