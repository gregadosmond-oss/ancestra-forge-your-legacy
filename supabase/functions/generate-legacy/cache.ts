// Cache wrapper around the surname_facts table.
// Called from the edge function handler which has a service-role client.

import type { LegacyFacts } from "./types.ts";
import type { DbClient } from "./db_client.ts";

export function normalizeSurname(input: string): string {
  return input.trim().toLowerCase();
}

export async function readFacts(
  client: DbClient,
  surname: string,
  modelVersion: string,
): Promise<LegacyFacts | null> {
  const { data, error } = await client
    .from("surname_facts")
    .select("payload, model_version")
    .eq("surname", surname)
    .maybeSingle();

  if (error) {
    // Cache read failures are non-fatal — log and fall through to generate.
    console.error("readFacts error", error);
    return null;
  }
  if (!data) return null;
  if (data.model_version !== modelVersion) return null; // stale, regenerate
  return data.payload as LegacyFacts;
}

export async function writeFacts(
  client: DbClient,
  surname: string,
  modelVersion: string,
  payload: LegacyFacts,
): Promise<void> {
  const { error } = await client.from("surname_facts").upsert({
    surname,
    payload,
    model_version: modelVersion,
  });
  if (error) {
    // Write failures are non-fatal — we already have the data to return.
    console.error("writeFacts error", error);
  }
}
