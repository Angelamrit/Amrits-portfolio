import { z } from "zod";
import { chatRequestSchema } from "@/lib/validation/chat";
import { classifyInput } from "@/lib/chat/gate";
import { buildScopeLexicon, loadKnowledgeBase, KnowledgeBaseError } from "@/lib/chat/kb";
import { buildSystemInstruction } from "@/lib/chat/prompt";
import { CHAT_MODEL, MAX_OUTPUT_TOKENS, REASONING_EFFORT, getOpenAIClient } from "@/lib/chat/client";
import { checkRateLimit, checkUnscopedRateLimit, clientKey } from "@/lib/chat/rate-limit";

/**
 * Chat endpoint.
 *
 * Order matters here. Validation and the deterministic gate run before anything
 * touches the model, because the knowledge base requires that greetings, noise
 * and out-of-scope input never invoke it, and because every avoided call is a
 * request not billed.
 *
 * Nothing in this file ever returns internal detail to the caller: validation
 * errors, knowledge-base errors and SDK errors are logged server-side and
 * answered with a neutral message.
 */

/** Never prerender or cache: every request is a fresh conversation turn. */
export const dynamic = "force-dynamic";

const CONTACT_FALLBACK =
  "I can't reach the assistant right now. For anything you need, Angel Indian Restaurant can be reached on 347-848-0098 or at angelrestaurant278@gmail.com, and the contact page on this site goes straight to the team.";

const GENERIC_ERROR =
  "Something went wrong on my side. Please try again, or contact Angel Indian Restaurant on 347-848-0098 or angelrestaurant278@gmail.com.";

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

  // 4. Deterministic gate. Blocked input never reaches the model.
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

  // 5. Unrecognised-but-plausible input is allowed through rather than refused,
  // so it is throttled instead. That protects the budget against a stranger
  // firing noise at a cold endpoint.
  //
  // It must not be spent on a conversation already under way. Ordinary
  // follow-ups carry no vocabulary of their own — "What about October 15?",
  // "How many people can come?", "How do I get started?" — so a perfectly
  // normal seven-turn exchange drew four against this budget and the next one
  // inside the minute was turned away mid-conversation. An open thread is the
  // thing that separates a visitor from a script: the visitor has already been
  // answered at least once. Everyone still pays the ordinary limit above.
  if (!decision.scopeSignal && !hasContext) {
    const unscoped = checkUnscopedRateLimit(caller);
    if (!unscoped.ok) {
      return textResponse(THROTTLED, {
        status: 429,
        headers: { "Retry-After": String(unscoped.retryAfterSeconds), "X-Chat-Scope": "throttled" },
      });
    }
  }

  // 6. Model call.
  const client = getOpenAIClient();
  if (!client) {
    return textResponse(CONTACT_FALLBACK, {
      status: 200,
      headers: { "X-Chat-Mode": "unconfigured" },
    });
  }

  // Either the visitor leaving or the timeout elapsing ends the generation.
  const abortSignal = AbortSignal.any([request.signal, AbortSignal.timeout(GENERATION_TIMEOUT_MS)]);

  try {
    const stream = await client.responses.create(
      {
        model: CHAT_MODEL,
        // The system instruction travels as `instructions`, which the Responses
        // API keeps separate from the conversation. Visitor text can therefore
        // never occupy the same channel as the rules, which is the structural
        // half of the injection defence — the deterministic gate is the other.
        instructions: buildSystemInstruction(kb),
        input: [
          // Our transcript calls the assistant's turns "model"; the API calls
          // them "assistant". The wire format the browser sees is unchanged.
          ...parsed.history.map((m) => ({
            role: m.role === "model" ? ("assistant" as const) : ("user" as const),
            content: m.text,
          })),
          { role: "user" as const, content: parsed.message },
        ],
        max_output_tokens: MAX_OUTPUT_TOKENS,
        // Measured against the three near-identical Dum Biryani rows before it
        // was chosen; see REASONING_EFFORT. `temperature` is not an option here
        // — reasoning models reject it with a 400.
        reasoning: { effort: REASONING_EFFORT },
        // Nothing is retained on OpenAI's side. Visitors are anonymous and the
        // transcript belongs to their browser, so there is no reason to leave a
        // copy of it with a third party.
        store: false,
        stream: true,
      },
      { signal: abortSignal },
    );

    const body = new ReadableStream<Uint8Array>({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          // Set from the terminal event rather than inferred: the API says so
          // explicitly when the answer was cut at the token ceiling.
          let truncated = false;
          for await (const event of stream) {
            // Each text delta is forwarded the moment it arrives. Collecting
            // them first would add the whole generation to the visible wait.
            if (event.type === "response.output_text.delta") {
              controller.enqueue(encoder.encode(event.delta));
            } else if (event.type === "response.incomplete") {
              truncated = event.response?.incomplete_details?.reason === "max_output_tokens";
            }
          }
          if (truncated) {
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
