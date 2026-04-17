import type { LegacyFacts } from "../generate-legacy/types.ts";
import type { DbClient } from "../generate-legacy/db_client.ts";

export function normalizeSurname(input: string): string {
  return input.trim().toLowerCase();
}

export function buildPrompt(facts: LegacyFacts): string {
  const initial = facts.displaySurname.charAt(0).toUpperCase();
  const surname = facts.displaySurname.toUpperCase();
  return [
    `A flat heraldic engraving crest in the exact style of the reference image.`,
    `Black background. Gold flat line art — no 3D, no gradients, no photorealism.`,
    `A heraldic shield in the center with a large ornate letter "${initial}" inside.`,
    `A decorative royal crown above the shield.`,
    `A ribbon scroll banner at the bottom. The banner must say exactly "${surname}" — no other word, no other name.`,
    `Decorative border frame around the shield. Perfectly symmetrical.`,
    `Style: classic gold heraldic engraving on black, flat vector illustration look, premium brand quality.`,
  ].join(" ");
}

// Public URL of the AncestorsQR reference crest — used as Ideogram style image
export const REFERENCE_CREST_URL = "https://legacy-forge-stories.lovable.app/AncestorsQR-crest-reference.jpg";

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
