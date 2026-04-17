import type { LegacyFacts } from "../generate-legacy/types.ts";
import type { DbClient } from "../generate-legacy/db_client.ts";

export function normalizeSurname(input: string): string {
  return input.trim().toLowerCase();
}

// Derive heraldic variables from family facts
function getCrestAnimal(facts: LegacyFacts): string {
  const role = facts.meaning.role.toLowerCase();
  if (role.includes("warrior") || role.includes("knight") || role.includes("soldier")) return "lion";
  if (role.includes("sea") || role.includes("sailor") || role.includes("fisher")) return "eagle";
  if (role.includes("hunt") || role.includes("forest")) return "stag";
  if (role.includes("protect") || role.includes("guard")) return "lion";
  return "lion";
}

function getCrestObject(facts: LegacyFacts): string {
  const role = facts.meaning.role.toLowerCase();
  if (role.includes("warrior") || role.includes("knight")) return "a sword";
  if (role.includes("sea") || role.includes("sailor")) return "an anchor";
  if (role.includes("build") || role.includes("craft")) return "a hammer";
  if (role.includes("farm") || role.includes("land") || role.includes("steward")) return "a sheaf of wheat";
  if (role.includes("scholar") || role.includes("church") || role.includes("priest")) return "a book";
  return "a sword";
}

function getTradeSymbol(facts: LegacyFacts): string {
  const symbols = facts.symbolism.map((s) => s.element.toLowerCase());
  if (symbols.some((s) => s.includes("oak") || s.includes("tree"))) return "gold oak tree";
  if (symbols.some((s) => s.includes("anchor") || s.includes("ship"))) return "gold anchor";
  if (symbols.some((s) => s.includes("sword") || s.includes("blade"))) return "gold sword";
  if (symbols.some((s) => s.includes("eagle") || s.includes("falcon"))) return "gold eagle";
  if (symbols.some((s) => s.includes("star") || s.includes("sun"))) return "gold star";
  const role = facts.meaning.role.toLowerCase();
  if (role.includes("sea") || role.includes("sailor")) return "gold anchor";
  if (role.includes("farm") || role.includes("land")) return "gold oak tree";
  return "gold oak tree";
}

function getEarliestYear(facts: LegacyFacts): string {
  if (!facts.migration.waypoints.length) return "1600";
  const earliest = facts.migration.waypoints[0].century;
  // Convert "11th century" → "1066", "15th century" → "1450" etc.
  const match = earliest.match(/(\d+)(st|nd|rd|th)/i);
  if (match) {
    const n = parseInt(match[1]);
    return String((n - 1) * 100 + 50);
  }
  return "1600";
}

export function buildPrompt(facts: LegacyFacts): string {
  const surname = facts.displaySurname.toUpperCase();
  const initial = facts.displaySurname.charAt(0).toUpperCase();
  const crestAnimal = getCrestAnimal(facts);
  const crestObject = getCrestObject(facts);
  const supporterAnimal = "lion";
  const tradeSymbol = getTradeSymbol(facts);
  const sinceYear = getEarliestYear(facts);

  return `Generate a photorealistic 3D heraldic coat of arms for the ${surname} family.

CREST (TOP): A gold rampant ${crestAnimal} holding ${crestObject}
Below the crest: A royal crown with a medieval knight's helmet facing forward

SUPPORTERS: Two gold rampant ${supporterAnimal}s flanking the shield, standing on their hind legs

CENTRAL SHIELD (quartered):
- Top-left: Gold fleur-de-lis on royal blue
- Top-right: Ornate gold "${initial}" monogram on crimson red
- Bottom-left: ${tradeSymbol} on crimson red
- Bottom-right: Gold fleur-de-lis on royal blue

BANNER (bottom): Silver scrolled ribbon with "${surname}" in bold gold serif capital letters
BELOW BANNER: Small elegant gold text: "SINCE ${sinceYear}"

STYLE: Hyper-realistic 3D rendering, polished antique gold with deep shadows and bright specular highlights, dramatic cinematic lighting, rich dimensional depth, ornate baroque heraldic design, museum-quality luxury feel. Textured charcoal gray background. No QR codes. No watermarks.

Square 1:1 aspect ratio. Centered composition.`;
}

// Reference image URL — the 3D photorealistic style reference
export const REFERENCE_CREST_URL = "https://legacy-forge-stories.lovable.app/ancestra-crest-3d.png";

export async function readCrest(
  client: DbClient,
  surname: string,
): Promise<string | null> {
  const { data, error } = await client
    .from("surname_crests")
    .select("image_url")
    .eq("surname", surname)
    .maybeSingle();

  if (error) {
    console.error("readCrest error", error);
    return null;
  }
  return data?.image_url ?? null;
}

export async function writeCrest(
  client: DbClient,
  surname: string,
  imageUrl: string,
  prompt: string,
): Promise<void> {
  const { error } = await client.from("surname_crests").upsert({
    surname,
    image_url: imageUrl,
    prompt,
  });
  if (error) {
    // Non-fatal — we have the URL to return even if caching fails.
    console.error("writeCrest error", error);
  }
}

export type GenerateCrestOpts = {
  client: DbClient;
  surname: string;
  facts: LegacyFacts;
  /** Returns an ephemeral DALL-E image URL. */
  callImageApi: (prompt: string) => Promise<string>;
  /** Downloads image from tempUrl, uploads to storage, returns permanent public URL. */
  downloadAndUpload: (normalized: string, tempUrl: string) => Promise<string>;
};

export async function generateCrest(opts: GenerateCrestOpts): Promise<string> {
  const normalized = normalizeSurname(opts.surname);

  const cached = await readCrest(opts.client, normalized);
  if (cached) return cached;

  const prompt = buildPrompt(opts.facts);
  const tempUrl = await opts.callImageApi(prompt);
  const publicUrl = await opts.downloadAndUpload(normalized, tempUrl);

  await writeCrest(opts.client, normalized, publicUrl, prompt);
  return publicUrl;
}
