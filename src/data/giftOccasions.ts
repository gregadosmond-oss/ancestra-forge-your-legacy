export type OccasionProduct = {
  name: string;
  price: string;
  description: string;
  tag?: string;
};

export type OccasionBundle = {
  name: string;
  price: string;
  includes: string[];
};

export type OccasionConfig = {
  slug: string;
  name: string;
  heroLabel: string;
  heroHeadline: string;
  heroSubhead: string;
  ctaLine: string;
  products: OccasionProduct[];
  bundle?: OccasionBundle;
};

// All physical merch (mug, canvas, blanket, coaster, framed prints,
// metal signs, ornaments, cufflinks, glasses, wax seals, etc.) was
// removed during the digital-first revamp. Every occasion now offers
// the same two SKUs: digital Legacy Pack + physical Legacy Book.
// Per-occasion `bundle` was removed for the same reason.
const STANDARD_PRODUCTS: OccasionProduct[] = [
  {
    name: "Legacy Book",
    price: "$99",
    description:
      "A hardcover heirloom of their full family story — coat of arms, 9 chapters, bloodline tree, migration path. Printed and shipped worldwide.",
    tag: "Heirloom",
  },
  {
    name: "Legacy Pack",
    price: "$29.99",
    description:
      "Digital crest, full family story, bloodline tree, and legacy certificate — delivered to their inbox in minutes.",
    tag: "Instant Gift",
  },
];

type OccasionCopy = Pick<
  OccasionConfig,
  "slug" | "name" | "heroLabel" | "heroHeadline" | "heroSubhead" | "ctaLine"
>;

const OCCASION_COPY: OccasionCopy[] = [
  {
    slug: "fathers-day",
    name: "Father's Day",
    heroLabel: "Father's Day Gifts",
    heroHeadline: "Make this Father's Day unforgettable.",
    heroSubhead:
      "Give him something that traces his bloodline back centuries — a story, a crest, and a legacy built to last.",
    ctaLine: "This Father's Day, give him the story behind his name.",
  },
  {
    slug: "mothers-day",
    name: "Mother's Day",
    heroLabel: "Mother's Day Gifts",
    heroHeadline: "The gift she'll treasure forever.",
    heroSubhead:
      "She carried the family forward. Give her the story of where it all began.",
    ctaLine: "Honour the woman who kept the story alive.",
  },
  {
    slug: "christmas",
    name: "Christmas",
    heroLabel: "Christmas Gifts",
    heroHeadline: "The most meaningful gift under the tree.",
    heroSubhead:
      "This Christmas, give your family something that lasts beyond the season — their story, their crest, their legacy.",
    ctaLine: "Give a gift that means something this Christmas.",
  },
  {
    slug: "wedding",
    name: "Wedding",
    heroLabel: "Wedding Gifts",
    heroHeadline: "Unite two families. Tell both stories.",
    heroSubhead:
      "A combined wedding crest, their histories woven together — the most unique wedding gift in existence.",
    ctaLine: "The wedding gift they've never seen before.",
  },
  {
    slug: "graduation",
    name: "Graduation",
    heroLabel: "Graduation Gifts",
    heroHeadline: "They know where they're going. Show them where they came from.",
    heroSubhead:
      "A legacy certificate, a family crest, a story — the perfect graduation gift for someone starting their next chapter.",
    ctaLine: "Send them into the world knowing where they came from.",
  },
  {
    slug: "birthday",
    name: "Birthday",
    heroLabel: "Birthday Gifts",
    heroHeadline: "The birthday gift no one else thought of.",
    heroSubhead:
      "While others bring flowers and gift cards, you're giving them their family's entire history.",
    ctaLine: "Give them a birthday gift they'll talk about for years.",
  },
  {
    slug: "anniversary",
    name: "Anniversary",
    heroLabel: "Anniversary Gifts",
    heroHeadline: "Celebrate where your story began.",
    heroSubhead:
      "Two families, one life together. A legacy that grows richer with every passing year.",
    ctaLine: "Mark this anniversary with something that endures.",
  },
  {
    slug: "new-baby",
    name: "New Baby",
    heroLabel: "New Baby Gifts",
    heroHeadline: "Welcome them into a story centuries in the making.",
    heroSubhead:
      "The newest member of the family deserves to know where they come from. Start their legacy now.",
    ctaLine: "Give the new arrival their family's greatest inheritance — their story.",
  },
  {
    slug: "housewarming",
    name: "Housewarming",
    heroLabel: "Housewarming Gifts",
    heroHeadline: "Make their new house feel like home — for generations.",
    heroSubhead:
      "A family crest on the wall turns a house into a home. A legacy story makes it sacred.",
    ctaLine: "Help them put down roots that go back centuries.",
  },
  {
    slug: "retirement",
    name: "Retirement",
    heroLabel: "Retirement Gifts",
    heroHeadline: "A lifetime of work. A legacy that endures.",
    heroSubhead:
      "They spent decades building something. Now it's time to honour the family they came from — and the story they've carried forward.",
    ctaLine: "Honour everything they've built with a legacy that lasts.",
  },
  {
    slug: "valentines",
    name: "Valentine's Day",
    heroLabel: "Valentine's Day Gifts",
    heroHeadline: "The most romantic gift isn't jewellery.",
    heroSubhead:
      "Give them their family's story — a love letter to where they come from and who they are.",
    ctaLine: "Give them something more meaningful than flowers this Valentine's Day.",
  },
  {
    slug: "reunion",
    name: "Family Reunion",
    heroLabel: "Family Reunion Gifts",
    heroHeadline: "Bring everyone together around the story that unites you.",
    heroSubhead:
      "The perfect centrepiece for a family reunion — a shared legacy, a coat of arms, and a book that tells your whole story.",
    ctaLine: "Make this reunion the one they talk about for the next generation.",
  },
];

export const GIFT_OCCASIONS: OccasionConfig[] = OCCASION_COPY.map((copy) => ({
  ...copy,
  products: STANDARD_PRODUCTS,
}));

export const getOccasionBySlug = (slug: string): OccasionConfig | undefined =>
  GIFT_OCCASIONS.find((o) => o.slug === slug);
