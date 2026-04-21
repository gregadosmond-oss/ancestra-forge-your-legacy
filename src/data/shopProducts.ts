export type ShopProduct = {
  id: string;
  name: string;
  price: string;
  priceNote?: string;
  description: string;
  tag?: string;
  category: "digital" | "print" | "drinkware" | "keepsake" | "book";
  live?: boolean;
  href?: string;
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

export const SHOP_PRODUCTS: ShopProduct[] = [
  // Digital
  {
    id: "legacy-pack",
    name: "Legacy Pack",
    price: "$19.99",
    priceNote: "Instant delivery",
    description: "Custom coat of arms (hi-res PNG & SVG), AI-written family story (9 chapters), visual bloodline tree, legacy certificate. Delivered to your inbox in minutes.",
    tag: "Most Popular",
    category: "digital",
  },

  // Drinkware
  {
    id: "heirloom-mug",
    name: "Family Crest Mug",
    price: "$39.99",
    priceNote: "Ships in 5–7 days",
    description: "Your family crest on a ceramic mug with QR code — printed and shipped worldwide. Includes the full digital Legacy Pack.",
    tag: "Now Available",
    category: "drinkware",
    live: true,
    href: "/product-order?type=heirloom",
  },

  // Canvas
  {
    id: "canvas-8x10",
    name: 'Canvas Print 8"×10"',
    price: "$34.99",
    priceNote: "Ships in 5–7 days",
    description: "Gallery-wrapped canvas of your family crest. Includes the full digital Legacy Pack.",
    category: "print",
    live: true,
    href: "/product-order?type=canvas-8x10",
  },

  {
    id: "canvas-12x16",
    name: 'Canvas Print 12"×16"',
    price: "$42.99",
    priceNote: "Ships in 5–7 days",
    description: "Gallery-wrapped canvas of your family crest. Includes the full digital Legacy Pack.",
    category: "print",
    live: true,
    href: "/product-order?type=canvas-12x16",
  },

  {
    id: "canvas-18x24",
    name: 'Canvas Print 18"×24"',
    price: "$59.99",
    priceNote: "Ships in 5–7 days",
    description: "A bold statement piece for the living room or study. Includes Legacy Pack.",
    tag: "Best Seller",
    category: "print",
    live: true,
    href: "/product-order?type=canvas-18x24",
  },

  {
    id: "canvas-24x36",
    name: 'Canvas Print 24"×36"',
    price: "$89.99",
    priceNote: "Ships in 5–7 days",
    description: "Large-format gallery canvas — the centrepiece of any room. Includes Legacy Pack.",
    category: "print",
    live: true,
    href: "/product-order?type=canvas-24x36",
  },

  // Blanket
  {
    id: "blanket-30x40",
    name: 'Throw Blanket 30"×40"',
    price: "$39.99",
    priceNote: "Ships in 5–7 days",
    description: "Your family crest on a cozy sublimation throw. Warmth with a story. Includes Legacy Pack.",
    category: "keepsake",
    live: true,
    href: "/product-order?type=blanket-30x40",
  },

  {
    id: "blanket-50x60",
    name: 'Throw Blanket 50"×60"',
    price: "$49.99",
    priceNote: "Ships in 5–7 days",
    description: "Full-size throw with your family crest — our most popular size. Includes Legacy Pack.",
    tag: "Most Popular",
    category: "keepsake",
    live: true,
    href: "/product-order?type=blanket-50x60",
  },

  {
    id: "blanket-60x80",
    name: 'Throw Blanket 60"×80"',
    price: "$59.99",
    priceNote: "Ships in 5–7 days",
    description: "Our largest throw — built to be passed down for generations. Includes Legacy Pack.",
    category: "keepsake",
    live: true,
    href: "/product-order?type=blanket-60x80",
  },

  // Coaster
  {
    id: "coaster",
    name: "Cork-Back Coaster",
    price: "$34.99",
    priceNote: "Ships in 5–7 days",
    description: "Your family crest on a high-quality cork-back coaster. Elegant, personal, used every day. Includes Legacy Pack.",
    category: "drinkware",
    live: true,
    href: "/product-order?type=coaster",
  },
];

export const SHOP_BUNDLES: ShopBundle[] = [];

export const CATEGORY_LABELS: Record<ShopProduct["category"], string> = {
  digital: "Digital",
  print: "Prints & Wall Art",
  drinkware: "Drinkware",
  keepsake: "Keepsakes",
  book: "Legacy Books",
};
