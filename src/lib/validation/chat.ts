import { z } from "zod";
import { MAX_INPUT_LENGTH } from "@/lib/chat/gate";

/** How many prior turns the assistant carries as conversational memory. */
export const MAX_TURNS = 20;

/**
 * Hard ceiling on the array a client may post. Anything past this is not a real
 * transcript, so it is refused rather than trimmed.
 *
 * Between MAX_TURNS and this limit the history is trimmed, not rejected: a
 * growing conversation is normal, and failing the whole request because of it
 * used to break the chat permanently from the 21st turn onward.
 */
export const MAX_ACCEPTED_TURNS = 200;

/**
 * Cap for an assistant turn replayed in history.
 *
 * This is deliberately NOT `MAX_INPUT_LENGTH`. That limit exists to stop a
 * visitor pasting an essay into the input box, and applying it to the model's
 * own replies was a bug: with `maxOutputTokens` at 700 an answer can run to a
 * few thousand characters, so any conversation whose reply exceeded 1000 chars
 * had every following message rejected as malformed.
 */
export const MAX_MODEL_TURN_LENGTH = 4000;

/**
 * Role-dependent limits: visitor turns keep the strict input cap, assistant
 * turns get enough room for a real answer.
 */
export const chatMessageSchema = z.discriminatedUnion("role", [
  z.object({
    role: z.literal("user"),
    text: z.string().trim().min(1).max(MAX_INPUT_LENGTH),
  }),
  z.object({
    role: z.literal("model"),
    text: z.string().trim().min(1).max(MAX_MODEL_TURN_LENGTH),
  }),
]);

/**
 * Keeps the most recent `MAX_TURNS` turns, and drops any leading assistant turns
 * so the window always opens on a visitor turn rather than mid-exchange.
 *
 * Shared by the client (to keep the payload small) and the route (so a stale or
 * third-party client cannot break the conversation), which is why it is generic
 * over anything carrying a `role`.
 */
export function trimHistory<T extends { role: "user" | "model" }>(turns: readonly T[]): T[] {
  const recent = turns.slice(-MAX_TURNS);
  const firstUserTurn = recent.findIndex((t) => t.role === "user");
  if (firstUserTurn === -1) return [];
  return recent.slice(firstUserTurn);
}

export const chatRequestSchema = z.object({
  message: z.string().min(1).max(MAX_INPUT_LENGTH),
  /** Prior turns, oldest first. The client owns the transcript; the server is stateless. */
  history: z
    .array(chatMessageSchema)
    .max(MAX_ACCEPTED_TURNS)
    .optional()
    .default([])
    // Trimmed here rather than in the route so no caller can forget to do it.
    .transform(trimHistory),
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type ChatRequest = z.infer<typeof chatRequestSchema>;
