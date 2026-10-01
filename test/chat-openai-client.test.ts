import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import OpenAI from "openai";
import {
  CHAT_MODEL,
  MAX_OUTPUT_TOKENS,
  REASONING_EFFORT,
  getOpenAIClient,
} from "../src/lib/chat/client.ts";
import { loadKnowledgeBase } from "../src/lib/chat/kb.ts";
import { buildSystemInstruction } from "../src/lib/chat/prompt.ts";

/**
 * The OpenAI integration.
 *
 * These are contract tests, not network tests: they assert how the client is
 * constructed and how the route is wired to it, which is what a refactor can
 * silently break. The behaviour on the far side of the wire is covered by the
 * knowledge-base tests and by the behavioural suite.
 */

const clientSource = readFileSync(new URL("../src/lib/chat/client.ts", import.meta.url), "utf8");
const routeSource = readFileSync(new URL("../src/app/api/chat/route.ts", import.meta.url), "utf8");

const withKey = <T>(value: string | undefined, fn: () => T): T => {
  const previous = process.env.OPENAI_API_KEY;
  if (value === undefined) delete process.env.OPENAI_API_KEY;
  else process.env.OPENAI_API_KEY = value;
  try {
    return fn();
  } finally {
    if (previous === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previous;
  }
};

test("a missing key degrades to null rather than throwing at a visitor", () => {
  // The route turns null into the contact fallback. Throwing here would surface
  // a 500 to someone who only asked where the restaurant is.
  assert.equal(withKey(undefined, getOpenAIClient), null);
  assert.equal(withKey("", getOpenAIClient), null, "an empty value is not a key");
});

test("the key is read at call time, never captured at import", () => {
  // Module scope runs once per process. Reading there would bind whatever the
  // environment held at import and ignore anything set afterwards, which is the
  // classic cause of "works locally, unconfigured in production".
  const client = withKey("sk-test-not-a-real-key", getOpenAIClient);
  assert.ok(client instanceof OpenAI, "a key present at call time must produce a client");
  assert.equal(withKey(undefined, getOpenAIClient), null, "and removing it must take effect");

  assert.doesNotMatch(
    clientSource.slice(0, clientSource.indexOf("export function getOpenAIClient")),
    /process\.env\.OPENAI_API_KEY/,
    "the key must not be read at module scope",
  );
});

test("the key cannot reach the browser bundle", () => {
  // `server-only` turns an accidental client import into a build error. It is
  // the whole of the guarantee that the key stays server-side.
  assert.match(clientSource, /^import "server-only";/m, "client.ts must be server-only");
  assert.doesNotMatch(clientSource, /NEXT_PUBLIC_/, "the key must never be a public variable");
  assert.doesNotMatch(routeSource, /NEXT_PUBLIC_.*(?:OPENAI|API_KEY)/, "nor in the route");
});

test("the model, reasoning budget and output ceiling are the measured values", () => {
  assert.equal(CHAT_MODEL, "gpt-5.4-mini");
  assert.equal(REASONING_EFFORT, "low");
  assert.equal(MAX_OUTPUT_TOKENS, 3000, "the full menu needs roughly 2,100 output tokens");
});

test("the knowledge base is what grounds the request", () => {
  // The KB travels as `instructions`, rebuilt from the validated knowledge base
  // on every request. Nothing else is sent as authority: no retrieval, no tools,
  // no external source.
  assert.match(routeSource, /instructions: buildSystemInstruction\(kb\)/, "the KB must be the instructions");
  assert.doesNotMatch(routeSource, /\btools:/, "no tools — the model has no outside channel");
  assert.doesNotMatch(routeSource, /web_search|file_search|vector_store|retrieval/i, "no retrieval of any kind");

  // And the instruction really is the knowledge base, not a summary of it.
  const instruction = buildSystemInstruction(loadKnowledgeBase());
  assert.match(instruction, /GOAT DUM BIRYANI — \$25\.99/, "menu rows must reach the model verbatim");
  assert.match(instruction, /75-18 37th Ave/, "and the confirmed address");
});

test("visitor text never shares a channel with the rules", () => {
  // `instructions` and `input` are separate fields in the Responses API. The
  // visitor's words only ever occupy `input`, so an injection can argue with the
  // rules but can never be mistaken for one.
  const call = routeSource.slice(routeSource.indexOf("client.responses.create"), routeSource.indexOf("const body = new ReadableStream"));
  const instructionsLine = call.slice(call.indexOf("instructions:"), call.indexOf("input:"));
  assert.doesNotMatch(instructionsLine, /parsed\.(message|history)/, "no visitor text in the instructions");
  assert.match(call, /input: \[/, "the conversation goes in input");
});

test("our transcript roles are mapped to the roles the API accepts", () => {
  // We call the assistant's turns "model"; the API calls them "assistant". The
  // wire format the browser sends and receives is unchanged either way.
  const call = routeSource.slice(routeSource.indexOf("client.responses.create"));
  assert.match(
    call,
    /role: m\.role === "model" \? \("assistant" as const\) : \("user" as const\)/,
    "history roles must be translated, not passed through",
  );
});

test("nothing is retained on OpenAI's side", () => {
  // Visitors are anonymous and the transcript belongs to their browser. There is
  // no reason to leave a copy with a third party, and a privacy rule that only
  // governs what the assistant says would be a thin one if the conversation were
  // stored anyway.
  assert.match(routeSource, /store: false/, "responses must not be stored");
});

test("streaming is requested, and the abort signal is wired through", () => {
  assert.match(routeSource, /stream: true/, "the reply must stream");
  assert.match(routeSource, /\{ signal: abortSignal \}/, "a disconnect or timeout must cut the call");
});
