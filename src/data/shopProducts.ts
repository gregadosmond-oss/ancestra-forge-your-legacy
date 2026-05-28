export type ShopProduct = {
  id: string;
  name: string;
  price: string;
  priceNote?: string;
  description: string;
  tag?: string;
  category: "digital" | "book";
  live?: boolean;
  href?: string;
  image?: string;
  notify?: boolean;
};

export type ShopBundle = {
  id: string;
  name: string;
  price: string;
  originalPrice?: string;
  tagline: string;
  includes: string[];
  tag?: string;
  bestFor: string;
};

// Storefront now offers only two products: the digital Legacy Pack
// and the physical Legacy Book. All other merch (mug, canvas, blanket,
// coaster, notebook, t-shirt, metal print, garden flag, golf towel,
// Heirloom Bundle) was removed during the digital-first revamp.
export const SHOP_PRODUCTS: ShopProduct[] = [
  {
    id: "legacy-pack",
    name: "Legacy Pack",
    price: "$29.99",
    priceNote: "Instant delivery",
    description:
      "Custom coat of arms (hi-res PNG & SVG), AI-written family story (9 chapters), visual migration path, legacy certificate. Delivered to your inbox in minutes.",
    tag: "Most Popular",
    category: "digital",
    live: true,
    href: "/pricing",
  },
  {
    id: "legacy-book",
    name: "The Legacy Book",
    price: "$99",
    priceNote: "Ships in 7–10 days",
    description:
      "A hardcover heirloom of your full family story — your custom coat of arms, all 9 chapters, your visual bloodline tree, and your migration path. Bound in cream cloth with gold-foil detail. Printed and shipped worldwide.",
    tag: "New",
    category: "book",
    live: true,
    href: "/legacy-book",
    image: "/legacy-book-hero.png",
  },
];

export const SHOP_BUNDLES: ShopBundle[] = [];

export const CATEGORY_LABELS: Record<ShopProduct["category"], string> = {
  digital: "Digital",
  book: "Legacy Books",
};
