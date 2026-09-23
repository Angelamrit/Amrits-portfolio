import "server-only";
import { GoogleGenAI } from "@google/genai";

/**
 * Server-only Gemini client.
 *
 * Follows the same contract as src/lib/email/resend.ts: the key is read lazily
 * inside the function, never at module scope, and a missing key degrades to a
 * logged dry run rather than throwing at a visitor.
 *
 * The `server-only` import above makes an accidental client-side import a build
 * error, which is what keeps GEMINI_API_KEY out of the browser bundle.
 */

/**
 * Gemini 3.5 Flash-Lite. Chosen because it is free-tier eligible with a daily
 * request allowance roughly an order of magnitude larger than the full Flash
 * models, which matters for a public, unauthenticated widget.
 */
export const CHAT_MODEL = "gemini-3.5-flash-lite";

/** Short answers only — this is a concierge FAQ bot, not an essay writer. */
export const MAX_OUTPUT_TOKENS = 700;

/**
 * Returns a client, or null when GEMINI_API_KEY is not set. Callers must handle
 * null by showing the visitor a contact fallback.
 */
export function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.info("[chat:dry-run] GEMINI_API_KEY not set. Chat request not sent to Gemini.");
    return null;
  }

  return new GoogleGenAI({ apiKey });
}
