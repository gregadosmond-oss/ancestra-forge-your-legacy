import type { LegacyFacts } from "../generate-legacy/types.ts";
import type { DbClient } from "../generate-legacy/db_client.ts";

export function normalizeSurname(input: string): string {
  return input.trim().toLowerCase();
}

export function buildPrompt(facts: LegacyFacts): string {
  const symbols = facts.symbolism.map((s) => s.element).join(", ");
  const surname = facts.displaySurname.toUpperCase();
  return [
    `A photorealistic heraldic coat of arms in the same style as the reference image.`,
    `Two golden lion supporters standing on either side of a quartered heraldic shield.`,
    `The shield features ${symbols}.`,
    `A knight helmet or crown crest on top with ornate gold scrollwork and mantling.`,
    `A silver ribbon banner at the base with the text "${surname}" engraved clearly.`,
    `White transparent background. Perfectly symmetrical.`,
    `Style: luxury 3D CGI render, polished gold metalwork, rich crimson and navy shield,`,
    `warm studio lighting, photorealistic detail, premium brand quality, 8K.`,
  ].join(" ");
}

// Public URL of the Ancestra reference crest — used as Ideogram style image
export const REFERENCE_CREST_URL = "https://legacy-forge-stories.lovable.app/crest.png";

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
