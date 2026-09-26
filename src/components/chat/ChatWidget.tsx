"use client";

import { AnimatePresence, m } from "motion/react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { MAX_INPUT_LENGTH } from "@/lib/chat/gate";
import { Button } from "@/components/ui/Button";
import { Orbs } from "@/components/ui/Orbs";
import { MOBILE_BREAKPOINT, focusIsUnclaimed, prefersAutoFocus } from "./focus";
import { ChatMessage } from "./ChatMessage";
import { useChat } from "./useChat";

const ease = [0.16, 1, 0.3, 1] as const;

const OPENING_LINE =
  "Ask me about Chef Amrit or Angel Indian Restaurant — the menu, visiting, or how to get in touch.";

const SUGGESTIONS = [
  "What are the opening hours?",
  "Where is the restaurant?",
  "What vegetarian dishes are on the menu?",
];

export function ChatWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const { turns, busy, send, cancel } = useChat();

  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);

  /**
   * Only settled assistant replies are announced. The transcript itself is not a
   * live region: it changes on every streamed chunk, which made screen readers
   * re-read the answer continuously while it arrived.
   */
  const lastSettledReply = [...turns].reverse().find((t) => t.role === "model" && !t.streaming);

  // Close on navigation: the page-transition wipe sits above this panel. Adjusted
  // during render rather than in an effect, which avoids a cascading re-render.
  const [lastPathname, setLastPathname] = useState(pathname);
  if (lastPathname !== pathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  // Stop the in-flight request when the panel closes.
  useEffect(() => {
    if (!open) cancel();
  }, [open, cancel]);

  /**
   * Size the full-bleed mobile panel to the *visual* viewport.
   *
   * `100dvh` accounts for collapsing browser chrome but not for the virtual
   * keyboard: a fixed, full-height panel keeps its size when the keyboard opens,
   * so the composer ends up behind it. visualViewport reports the area actually
   * left to the page, and its offsetTop covers the browser scrolling the page up
   * to reveal the focused field.
   *
   * Scoped to this panel deliberately. The alternative — `interactive-widget=
   * resizes-content` on the document viewport — would change how every fixed
   * element on the site behaves.
   */
  const [viewport, setViewport] = useState<{ height: number; top: number } | null>(null);
  useEffect(() => {
    const vv = typeof window === "undefined" ? undefined : window.visualViewport;
    if (!open || !vv) return;

    const update = () => {
      setViewport(
        window.innerWidth < MOBILE_BREAKPOINT ? { height: vv.height, top: vv.offsetTop } : null,
      );
    };

    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    // window resize and orientationchange are belt and braces: a viewport change
    // that does not also fire visualViewport's own resize would otherwise leave
    // the panel sized to the previous viewport.
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
      setViewport(null);
    };
  }, [open]);

  // Escape, focus trap and body scroll lock, matching MobileMenu.
  useEffect(() => {
    if (!open) return;

    // Captured now rather than read in the cleanup: by then the panel is
    // already unmounting and its ref has been cleared.
    const panel = panelRef.current;
    const launcher = launcherRef.current;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key !== "Tab" || !panel) return;
      const focusables = panel.querySelectorAll<HTMLElement>(
        "button:not([disabled]), input:not([disabled]), a[href]",
      );
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };

    document.addEventListener("keydown", onKey);

    // Focus the composer on open only where there is a real pointer. On a touch
    // device that focus summons the virtual keyboard the instant the panel
    // appears, covering half the conversation before anything has been asked.
    const focusTimer = prefersAutoFocus()
      ? window.setTimeout(() => inputRef.current?.focus(), 80)
      : undefined;

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
      if (focusTimer !== undefined) window.clearTimeout(focusTimer);

      // Standard dialog behaviour: send focus back to the trigger. Only when
      // focus still belongs to the panel — never steal it from wherever the
      // visitor moved to.
      const active = document.activeElement;
      if (!active || active === document.body || panel?.contains(active)) {
        launcher?.focus();
      }
    };
  }, [open]);

  // Keep the newest turn in view as it streams.
  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [turns]);

  /**
   * Hand the composer back once a reply has finished, so the next question can
   * be typed straight away.
   *
   * Only after the visitor has actually sent something — this must not be the
   * back door that reopens the keyboard on a freshly opened mobile panel — and
   * only when focus is not somewhere they deliberately put it.
   */
  const hasAsked = turns.length > 0;
  const wasBusy = useRef(false);
  useEffect(() => {
    const finished = wasBusy.current && !busy;
    wasBusy.current = busy;
    if (!finished || !open || !hasAsked) return;
    if (!focusIsUnclaimed(panelRef.current)) return;
    inputRef.current?.focus();
  }, [busy, open, hasAsked]);

  const submit = (text: string) => {
    if (busy) return;
    const trimmed = text.trim();
    if (!trimmed) return;
    setDraft("");
    void send(trimmed);
  };

  return (
    <>
      {/* Launcher. On mobile it sits above the sticky booking bar, which owns the bottom edge. */}
      <button
        ref={launcherRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="chat-panel"
        aria-label={open ? "Close the assistant" : "Open the assistant"}
        // Scaled to nothing while the panel is open, so take it out of the tab
        // order and the accessibility tree instead of leaving an invisible
        // control behind. Matches how StickyBookCta hides itself.
        tabIndex={open ? -1 : 0}
        aria-hidden={open}
        className={cn(
          "fixed right-3 bottom-22 z-[75] flex size-13 items-center justify-center rounded-pill md:right-6 md:bottom-6",
          "bg-gradient-to-r from-gold-light via-gold to-gold-deep text-charcoal",
          "shadow-glow transition-all duration-500 ease-luxe",
          "hover:-translate-y-0.5 hover:shadow-glow-lg focus-visible:outline-gold",
          open && "scale-0 opacity-0",
        )}
      >
        <MessageCircle className="size-5" strokeWidth={1.75} />
      </button>

      <AnimatePresence>
        {open && (
          <m.div
            ref={panelRef}
            id="chat-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Ask about Chef Amrit and Angel Indian Restaurant"
            className={cn(
              // glass-strong is the system's floating-surface utility: chocolate
              // gradient, gold hairline border and inset highlight. tone-dark
              // stays for --pattern-line, which the ambient texture below reads.
              //
              // backdrop-blur-2xl is kept alongside it because the glass
              // utilities' own backdrop-filter computes to `none` throughout this
              // build — verified on untouched portfolio elements, so it is a
              // pre-existing quirk, not something introduced here. MobileMenu
              // pairs the same Tailwind class with its panel for the same reason.
              "tone-dark glass-strong backdrop-blur-2xl fixed z-[95] flex flex-col overflow-hidden",
              // Full bleed below sm, sized by height rather than by a bottom
              // inset so the visual-viewport measurement above can refine it
              // when the keyboard appears. dvh is the no-JS baseline.
              "inset-x-0 top-0 h-[100dvh] rounded-none",
              // The 3rem reserve only bites on short viewports — landscape
              // phones — where the old 6rem left the transcript under half the
              // panel. Taller screens still clamp at 34rem, unchanged.
              "sm:inset-x-auto sm:top-auto sm:right-6 sm:bottom-6 sm:h-[min(34rem,calc(100dvh-3rem))] sm:w-[23rem] sm:rounded-frame",
            )}
            style={viewport ? { height: viewport.height, top: viewport.top } : undefined}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.36, ease }}
          >
            {/* Same ambient drift MobileMenu uses, at its quietest setting. */}
            <Orbs variant="subtle" />

            {/* Safe-area padding applies only to the full-bleed layout, which is
                the one that meets the notch and the home indicator; the docked
                card already sits inside the viewport. Short landscape viewports
                give the header less vertical room so the transcript keeps most
                of the panel. */}
            <header className="relative z-[2] flex items-center justify-between gap-3 border-b border-line px-4 py-3 pt-[calc(0.75rem+env(safe-area-inset-top))] min-[400px]:px-5 sm:py-4 sm:pt-4">
              <div>
                {/* Cormorant needs room to read as display type; at 1.05rem it
                    looked like a UI label rather than a masthead. font-light
                    matches every other heading on the site. */}
                <p className="font-display text-[1.3rem] font-light leading-none text-fg">Ask Angel</p>
                <p className="eyebrow mt-1.5">Portfolio assistant</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close the assistant"
                // size-11 keeps a full 44px touch target on the mobile
                // full-screen panel; the docked card is pointer-driven, where 44px
                // made the header 14% of the panel height.
                className="glass grid size-11 shrink-0 place-items-center rounded-full text-fg transition-colors hover:border-gold hover:text-gold-light focus-visible:outline-gold sm:size-9"
              >
                <X className="size-5 sm:size-4" strokeWidth={1.25} />
              </button>
            </header>

            {/* data-lenis-prevent stops the site's smooth-scroll wrapper from stealing wheel events. */}
            <div
              ref={logRef}
              data-lenis-prevent
              aria-busy={busy}
              className="relative z-[2] min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4 min-[400px]:px-5"
            >
              <p className="font-sans text-[0.8rem] leading-relaxed text-muted">{OPENING_LINE}</p>

              {turns.length === 0 && (
                <ul className="space-y-2 pt-1">
                  {SUGGESTIONS.map((s) => (
                    <li key={s}>
                      {/* Button's outline variant, with its uppercase micro-label
                          typography relaxed: that styling is for short labels, and
                          the system never sets full sentences in caps. */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => submit(s)}
                        className="w-full justify-between gap-3 normal-case tracking-normal text-[0.78rem]"
                      >
                        {s}
                      </Button>
                    </li>
                  ))}
                </ul>
              )}

              <div className="space-y-3">
                {turns.map((turn) => (
                  <ChatMessage key={turn.id} turn={turn} />
                ))}
              </div>
            </div>

            {/* Announces each completed reply once, instead of on every chunk. */}
            <p className="relative z-[2] sr-only" aria-live="polite" aria-atomic="true">
              {lastSettledReply?.text ?? ""}
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                submit(draft);
              }}
              // px-5 matches the header and transcript, so the input's left edge
              // lines up with the text above it instead of sitting 4px inside.
              className="relative z-[2] flex items-center gap-2 border-t border-line px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] min-[400px]:px-5 sm:pb-3"
            >
              <label htmlFor="chat-input" className="sr-only">
                Ask a question
              </label>
              <input
                id="chat-input"
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                maxLength={MAX_INPUT_LENGTH}
                autoComplete="off"
                placeholder="Ask a question…"
                className="min-w-0 flex-1 rounded-pill border border-line bg-surface-2/60 px-4 py-2.5 font-sans text-[0.82rem] text-fg placeholder:text-muted focus-visible:outline-gold"
              />
              {/* Button's primary treatment — gradient, lift, glow and the hover
                  sweep — in a circular icon geometry rather than its pill label. */}
              <button
                type="submit"
                disabled={busy || draft.trim().length === 0}
                aria-label="Send"
                className="group relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-pill bg-gradient-to-r from-gold-light via-gold to-gold-deep text-charcoal shadow-glow transition-all duration-500 ease-luxe hover:-translate-y-0.5 hover:shadow-glow-lg disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-gold"
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/45 to-transparent transition-transform duration-[900ms] ease-luxe group-hover:translate-x-full"
                />
                <Send className="relative size-4" strokeWidth={1.75} />
              </button>
            </form>
          </m.div>
        )}
      </AnimatePresence>
    </>
  );
}
