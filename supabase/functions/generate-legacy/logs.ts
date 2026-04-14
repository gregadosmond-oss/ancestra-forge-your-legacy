import type { DbClient } from "./db_client.ts";

export type LogEntry = {
  surname: string;
  callType: "facts" | "story";
  cacheHit: boolean;
  durationMs: number;
  success: boolean;
  errorReason: string | null;
  modelVersion: string;
};

export async function writeLog(
  client: DbClient,
  entry: LogEntry,
): Promise<void> {
  const { error } = await client.from("generation_logs").insert({
    surname: entry.surname,
    call_type: entry.callType,
    cache_hit: entry.cacheHit,
    duration_ms: entry.durationMs,
    success: entry.success,
    error_reason: entry.errorReason,
    model_version: entry.modelVersion,
  });
  if (error) console.error("writeLog error", error);
}
