// Phase 2 is not changing Stop 6 — it stays on mock data. This file is the
// Phase-1-to-Phase-2 bridge: Stop 6 imports from here; the rest of the
// journey is live. Phase 5+ will replace Stop 6 with real product/gift
// logic and this fixture can be retired.

import type { LegacyFacts, LegacyStory } from "@/types/legacy";

export const OSMOND_FIXTURE: LegacyFacts = {
  surname: "osmond",
  displaySurname: "Osmond",
  meaning: {
    origin: "Anglo-Saxon England, ~900 AD",
    role: "Protectors and land stewards (Haywards)",
    etymology: "From Old English 'os' (god) + 'mund' (protector)",
    historicalContext:
      "Recorded in the Domesday Book of 1086 as land-keepers of the West Country.",
  },
  migration: {
    waypoints: [
      { region: "Dorset, England", century: "12th", role: "Haywards and land managers" },
      { region: "Piddletrenthide", century: "17th", role: "Yeomen tending ancestral fields" },
      { region: "Newfoundland, Canada", century: "19th", role: "Fishermen and shipbuilders" },
    ],
    closingLine:
      "From the Dorset hills, across the Atlantic, and into the harbours of the New World.",
  },
  mottoLatin: "Ex Labore, Ascendimus",
  mottoEnglish: "From Labour, We Rise",
  symbolism: [
    { element: "Twin Lions", meaning: "Courage and guardianship of the line" },
    { element: "Golden Chevron", meaning: "Protection earned through labour" },
    { element: "Crowned Helm", meaning: "Honour passed through generations" },
    { element: "Silver Banner", meaning: "The name carried forward" },
  ],
};

export const OSMOND_STORY_FIXTURE: LegacyStory = {
  chapterOneTitle: "Chapter I — The Hayward's Son",
  chapterOneBody:
    "The boy rose before the light. Frost lay across the Dorset fields in thin plates, and his father's staff — the one passed from hand to hand for four generations — leaned against the door. He took it. The hedges needed walking. The sheep needed counting. The House needed keeping.",
  teaserChapters: [
    "The Crossing",
    "The Cod and the Rope",
    "A New Name in a New Harbour",
    "The Fire of 1892",
    "The Sons Who Stayed",
    "The Sons Who Sailed",
    "The Motto Returns",
    "The Inheritors",
  ],
};

export type MockProduct = {
  id: string;
  name: string;
  price: number;
  image: string;
  occasion: string;
};

export const MOCK_PRODUCTS: MockProduct[] = [
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
];
