"use client";

import { cn } from "@/lib/cn";
import { parseMarkdown, type Span } from "@/lib/chat/markdown";
import { Button } from "@/components/ui/Button";
import { site } from "@/data/site";
import type { IntentMatch } from "@/lib/chat/intent";
import type { ChatTurn } from "./useChat";

function Spans({ spans }: { spans: Span[] }) {
  return (
    <>
      {spans.map((span, i) =>
        span.bold ? (
          <strong key={i} className="font-semibold text-gold-light">
            {span.text}
          </strong>
        ) : (
          <span key={i}>{span.text}</span>
        ),
      )}
    </>
  );
}

/**
 * Assistant replies arrive as light Markdown. They are parsed into a small block
 * structure and mapped onto React elements — never injected as HTML — so bold
 * and lists render properly without opening an XSS path.
 */
function MarkdownBody({ text }: { text: string }) {
  const blocks = parseMarkdown(text);

  return (
    <div className="space-y-2.5">
      {blocks.map((block, i) =>
        block.type === "heading" ? (
          // Rendered as an emphasised label rather than a real <h*>: this sits
          // inside a dialog and a live region, where injecting heading levels
          // would pollute the document outline.
          <p key={i} className="pt-1 font-semibold text-gold-light">
            <Spans spans={block.spans} />
          </p>
        ) : block.type === "list" ? (
          block.ordered ? (
            <ol key={i} className="list-decimal space-y-1 pl-4 marker:text-gold/70">
              {block.items.map((item, j) => (
                <li key={j} className="pl-0.5">
                  <Spans spans={item} />
                </li>
              ))}
            </ol>
          ) : (
            <ul key={i} className="list-disc space-y-1 pl-4 marker:text-gold/70">
              {block.items.map((item, j) => (
                <li key={j} className="pl-0.5">
                  <Spans spans={item} />
                </li>
              ))}
            </ul>
          )
        ) : (
          <p key={i} className="whitespace-pre-wrap">
            <Spans spans={block.spans} />
          </p>
        ),
      )}
    </div>
  );
}

/**
 * The assistant never completes a booking or an enquiry itself. Each intent ends
 * at a workflow the site already has: Resy for a table, and the existing contact
 * wizard for an occasion — deep-linked with `?experience=`, which that wizard
 * already reads and validates, so nothing is duplicated here.
 */
function ChatCta({ cta }: { cta: IntentMatch }) {
  if (cta.intent === "resy") {
    if (!site.restaurant.resyUrl) return null;
    return (
      <Button href={site.restaurant.resyUrl} variant="primary" size="sm" className="mt-3 w-full">
        Reserve a Table
      </Button>
    );
  }

  const href = cta.experience ? `/contact?experience=${cta.experience}` : "/contact";
  return (
    <Button href={href} variant="primary" size="sm" className="mt-3 w-full">
      Plan Your Celebration
    </Button>
  );
}

export function ChatMessage({ turn }: { turn: ChatTurn }) {
  const isUser = turn.role === "user";

  return (
    <div className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          // rounded-frame is the project's own radius token; rounded-2xl was the
          // one value in this widget with nothing behind it in the design system.
          // break-words is load-bearing at narrow widths: a long unbroken token
          // — a URL, a run-on dish name — overflowed the bubble by 161px at
          // 320px before this, because overflow-wrap defaults to `normal`.
          "max-w-[85%] rounded-frame px-4 py-3 font-sans text-[0.82rem] leading-relaxed break-words",
          isUser
            ? "bg-gradient-to-r from-gold-light via-gold to-gold-deep text-charcoal"
            : "border border-line bg-surface-2/70 text-fg",
        )}
      >
        {turn.text ? (
          // Visitor text is shown verbatim: only the assistant writes Markdown.
          isUser ? (
            <p className="whitespace-pre-wrap">{turn.text}</p>
          ) : (
            <>
              <MarkdownBody text={turn.text} />
              {turn.cta && <ChatCta cta={turn.cta} />}
            </>
          )
        ) : (
          <span className="flex items-center gap-1" aria-label="Thinking">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="size-1.5 animate-pulse-glow rounded-full bg-gold"
                style={{ animationDelay: `${i * 160}ms` }}
              />
            ))}
          </span>
        )}
      </div>
    </div>
  );
}
