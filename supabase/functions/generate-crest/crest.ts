import type { LegacyFacts } from "../generate-legacy/types.ts";
import type { DbClient } from "../generate-legacy/db_client.ts";

export function normalizeSurname(input: string): string {
  return input.trim().toLowerCase();
}

export function buildPrompt(facts: LegacyFacts): string {
  const symbols = facts.symbolism.map((s) => s.element).join(" and ");
  const surname = facts.displaySurname.toUpperCase();
  return [
    `A heraldic coat of arms floating on a pure black background.`,
    `Sculpted gold metalwork, deep crimson shield.`,
    `Shield with ${symbols}.`,
    `Text "${surname}" engraved on a silver ribbon banner at the base.`,
    `Golden lion supporters on each side, royal crown on top.`,
    `No table. No surface. No floor. No reflections. No environment.`,
    `Pure black background. Crest only.`,
    `Style: luxury 3D CGI render, physically sculpted gold,`,
    `dramatic studio lighting, polished metal reflections,`,
    `like a premium luxury logo on black, perfectly symmetrical, 8K.`,
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
