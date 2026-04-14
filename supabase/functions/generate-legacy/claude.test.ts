import {
  assertEquals,
  assertRejects,
} from "https://deno.land/std@0.208.0/assert/mod.ts";
import { callClaudeJson } from "./claude.ts";

function makeFetchStub(
  responses: Array<{ status: number; body: string }>,
): typeof fetch {
  let call = 0;
  return ((_url: string, _init?: RequestInit) => {
    const r = responses[call++];
    if (!r) throw new Error("unexpected extra fetch call");
    return Promise.resolve(
      new Response(r.body, {
        status: r.status,
        headers: { "content-type": "application/json" },
      }),
    );
  }) as typeof fetch;
}

// Claude's message API returns { content: [{ type: "text", text: "..." }] }.
// We wrap that shape for tests.
function anthropicOk(text: string) {
  return JSON.stringify({ content: [{ type: "text", text }] });
}

Deno.test("callClaudeJson parses a clean JSON body", async () => {
  const fetchStub = makeFetchStub([
    { status: 200, body: anthropicOk('{"hello":"world"}') },
  ]);
  const result = await callClaudeJson({
    apiKey: "k",
    system: "s",
    user: "u",
    fetchImpl: fetchStub,
  });
  assertEquals(result, { hello: "world" });
});

Deno.test("callClaudeJson retries on 429 and succeeds", async () => {
  const fetchStub = makeFetchStub([
    { status: 429, body: "rate limited" },
    { status: 200, body: anthropicOk('{"ok":true}') },
  ]);
  const result = await callClaudeJson({
    apiKey: "k",
    system: "s",
    user: "u",
    fetchImpl: fetchStub,
    backoffMs: 0,
  });
  assertEquals(result, { ok: true });
});

Deno.test("callClaudeJson strips prose around the JSON block", async () => {
  const fetchStub = makeFetchStub([
    {
      status: 200,
      body: anthropicOk('Sure! Here is your JSON:\n\n{"x":1}\n\nHope that helps.'),
    },
  ]);
  const result = await callClaudeJson({
    apiKey: "k",
    system: "s",
    user: "u",
    fetchImpl: fetchStub,
  });
  assertEquals(result, { x: 1 });
});

Deno.test("callClaudeJson retries once on parse failure, then throws", async () => {
  const fetchStub = makeFetchStub([
    { status: 200, body: anthropicOk("not json at all") },
    { status: 200, body: anthropicOk("still not json") },
  ]);
  await assertRejects(
    () =>
      callClaudeJson({
        apiKey: "k",
        system: "s",
        user: "u",
        fetchImpl: fetchStub,
        backoffMs: 0,
      }),
    Error,
    "parse",
  );
});

Deno.test("callClaudeJson throws after two 500 retries", async () => {
  const fetchStub = makeFetchStub([
    { status: 500, body: "boom" },
    { status: 500, body: "boom" },
    { status: 500, body: "boom" },
  ]);
  await assertRejects(
    () =>
      callClaudeJson({
        apiKey: "k",
        system: "s",
        user: "u",
        fetchImpl: fetchStub,
        backoffMs: 0,
      }),
    Error,
    "500",
  );
});
