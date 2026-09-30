import { z } from "zod";
import { FinishReason, ThinkingLevel } from "@google/genai";
import { chatRequestSchema } from "@/lib/validation/chat";
import { classifyInput } from "@/lib/chat/gate";
import { buildScopeLexicon, loadKnowledgeBase, KnowledgeBaseError } from "@/lib/chat/kb";
import { buildSystemInstruction } from "@/lib/chat/prompt";
import { CHAT_MODEL, MAX_OUTPUT_TOKENS, getGeminiClient } from "@/lib/chat/client";
import { checkRateLimit, checkUnscopedRateLimit, clientKey } from "@/lib/chat/rate-limit";

/**
 * Chat endpoint.
 *
 * Order matters here. Validation and the deterministic gate run before anything
 * touches Gemini, because the knowledge base requires that greetings, noise and
 * out-of-scope input never invoke the model, and because the free tier is
 * quota-limited per day.
 *
 * Nothing in this file ever returns internal detail to the caller: validation
 * errors, knowledge-base errors and SDK errors are logged server-side and
 * answered with a neutral message.
 */

/** Never prerender or cache: every request is a fresh conversation turn. */
export const dynamic = "force-dynamic";

const CONTACT_FALLBACK =
  "I can't reach the assistant right now. For anything you need, Angel Indian Restaurant can be reached on 347-848-0098 or at info@angelindianrestaurant.com, and the contact page on this site goes straight to the team.";

const GENERIC_ERROR =
  "Something went wrong on my side. Please try again, or contact Angel Indian Restaurant on 347-848-0098 or info@angelindianrestaurant.com.";

const BAD_REQUEST = "I couldn't read that message. Please try asking again.";

/**
 * Appended when the model runs into `maxOutputTokens`. Without it the reply just
 * stops mid-word — a menu question once ended on "Homemade Indian cheese," —
 * which reads as a broken assistant rather than a long answer.
 */
const TRUNCATED_NOTE =
  "\n\n… I had to stop there. Ask me about a particular section or dish and I can give you the detail.";

/**
 * Ceiling on a single generation, start to finish.
 *
 * `request.signal` only fires when the visitor disconnects; without this a
 * stalled upstream would hold the route open indefinitely. Combined with the
 * request signal below so either condition ends the call.
 */
const GENERATION_TIMEOUT_MS = 30_000;

function textResponse(body: string, init: ResponseInit = {}): Response {
  return new Response(body, {
    ...init,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      ...init.headers,
    },
  });
}

const THROTTLED =
  "You're sending messages very quickly. Please wait a moment and try again.";

export async function POST(request: Request): Promise<Response> {
  // 1. Rate limit before any parsing work.
  const caller = clientKey(request);
  const limit = checkRateLimit(caller);
  if (!limit.ok) {
    return textResponse(THROTTLED, {
      status: 429,
      headers: { "Retry-After": String(limit.retryAfterSeconds) },
    });
  }

  // 2. Parse and validate.
  let parsed: z.infer<typeof chatRequestSchema>;
  try {
    const body: unknown = await request.json();
    const result = chatRequestSchema.safeParse(body);
    if (!result.success) {
      return textResponse(BAD_REQUEST, { status: 400 });
    }
    parsed = result.data;
  } catch {
    return textResponse(BAD_REQUEST, { status: 400 });
  }

  // 3. Load and validate the knowledge base.
  let kb;
  try {
    kb = loadKnowledgeBase();
  } catch (error) {
    if (error instanceof KnowledgeBaseError) {
      console.error("[chat:kb-invalid]", error.message);
    } else {
      console.error("[chat:kb-error]", error);
    }
    return textResponse(CONTACT_FALLBACK, { status: 503 });
  }

  // 4. Deterministic gate. Blocked input never reaches Gemini.
  const hasContext = parsed.history.some((m) => m.role === "model");
  const decision = classifyInput(parsed.message, {
    lexicon: buildScopeLexicon(kb),
    hasContext,
  });

  if (!decision.allow) {
    return textResponse(decision.response, {
      status: 200,
      headers: { "X-Chat-Gate": decision.reason },
    });
  }

  // 5. Unrecognised-but-plausible input is allowed through, so it is throttled
  // instead of refused. This is what keeps the free-tier quota protected now
  // that the gate no longer turns a question away for lacking a known word.
  if (!decision.scopeSignal) {
    const unscoped = checkUnscopedRateLimit(caller);
    if (!unscoped.ok) {
      return textResponse(THROTTLED, {
        status: 429,
        headers: { "Retry-After": String(unscoped.retryAfterSeconds), "X-Chat-Scope": "throttled" },
      });
    }
  }

  // 6. Model call.
  const client = getGeminiClient();
  if (!client) {
    return textResponse(CONTACT_FALLBACK, {
      status: 200,
      headers: { "X-Chat-Mode": "unconfigured" },
    });
  }

  // Either the visitor leaving or the timeout elapsing ends the generation.
  const abortSignal = AbortSignal.any([request.signal, AbortSignal.timeout(GENERATION_TIMEOUT_MS)]);

  try {
    const stream = await client.models.generateContentStream({
      model: CHAT_MODEL,
      contents: [
        ...parsed.history.map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
        { role: "user" as const, parts: [{ text: parsed.message }] },
      ],
      config: {
        systemInstruction: buildSystemInstruction(kb),
        maxOutputTokens: MAX_OUTPUT_TOKENS,
        temperature: 0.2,
        // LOW rather than MINIMAL, and the difference is factual accuracy, not
        // polish. At MINIMAL this assistant quoted the Goat Dum Biryani at
        // $25.00 instead of $25.99 on eleven of twelve asks, and once gave
        // $20.99 — the price of the Vegetable Dum Biryani three lines above it.
        //
        // Measured, not guessed. The same question against a three-line prompt
        // answers correctly at MINIMAL, so the model can read the figure; it is
        // retrieving it from ~7,500 tokens of near-identical menu rows that it
        // cannot do. Temperature made no difference at either 0.2 or 0; the
        // thinking level was the whole of it.
        //
        // This costs more per request than MINIMAL, which was chosen for the
        // free tier's budget. A wrong price on a menu is worse than a smaller
        // budget. Note that `thinkingBudget: 0` is rejected with a 400 on the
        // Gemini 3.x family — thinking cannot be switched off outright, and
        // `thinkingLevel` is the supported control.
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        abortSignal,
      },
    });

    const body = new ReadableStream<Uint8Array>({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          let finishReason: FinishReason | undefined;
          for await (const chunk of stream) {
            const text = chunk.text;
            if (text) controller.enqueue(encoder.encode(text));
            finishReason = chunk.candidates?.[0]?.finishReason ?? finishReason;
          }
          if (finishReason === FinishReason.MAX_TOKENS) {
            controller.enqueue(encoder.encode(TRUNCATED_NOTE));
          }
          controller.close();
        } catch (error) {
          // A mid-stream failure must not leave the client hanging.
          console.error("[chat:stream-error]", error);
          controller.error(error);
        }
      },
    });

    return new Response(body, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Chat-Mode": "live",
        // Whether this request matched known in-scope vocabulary. Tells us how
        // much traffic now reaches the model on the model's own judgement rather
        // than on a keyword match, which is the thing to watch after this change.
        "X-Chat-Scope": decision.scopeSignal ? "signal" : "none",
      },
    });
  } catch (error) {
    console.error("[chat:generate-error]", error);
    return textResponse(GENERIC_ERROR, { status: 502 });
  }
}
