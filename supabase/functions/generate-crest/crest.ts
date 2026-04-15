import type { LegacyFacts } from "../generate-legacy/types.ts";
import type { DbClient } from "../generate-legacy/db_client.ts";

export function normalizeSurname(input: string): string {
  return input.trim().toLowerCase();
}

export function buildPrompt(facts: LegacyFacts): string {
  const symbol1 = facts.symbolism[0]?.element ?? "oak tree";
  const symbol2 = facts.symbolism[1]?.element ?? "chevron";
  const surname = facts.displaySurname.toUpperCase();
  return [
    `Photorealistic 3D heraldic coat of arms for the ${facts.displaySurname} family.`,
    `Central shield: deep crimson red with gold ${symbol1} and gold ${symbol2} in raised relief.`,
    `Two rampant gold lions as supporters flanking the shield, standing on ornate gold base.`,
    `Royal gold crown with crimson velvet cap on top, above ornate baroque gold acanthus leaf scrollwork flourishes extending wide on both sides.`,
    `Silver brushed metal ribbon banner at bottom with "${surname}" engraved in bold serif capitals.`,
    `Style: hyper-realistic 3D CGI sculpture, polished antique gold metalwork with deep cast shadows and bright specular highlights,`,
    `ornate baroque heraldic design, museum-quality luxury feel, perfectly symmetrical composition.`,
    `Background: dark black leather texture, subtle grain, no environment, no room, no reflections.`,
    `Cinematic dramatic lighting from above, 8K detail.`,
  ].join(" ");
}

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
