// Thin wrapper around the Anthropic Messages API.
// - retries once with backoff on 429/500/502/503/504
// - strips prose around the first {...} block and parses JSON
// - retries once more on parse failure (Claude sometimes returns extra text)
// - fetchImpl is injected for testability

export type CallOptions = {
  apiKey: string;
  system: string;
  user: string;
  model?: string;
  maxTokens?: number;
  backoffMs?: number;
  fetchImpl?: typeof fetch;
};

const DEFAULT_MODEL = "claude-haiku-4-5-20250414";
const DEFAULT_MAX_TOKENS = 2048;
const DEFAULT_BACKOFF_MS = 500;
const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);

function extractJson(raw: string): unknown {
  const first = raw.indexOf("{");
  const last = raw.lastIndexOf("}");
  if (first === -1 || last === -1 || last < first) {
    throw new Error("parse: no JSON object found in response");
  }
  const slice = raw.slice(first, last + 1);
  try {
    return JSON.parse(slice);
  } catch (e) {
    throw new Error(`parse: ${(e as Error).message}`);
  }
}

async function postOnce(
  opts: CallOptions,
  fetchImpl: typeof fetch,
): Promise<string> {
  const resp = await fetchImpl("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": opts.apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: opts.model ?? DEFAULT_MODEL,
      max_tokens: opts.maxTokens ?? DEFAULT_MAX_TOKENS,
      system: opts.system,
      messages: [{ role: "user", content: opts.user }],
    }),
  });
  if (!resp.ok) {
    const body = await resp.text();
    const err = new Error(`claude ${resp.status}: ${body.slice(0, 200)}`);
    (err as { status?: number }).status = resp.status;
    throw err;
  }
  const json = (await resp.json()) as {
    content: Array<{ type: string; text: string }>;
  };
  const text = json.content
    .filter((c) => c.type === "text")
    .map((c) => c.text)
    .join("");
  return text;
}

export async function callClaudeJson<T = unknown>(
  opts: CallOptions,
): Promise<T> {
  const fetchImpl = opts.fetchImpl ?? fetch;
  const backoff = opts.backoffMs ?? DEFAULT_BACKOFF_MS;

  let lastErr: Error | null = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const raw = await postOnce(opts, fetchImpl);
      try {
        return extractJson(raw) as T;
      } catch (parseErr) {
        // On parse failure, retry once with a fresh Claude call — the model
        // occasionally returns extra prose the first time but gets it right
        // on the second shot.
        if (attempt === 0) {
          await new Promise((r) => setTimeout(r, backoff));
          continue;
        }
        throw parseErr;
      }
    } catch (err) {
      lastErr = err as Error;
      const status = (err as { status?: number }).status;
      if (status !== undefined && RETRYABLE_STATUSES.has(status)) {
        if (attempt === 0) {
          await new Promise((r) => setTimeout(r, backoff));
          continue;
        }
      }
      throw err;
    }
  }
  throw lastErr ?? new Error("unknown claude error");
}
