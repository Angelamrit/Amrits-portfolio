import "server-only";
import OpenAI from "openai";

/**
 * Server-only OpenAI client.
 *
 * Follows the same contract as src/lib/email/resend.ts: the key is read lazily
 * inside the function, never at module scope, and a missing key degrades to a
 * logged dry run rather than throwing at a visitor.
 *
 * The `server-only` import above makes an accidental client-side import a build
 * error, which is what keeps OPENAI_API_KEY out of the browser bundle.
 */

/**
 * The model behind the assistant.
 *
 * Chosen by measurement, not reputation. The whole knowledge base is sent on
 * every request, so the job is exact retrieval from roughly 7,500 tokens of
 * context in which several menu rows differ only in their first word — three
 * dishes end in "Dum Biryani" at three different prices. That is precisely
 * where the previous provider's small model failed, quoting the Goat Dum
 * Biryani at $25.00 and once at $20.99, which belongs to the Vegetable one.
 *
 * Candidates were put through that exact case before this was written:
 * gpt-5.4-nano, gpt-5.4-mini, gpt-4.1-mini and gpt-5.5 all answered correctly,
 * and gpt-5.4-mini was both the fastest and correct on 8/8 price probes across
 * the three near-identical biryanis and the samosa.
 */
export const CHAT_MODEL = "gpt-5.4-mini";

/**
 * Reasoning budget.
 *
 * "none" measured identically to "low" on both accuracy (8/8) and latency
 * (~500ms median to first token), so "low" is kept as the cheaper insurance of
 * the two: the hard cases here are the full menu, mixed questions and refusals
 * under adversarial phrasing, not the price lookups that were measured. The
 * lesson from the previous provider was that minimising the reasoning budget on
 * a long grounded prompt is what broke exact retrieval, and it is not a saving
 * worth repeating.
 *
 * Note that reasoning models reject `temperature` outright — a 400 — so
 * determinism is governed by this and not by sampling settings.
 */
export const REASONING_EFFORT = "low" as const;

/**
 * Headroom for the longest answer the assistant is asked to give.
 *
 * Most replies are a short paragraph, and the prompt keeps them that way — this
 * is a ceiling, not a target. It is set by the one legitimate long answer: the
 * full menu runs to roughly 1,400 tokens as names and prices, or 2,100 with
 * descriptions.
 */
export const MAX_OUTPUT_TOKENS = 3000;

/**
 * Returns a client, or null when OPENAI_API_KEY is not set. Callers must handle
 * null by showing the visitor a contact fallback.
 */
export function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.info("[chat:dry-run] OPENAI_API_KEY not set. Chat request not sent to OpenAI.");
    return null;
  }

  return new OpenAI({ apiKey });
}
