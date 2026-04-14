export type Generation = {
  name: string;
  years: string;
  location: string;
  role?: string;
  isYou?: boolean;
};

export type Migration = {
  from: string;
  to: string;
  year: string;
};

export type SymbolismBreakdown = {
  element: string;
  meaning: string;
};

export type Chapter = {
  number: string;
  title: string;
  body?: string;
};

export type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
  occasion: string;
};

export type FamilyLegacy = {
  surname: string;
  meaning: string;
  origin: string;
  originYear: string;
  ancestralRole: string;
  historicalQuote: string;
  tree: Generation[];
  migration: Migration;
  crestImage: string;
  mottoLatin: string;
  mottoEnglish: string;
  symbolism: SymbolismBreakdown[];
  chapters: Chapter[];
  recommendedProducts: Product[];
};

export const osmondMock: FamilyLegacy = {
  surname: "Osmond",
  meaning: "Divine Protector",
  origin: "Dorset, England",
  originYear: "Since 1066",
  ancestralRole: "Hayward — Land managers and protectors of the shire",
  historicalQuote:
    "Recorded in the Domesday Book of 1086 — stewards of the land, keepers of the peace.",
  tree: [
    {
      name: "William Osmund",
      years: "1066–1120",
      location: "Piddletrenthide, Dorset",
      role: "Norman settler",
    },
    {
      name: "John Osmond",
      years: "1620–1688",
      location: "Piddletrenthide, Dorset",
      role: "Hayward",
    },
    {
      name: "Joseph Osmond",
      years: "1742–1810",
      location: "Newfoundland, Canada",
      role: "Fisherman & founder",
    },
    {
      name: "Mark Osmond",
      years: "1795–1867",
      location: "Newfoundland, Canada",
      role: "Shipping merchant",
    },
    {
      name: "Ambrose Osmond",
      years: "1828–1901",
      location: "Newfoundland, Canada",
      role: "Shipping merchant",
    },
    {
      name: "Gregory Osmond",
      years: "1981–",
      location: "Today",
      role: "Founder",
      isYou: true,
    },
  ],
  migration: {
    from: "Dorset, England",
    to: "Newfoundland, Canada",
    year: "c. 1820",
  },
  crestImage: "/crest.png",
  mottoLatin: "Ex Labore, Ascendimus",
  mottoEnglish: "From Labour, We Rise",
  symbolism: [
    { element: "Twin Lions", meaning: "Courage and guardianship of the line" },
    { element: "Golden Chevron", meaning: "Protection earned through labour" },
    { element: "Crowned Helm", meaning: "Honour passed through generations" },
    { element: "Silver Banner", meaning: "The name carried forward" },
  ],
  chapters: [
    {
      number: "I",
      title: "The Hayward of Piddletrenthide",
      body:
        "In the rolling downs of Dorset, where the river Piddle cuts a slow green line through the chalk, there stood a man whose job was to protect the land. They called him the Hayward. He was not a lord. He owned no castle. But every fence, every hedgerow, every acre of common ground was his to keep. When the cattle strayed, he turned them back. When a neighbour's greed crept past the boundary stones, he set them right. The villagers paid him in bread, in cider, in respect. He was the first Osmond — and his name, Os-mund, meant Divine Protector. The line began with a quiet promise: to guard what others could not. To rise not by birth, but by labour. And that promise would carry twelve generations across an ocean, into storms and ships and new towns raised from nothing. It began with him. It begins again with you.",
    },
    { number: "II", title: "The Wills of Dorset" },
    { number: "III", title: "The Decision to Leave" },
    { number: "IV", title: "Joseph Osmond Lands on the Rock" },
    { number: "V", title: "The Fishing Fleet" },
    { number: "VI", title: "Mark and Ambrose: The Shipping Years" },
    { number: "VII", title: "Trade Winds to the West Indies" },
    { number: "VIII", title: "The Line Endures" },
    { number: "IX", title: "And the Name Comes to You" },
  ],
  recommendedProducts: [
    {
      id: "framed-crest",
      name: "Framed Crest Print",
      price: 79,
      image: "/crest.png",
      occasion: "Father's Day",
    },
    {
      id: "beer-mug",
      name: "Engraved Whiskey Glass",
      price: 39,
      image: "/crest.png",
      occasion: "Birthday",
    },
    {
      id: "ornament",
      name: "Heirloom Christmas Ornament",
      price: 29,
      image: "/crest.png",
      occasion: "Christmas",
    },
  ],
};
