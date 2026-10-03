import { z } from "zod";
import { MAX_INPUT_LENGTH } from "@/lib/chat/gate";
import { MAX_ACCEPTED_TURNS, MAX_MODEL_TURN_LENGTH, trimHistory } from "@/lib/chat/history";

// The limits and the trimming live in a Zod-free module the browser can import
// without pulling in this schema; see `lib/chat/history.ts`. Re-exported so the
// server side keeps one place to import the whole chat contract from.
export { MAX_ACCEPTED_TURNS, MAX_MODEL_TURN_LENGTH, MAX_TURNS, trimHistory } from "@/lib/chat/history";

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
