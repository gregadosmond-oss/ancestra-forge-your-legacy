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
  // ── DIGITAL ──
  {
    id: "legacy-pack",
    name: "Legacy Pack",
    price: "$29",
    priceNote: "Instant delivery",
    description:
      "Custom coat of arms (hi-res PNG & SVG), AI-written family story (9 chapters), visual bloodline tree, legacy certificate. Everything delivered to your inbox in minutes.",
    tag: "Most Popular",
    category: "digital",
  },
  {
    id: "custom-crest-download",
    name: "Custom Crest Download",
    price: "$19",
    priceNote: "Instant delivery",
    description:
      "Your family's coat of arms in high-resolution PNG and SVG — ready to print, share, or use on any product.",
    category: "digital",
  },
  {
    id: "legacy-certificate",
    name: "Legacy Certificate",
    price: "$49",
    priceNote: "Instant PDF delivery",
    description:
      "A formal, frameable certificate documenting your family lineage, coat of arms, and motto. Perfect for gifting.",
    category: "digital",
  },
  {
    id: "combined-wedding-crest",
    name: "Combined Wedding Crest",
    price: "$79",
    priceNote: "24–48hr delivery",
    description:
      "Both families' crests merged into one — a digital heirloom for a new life together. Unique to AncestorsQR.",
    tag: "Unique to AncestorsQR",
    category: "digital",
  },

  // ── PRINT & WALL ──
  {
    id: "framed-print-11x14",
    name: "Framed Crest Print (11×14)",
    price: "$79",
    description:
      "Your coat of arms beautifully printed and framed. Ready to hang the day it arrives. Ships worldwide.",
    tag: "Best Seller",
    category: "print",
  },
  {
    id: "framed-print-16x20",
    name: "Framed Crest Print (16×20)",
    price: "$99",
    description:
      "A larger statement piece for the living room, study, or man cave. Your legacy, wall-ready.",
    category: "print",
  },
  {
    id: "canvas-print",
    name: "Canvas Print",
    price: "$89",
    description:
      "Gallery-wrapped canvas of your family crest. Artwork that actually means something.",
    category: "print",
  },
  {
    id: "metal-wall-sign",
    name: "Metal Wall Sign",
    price: "$149",
    description:
      "Heavy-gauge metal bearing your family crest and name. The centrepiece of any room.",
    tag: "Statement Piece",
    category: "print",
  },

  // ── DRINKWARE ──
  {
    id: "heirloom-mug",
    name: "Heirloom Crest Mug",
    price: "$49.99",
    priceNote: "Ships in 5–7 days",
    description:
      "Your family crest, name & QR code on a ceramic mug — printed and shipped worldwide. Includes the full digital Legacy Pack ($29 value).",
    tag: "Now Available",
    category: "drinkware",
    live: true,
    href: "/heirloom-order",
  },
  {
    id: "beer-mug",
    name: "Beer Mug",
    price: "$39",
    description:
      "Your family crest on a quality beer mug. A gift they'll use every celebration.",
    category: "drinkware",
  },
  {
    id: "whiskey-glass",
    name: "Whiskey Glass",
    price: "$39",
    description:
      "The family crest on a whiskey glass. A daily reminder of where you come from.",
    tag: "Dad Favourite",
    category: "drinkware",
  },
  {
    id: "coaster-set",
    name: "Coaster Set (×4)",
    price: "$24",
    description:
      "Four coasters, each bearing the family crest. Elegant, personal, and used every day.",
    category: "drinkware",
  },

  // ── KEEPSAKE ──
  {
    id: "christmas-ornament",
    name: "Christmas Ornament",
    price: "$29",
    description:
      "The family crest as a keepsake ornament. Goes on the tree every year, forever.",
    tag: "Holiday Favourite",
    category: "keepsake",
  },
  {
    id: "wax-seal-stamp",
    name: "Wax Seal Stamp",
    price: "$49",
    description:
      "A wax seal stamp of your family crest — for thank you notes, envelopes, and keepsakes.",
    category: "keepsake",
  },
  {
    id: "cufflinks",
    name: "Crest Cufflinks",
    price: "$39",
    description:
      "Your family crest as custom cufflinks. Elegance with meaning, worn close every day.",
    category: "keepsake",
  },
  {
    id: "phone-case",
    name: "Phone Case",
    price: "$29",
    description:
      "Your family crest on a premium phone case. Carry your legacy everywhere.",
    category: "keepsake",
  },
  {
    id: "blanket",
    name: "Blanket / Throw",
    price: "$59",
    description:
      "A full-size throw with your family crest woven in. Warmth with a story.",
    category: "keepsake",
  },

  // ── BOOKS ──
  {
    id: "softcover-book",
    name: "Softcover Legacy Book",
    price: "$59",
    description:
      "Your family's complete history in a beautifully designed softcover book. The story of every generation.",
    tag: "Most Meaningful",
    category: "book",
  },
  {
    id: "hardcover-book",
    name: "Hardcover Legacy Book",
    price: "$89",
    description:
      "Premium hardcover edition of your family legacy book. Built to be passed down for generations.",
    tag: "Heirloom Edition",
    category: "book",
  },
];

export const SHOP_BUNDLES: ShopBundle[] = [
  {
    id: "dad-bundle",
    name: "Dad Bundle",
    price: "$129",
    tagline: "The perfect Father's Day gift.",
    bestFor: "Father's Day",
    includes: ["Framed crest print (11×14)", "Whiskey glass", "Legacy certificate"],
    tag: "Father's Day",
  },
  {
    id: "mom-bundle",
    name: "Mom Bundle",
    price: "$139",
    tagline: "Honour the woman who kept the story alive.",
    bestFor: "Mother's Day",
    includes: ["Legacy book (softcover)", "Family tree print", "Legacy certificate"],
    tag: "Mother's Day",
  },
  {
    id: "christmas-bundle",
    name: "Christmas Bundle",
    price: "$129",
    tagline: "The most meaningful gift under the tree.",
    bestFor: "Christmas",
    includes: ["3× family crest ornaments", "Legacy book", "Coaster set"],
    tag: "Christmas",
  },
  {
    id: "wedding-bundle",
    name: "Wedding Bundle",
    price: "$249",
    tagline: "Unite two families. Tell both stories.",
    bestFor: "Weddings",
    includes: [
      "Combined wedding crest (digital)",
      "Framed print (16×20)",
      "Toasting glasses",
      "Wax seal stamp",
    ],
    tag: "Best Value",
  },
  {
    id: "grad-bundle",
    name: "Grad Bundle",
    price: "$119",
    tagline: "Send them into the world knowing where they came from.",
    bestFor: "Graduation",
    includes: ["Legacy certificate", "Framed crest (11×14)", "Coffee mug"],
    tag: "Graduation",
  },
  {
    id: "reunion-bundle",
    name: "Reunion Bundle",
    price: "$249",
    tagline: "Make this reunion the one they talk about forever.",
    bestFor: "Family Reunions",
    includes: ["10× family crest ornaments", "Family tree poster", "Legacy book"],
    tag: "Family Reunion",
  },
];

export const CATEGORY_LABELS: Record<ShopProduct["category"], string> = {
  digital: "Digital",
  print: "Prints & Wall Art",
  drinkware: "Drinkware",
  keepsake: "Keepsakes",
  book: "Legacy Books",
};
