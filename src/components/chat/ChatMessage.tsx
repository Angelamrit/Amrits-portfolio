"use client";

import { cn } from "@/lib/cn";
import { parseMarkdown, type Span } from "@/lib/chat/markdown";
import { Button } from "@/components/ui/Button";
import { useVenue } from "@/components/layout/VenueContext";
import { ACEVA_URL, type IntentMatch } from "@/lib/chat/intent";
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
  // The live reservation link, as edited in the dashboard — not the one the
  // code shipped with, which is what every other Reserve button stopped using.
  const { resyUrl } = useVenue();

  /*
   * Two departures from the standard Button, both forced by how narrow a chat
   * bubble is. The bubble is 85% of a panel that is 320px wide on a small
   * phone, so the button has around 220px of usable width.
   *
   * The arrow is dropped. At that width "Plan Your Celebration" wrapped onto
   * two lines and the arrow was left stranded beside the block, reading as a
   * misaligned icon rather than an affordance. It earns its place on a wide
   * page button; here it only costs the label the room it needed.
   *
   * Tracking comes down from the system's 0.22em to 0.12em. Measured: the
   * label needs 263px at 0.22em and 230px at 0.12em, which is what brings it
   * onto one line. Below roughly 340px it still wraps, but centred and without
   * a stray icon it wraps cleanly.
   */
  const ctaClass = "mt-3 w-full tracking-[0.12em]";

  if (cta.intent === "resy") {
    if (!resyUrl) return null;
    return (
      <Button href={resyUrl} variant="primary" size="sm" icon={false} className={ctaClass}>
        Reserve a Table
      </Button>
    );
  }

  // The studio credited in the footer. The reply is one fixed sentence that
  // already names the link; this is the clickable version of it.
  if (cta.intent === "aceva") {
    return (
      <Button href={ACEVA_URL} variant="primary" size="sm" icon={false} className={ctaClass}>
        Visit Aceva Tech
      </Button>
    );
  }

  const href = cta.experience ? `/contact?experience=${cta.experience}` : "/contact";
  return (
    <Button href={href} variant="primary" size="sm" icon={false} className={ctaClass}>
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
          // role=status so a screen reader is told the assistant is working;
          // the wait is several seconds and silence reads as a dead control.
          // The dots are aria-hidden — the label carries the meaning, and
          // three announced bullets would not.
          <span role="status" aria-label="Thinking" className="flex items-center gap-1 py-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                aria-hidden
                className="size-1.5 animate-chat-thinking rounded-full bg-gold"
                // 160ms against the 1.4s cycle is a ~11% phase offset, which is
                // what makes the three read as a travelling wave rather than a
                // single pulse. Under prefers-reduced-motion the global rule
                // collapses the animation and the dots simply sit still.
                style={{ animationDelay: `${i * 160}ms` }}
              />
            ))}
          </span>
        )}
      </div>
    </div>
  );
}
