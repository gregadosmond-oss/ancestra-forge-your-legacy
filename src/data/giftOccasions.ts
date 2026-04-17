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

export const GIFT_OCCASIONS: OccasionConfig[] = [
  {
    slug: "fathers-day",
    name: "Father's Day",
    heroLabel: "Father's Day Gifts",
    heroHeadline: "Make this Father's Day unforgettable.",
    heroSubhead:
      "Give him something that traces his bloodline back centuries — a story, a crest, and a legacy built to last.",
    ctaLine: "This Father's Day, give him the story behind his name.",
    products: [
      {
        name: "Legacy Book",
        price: "from $59",
        description:
          "His family's full story in a beautifully printed book — softcover or hardcover.",
        tag: "Most Meaningful",
      },
      {
        name: "Framed Crest Print",
        price: "from $79",
        description:
          "His coat of arms, printed and framed. Ready to hang the day it arrives.",
      },
      {
        name: "Whiskey Glass",
        price: "$39",
        description:
          "His family crest on a whiskey glass. A daily reminder of where he comes from.",
      },
      {
        name: "Metal Wall Sign",
        price: "$149",
        description:
          "Heavy-gauge metal, his crest, his name. The centrepiece of any man cave or study.",
      },
      {
        name: "Legacy Pack",
        price: "$29",
        description:
          "Digital crest, full family story, bloodline tree, and legacy certificate — delivered instantly.",
      },
    ],
    bundle: {
      name: "Dad Bundle",
      price: "$129",
      includes: ["Framed crest print", "Whiskey glass", "Legacy certificate"],
    },
  },
  {
    slug: "mothers-day",
    name: "Mother's Day",
    heroLabel: "Mother's Day Gifts",
    heroHeadline: "The gift she'll treasure forever.",
    heroSubhead:
      "She carried the family forward. Give her the story of where it all began.",
    ctaLine: "Honour the woman who kept the story alive.",
    products: [
      {
        name: "Legacy Book",
        price: "from $59",
        description:
          "Her family's history in a beautifully printed book she'll read and re-read for years.",
        tag: "Most Meaningful",
      },
      {
        name: "Framed Crest Print",
        price: "from $79",
        description:
          "Her family crest, framed and ready to hang — a piece of history for her home.",
      },
      {
        name: "Coaster Set",
        price: "$24",
        description:
          "Four coasters, each bearing the family crest. Elegant, personal, and used every day.",
      },
      {
        name: "Legacy Pack",
        price: "$29",
        description:
          "Digital crest, full family story, bloodline tree, and certificate — delivered to her inbox instantly.",
      },
    ],
    bundle: {
      name: "Mom Bundle",
      price: "$139",
      includes: ["Legacy book", "Family tree print", "Legacy certificate"],
    },
  },
  {
    slug: "christmas",
    name: "Christmas",
    heroLabel: "Christmas Gifts",
    heroHeadline: "The most meaningful gift under the tree.",
    heroSubhead:
      "This Christmas, give your family something that lasts beyond the season — their story, their crest, their legacy.",
    ctaLine: "Give a gift that means something this Christmas.",
    products: [
      {
        name: "Legacy Book",
        price: "from $59",
        description:
          "The family story in print — a gift that gets passed down with the decorations.",
        tag: "Family Favourite",
      },
      {
        name: "Christmas Ornament",
        price: "$29",
        description:
          "The family crest as a keepsake ornament. Goes on the tree every year, forever.",
      },
      {
        name: "Coaster Set",
        price: "$24",
        description: "Four family crest coasters — perfect for holiday gatherings.",
      },
      {
        name: "Legacy Pack",
        price: "$29",
        description:
          "Digital crest, full story, bloodline tree — delivered instantly as a gift.",
      },
    ],
    bundle: {
      name: "Christmas Bundle",
      price: "$129",
      includes: ["3× ornaments", "Legacy book", "Coaster set"],
    },
  },
  {
    slug: "wedding",
    name: "Wedding",
    heroLabel: "Wedding Gifts",
    heroHeadline: "Unite two families. Tell both stories.",
    heroSubhead:
      "A combined wedding crest, their histories woven together — the most unique wedding gift in existence.",
    ctaLine: "The wedding gift they've never seen before.",
    products: [
      {
        name: "Legacy Book",
        price: "from $59",
        description:
          "The story of one family — or commission two books for both families joining together.",
        tag: "Most Personal",
      },
      {
        name: "Combined Wedding Crest",
        price: "$79",
        description:
          "Both family crests merged into one — a digital heirloom for their new life together.",
        tag: "Unique to Ancestra",
      },
      {
        name: "Framed Crest Print",
        price: "from $79",
        description: "Their combined crest, printed and framed for their first home together.",
      },
      {
        name: "Wax Seal Stamp",
        price: "$49",
        description:
          "A wax seal stamp of their family crest — for thank you notes, envelopes, and keepsakes.",
      },
    ],
    bundle: {
      name: "Wedding Bundle",
      price: "$249",
      includes: [
        "Combined wedding crest (digital)",
        "Framed print",
        "Toasting glasses",
        "Wax seal stamp",
      ],
    },
  },
  {
    slug: "graduation",
    name: "Graduation",
    heroLabel: "Graduation Gifts",
    heroHeadline: "They know where they're going. Show them where they came from.",
    heroSubhead:
      "A legacy certificate, a family crest, a story — the perfect graduation gift for someone starting their next chapter.",
    ctaLine: "Send them into the world knowing where they came from.",
    products: [
      {
        name: "Legacy Book",
        price: "from $59",
        description:
          "Their family's history in print — a reminder of the shoulders they stand on.",
        tag: "Most Meaningful",
      },
      {
        name: "Legacy Certificate",
        price: "$49",
        description:
          "A formal, frameable certificate documenting their family lineage and coat of arms.",
      },
      {
        name: "Framed Crest Print",
        price: "from $79",
        description: "Their family crest framed for their first apartment or office.",
      },
      {
        name: "Legacy Pack",
        price: "$29",
        description:
          "Digital crest, full family story, bloodline tree — delivered to their inbox instantly.",
      },
    ],
    bundle: {
      name: "Grad Bundle",
      price: "$119",
      includes: ["Legacy certificate", "Framed crest", "Coffee mug"],
    },
  },
  {
    slug: "birthday",
    name: "Birthday",
    heroLabel: "Birthday Gifts",
    heroHeadline: "The birthday gift no one else thought of.",
    heroSubhead:
      "While others bring flowers and gift cards, you're giving them their family's entire history.",
    ctaLine: "Give them a birthday gift they'll talk about for years.",
    products: [
      {
        name: "Legacy Book",
        price: "from $59",
        description:
          "Their complete family story in print — the most personal birthday gift imaginable.",
        tag: "Most Unique",
      },
      {
        name: "Legacy Pack",
        price: "$29",
        description:
          "Digital crest, full family story, bloodline tree, and certificate — delivered instantly.",
      },
      {
        name: "Framed Crest Print",
        price: "from $79",
        description: "Their family crest, framed and ready to hang.",
      },
      {
        name: "Beer Mug",
        price: "$39",
        description:
          "Their family crest on a quality beer mug. A gift they'll use every celebration.",
      },
    ],
  },
  {
    slug: "anniversary",
    name: "Anniversary",
    heroLabel: "Anniversary Gifts",
    heroHeadline: "Celebrate where your story began.",
    heroSubhead:
      "Two families, one life together. A legacy that grows richer with every passing year.",
    ctaLine: "Mark this anniversary with something that endures.",
    products: [
      {
        name: "Legacy Book",
        price: "from $59",
        description:
          "The story of their family — a beautifully printed keepsake for a milestone anniversary.",
        tag: "Most Romantic",
      },
      {
        name: "Framed Crest Print (16×20)",
        price: "$99",
        description:
          "A large, statement framed crest for the home they've built together.",
      },
      {
        name: "Coaster Set",
        price: "$24",
        description: "Four family crest coasters — for every morning coffee and evening wine.",
      },
      {
        name: "Legacy Pack",
        price: "$29",
        description:
          "Digital crest, full family story, bloodline tree — delivered instantly.",
      },
    ],
    bundle: {
      name: "Wedding Bundle",
      price: "$249",
      includes: [
        "Combined crest (digital)",
        "Framed print",
        "Toasting glasses",
        "Wax seal stamp",
      ],
    },
  },
  {
    slug: "new-baby",
    name: "New Baby",
    heroLabel: "New Baby Gifts",
    heroHeadline: "Welcome them into a story centuries in the making.",
    heroSubhead:
      "The newest member of the family deserves to know where they come from. Start their legacy now.",
    ctaLine: "Give the new arrival their family's greatest inheritance — their story.",
    products: [
      {
        name: "Legacy Book",
        price: "from $59",
        description:
          "Their family history in print — a keepsake they'll read to the baby, and the baby will read to their children.",
        tag: "Heirloom Gift",
      },
      {
        name: "Legacy Pack",
        price: "$29",
        description:
          "Digital crest, full family story, bloodline tree — a digital legacy for a new life.",
      },
      {
        name: "Framed Crest Print",
        price: "from $79",
        description: "Their family crest framed for the nursery wall.",
      },
      {
        name: "Christmas Ornament",
        price: "$29",
        description:
          "A family crest ornament for baby's first Christmas — a tradition that starts now.",
      },
    ],
  },
  {
    slug: "housewarming",
    name: "Housewarming",
    heroLabel: "Housewarming Gifts",
    heroHeadline: "Make their new house feel like home — for generations.",
    heroSubhead:
      "A family crest on the wall turns a house into a home. A legacy story makes it sacred.",
    ctaLine: "Help them put down roots that go back centuries.",
    products: [
      {
        name: "Legacy Book",
        price: "from $59",
        description:
          "Their family's full history in print — the story of every home they've ever come from.",
        tag: "Most Thoughtful",
      },
      {
        name: "Metal Wall Sign",
        price: "$149",
        description:
          "Heavy-gauge metal bearing their family crest — the statement piece every home deserves.",
      },
      {
        name: "Canvas Print",
        price: "$89",
        description:
          "Gallery-wrapped canvas of their family crest — artwork that means something.",
      },
      {
        name: "Coaster Set",
        price: "$24",
        description: "Four family crest coasters — a gift for the new coffee table.",
      },
    ],
  },
  {
    slug: "retirement",
    name: "Retirement",
    heroLabel: "Retirement Gifts",
    heroHeadline: "A lifetime of work. A legacy that endures.",
    heroSubhead:
      "They spent decades building something. Now it's time to honour the family they came from — and the story they've carried forward.",
    ctaLine: "Honour everything they've built with a legacy that lasts.",
    products: [
      {
        name: "Legacy Book",
        price: "from $59",
        description:
          "Their family's complete history in a beautifully printed book — the perfect retirement keepsake.",
        tag: "Most Fitting",
      },
      {
        name: "Framed Crest Print (16×20)",
        price: "$99",
        description:
          "A large, framed family crest — a statement piece for the home they'll now spend time in.",
      },
      {
        name: "Metal Wall Sign",
        price: "$149",
        description: "Heavy-gauge metal crest for the study, workshop, or wall of honour.",
      },
      {
        name: "Legacy Pack",
        price: "$29",
        description:
          "Digital crest, full family story, bloodline tree, and certificate — a complete digital legacy.",
      },
    ],
  },
  {
    slug: "valentines",
    name: "Valentine's Day",
    heroLabel: "Valentine's Day Gifts",
    heroHeadline: "The most romantic gift isn't jewellery.",
    heroSubhead:
      "Give them their family's story — a love letter to where they come from and who they are.",
    ctaLine: "Give them something more meaningful than flowers this Valentine's Day.",
    products: [
      {
        name: "Legacy Book",
        price: "from $59",
        description:
          "Their family story in print — the most personal, romantic gift you can give.",
        tag: "Most Personal",
      },
      {
        name: "Legacy Pack",
        price: "$29",
        description:
          "Digital crest, full family story, bloodline tree — delivered to their inbox like a love letter.",
      },
      {
        name: "Framed Crest Print",
        price: "from $79",
        description: "Their family crest, framed — art that tells their story.",
      },
      {
        name: "Crest Cufflinks",
        price: "$39",
        description:
          "Their family crest as custom cufflinks — elegance with meaning, worn close every day.",
      },
    ],
  },
  {
    slug: "reunion",
    name: "Family Reunion",
    heroLabel: "Family Reunion Gifts",
    heroHeadline: "Bring everyone together around the story that unites you.",
    heroSubhead:
      "The perfect centrepiece for a family reunion — a shared legacy, a coat of arms, and a book that tells your whole story.",
    ctaLine: "Make this reunion the one they talk about for the next generation.",
    products: [
      {
        name: "Legacy Book",
        price: "from $59",
        description:
          "The family's complete history in print — read it aloud, pass it around, keep it forever.",
        tag: "Perfect Centrepiece",
      },
      {
        name: "Coaster Set",
        price: "$24",
        description: "Four family crest coasters — one for every household at the reunion.",
      },
      {
        name: "Christmas Ornament",
        price: "$29",
        description:
          "A family crest ornament for every branch of the family tree to take home.",
      },
      {
        name: "Legacy Pack",
        price: "$29",
        description:
          "Digital crest, full family story, bloodline tree — share the link with every family member.",
      },
    ],
    bundle: {
      name: "Reunion Bundle",
      price: "$249",
      includes: ["10× ornaments", "Family tree poster", "Legacy book"],
    },
  },
];

export const getOccasionBySlug = (slug: string): OccasionConfig | undefined =>
  GIFT_OCCASIONS.find((o) => o.slug === slug);
