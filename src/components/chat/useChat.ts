"use client";

import { useCallback, useRef, useState } from "react";
import { classifyInput, MAX_INPUT_LENGTH, type GateReason } from "@/lib/chat/gate";
import { MAX_MODEL_TURN_LENGTH, trimHistory } from "@/lib/validation/chat";
import { detectIntent, type IntentMatch } from "@/lib/chat/intent";

export type ChatRole = "user" | "model";

export type ChatTurn = {
  id: string;
  role: ChatRole;
  text: string;
  /** True while the model's reply is still streaming in. */
  streaming?: boolean;
  /**
   * The handoff this reply should offer, if any. Decided from the visitor's
   * question rather than from the reply, so the action does not depend on how
   * the model phrased itself.
   */
  cta?: IntentMatch;
};

/**
 * Gate reasons the browser can decide on its own. Scope decisions (vague_wh,
 * off_topic) depend on menu and topic vocabulary that only exists server-side,
 * so they are deferred — the server still answers them without calling Gemini.
 */
const LOCAL_GATE_REASONS: ReadonlySet<GateReason> = new Set<GateReason>([
  "empty",
  "too_long",
  "emoji_only",
  "gibberish",
  "greeting",
  "profanity",
]);

const NETWORK_ERROR =
  "I couldn't reach the assistant. Please try again, or contact Angel Indian Restaurant on 347-848-0098.";

/** Appended to whatever streamed successfully before a mid-answer failure. */
const INTERRUPTED_NOTE =
  "— sorry, that answer was cut short. Please ask again, or call 347-848-0098.";

let turnCounter = 0;
const nextId = () => `turn-${++turnCounter}`;

export function useChat() {
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [busy, setBusy] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setBusy(false);
  }, []);

  const send = useCallback(
    async (raw: string) => {
      if (busy) return;

      const message = raw.trim();
      const hasContext = turns.some((t) => t.role === "model");

      // Instant local rejection for noise the browser can judge by itself.
      const local = classifyInput(message, { hasContext });
      if (!local.allow && LOCAL_GATE_REASONS.has(local.reason)) {
        setTurns((prev) => [
          ...prev,
          ...(message ? [{ id: nextId(), role: "user" as const, text: message }] : []),
          { id: nextId(), role: "model" as const, text: local.response },
        ]);
        return;
      }

      // Clamp replayed turns to the server's limits so the client can never
      // build a body the route rejects, and send only the most recent window —
      // an untrimmed transcript used to 400 once the conversation passed
      // MAX_TURNS, which broke the chat for the rest of the session.
      const history = trimHistory(
        turns
          .filter((t) => t.text.trim().length > 0)
          .map((t) => ({
            role: t.role,
            text: t.text.slice(0, t.role === "model" ? MAX_MODEL_TURN_LENGTH : MAX_INPUT_LENGTH),
          })),
      );

      const askedId = nextId();
      const replyId = nextId();
      // The previous reply's handoff is carried in, so a bare follow-up such as
      // "How do I do that?" keeps the event or reservation context.
      const previous = [...turns].reverse().find((t) => t.role === "model" && t.cta)?.cta ?? null;
      const cta = detectIntent(message, { previous }) ?? undefined;
      setTurns((prev) => [
        ...prev,
        { id: askedId, role: "user", text: message },
        { id: replyId, role: "model", text: "", streaming: true, cta },
      ]);
      setBusy(true);

      const controller = new AbortController();
      abortRef.current = controller;

      const settle = (text: string) =>
        setTurns((prev) =>
          prev.map((t) => (t.id === replyId ? { ...t, text, streaming: false } : t)),
        );

      // Declared outside the try so a failure mid-answer can still keep
      // whatever already streamed rather than discarding it.
      let accumulated = "";

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message, history }),
          signal: controller.signal,
        });

        if (!response.body) {
          settle(await response.text().catch(() => NETWORK_ERROR));
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(value, { stream: true });
          setTurns((prev) =>
            prev.map((t) => (t.id === replyId ? { ...t, text: accumulated } : t)),
          );
        }
        accumulated += decoder.decode();
        settle(accumulated.trim() || NETWORK_ERROR);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          // Drop the question as well as the empty reply. Leaving the question
          // behind showed a dangling message with no answer when the panel
          // was reopened.
          setTurns((prev) => prev.filter((t) => t.id !== replyId && t.id !== askedId));
        } else {
          const partial = accumulated.trim();
          settle(partial ? `${partial}\n\n${INTERRUPTED_NOTE}` : NETWORK_ERROR);
        }
      } finally {
        abortRef.current = null;
        setBusy(false);
      }
    },
    [busy, turns],
  );

  return { turns, busy, send, cancel };
}
