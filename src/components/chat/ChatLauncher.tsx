"use client";

import { MessageCircle } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ComponentType } from "react";
import { LAUNCHER_CLASS } from "./launcher";

type Widget = ComponentType<{ initialOpen?: boolean }>;

/**
 * The assistant, kept out of every page's first download.
 *
 * The widget is the heaviest script the public site has: it brings the
 * animation library, the transcript logic and the markdown renderer, and it sat
 * in the initial JavaScript of every page although most visitors never open it.
 * Until it is needed, this renders only its button (same classes, same place),
 * and the widget is fetched once the page has loaded and the browser is idle —
 * or at once, if the visitor reaches for the button first.
 *
 * A tap before the widget has arrived is remembered: the widget mounts already
 * open, so the visitor never has to tap twice.
 */
export function ChatLauncher() {
  const [Loaded, setLoaded] = useState<Widget | null>(null);
  const [wanted, setWanted] = useState(false);
  const requested = useRef(false);

  const load = useCallback(() => {
    if (requested.current) return;
    requested.current = true;
    import("./ChatWidget")
      .then((module) => setLoaded(() => module.ChatWidget))
      // A failed fetch (offline, a deploy mid-visit) leaves the stand-in in place,
      // and the next hover or tap tries again.
      .catch(() => {
        requested.current = false;
      });
  }, []);

  useEffect(() => {
    let idle: number | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const schedule = () => {
      if ("requestIdleCallback" in window) idle = window.requestIdleCallback(load, { timeout: 6000 });
      else timer = setTimeout(load, 3000);
    };
    if (document.readyState === "complete") schedule();
    else window.addEventListener("load", schedule, { once: true });
    return () => {
      window.removeEventListener("load", schedule);
      if (idle !== undefined) window.cancelIdleCallback(idle);
      if (timer !== undefined) clearTimeout(timer);
    };
  }, [load]);

  if (Loaded) return <Loaded initialOpen={wanted} />;

  return (
    <button
      type="button"
      aria-label="Open the assistant"
      aria-expanded={false}
      className={LAUNCHER_CLASS}
      onPointerEnter={load}
      onFocus={load}
      onClick={() => {
        setWanted(true);
        load();
      }}
    >
      <MessageCircle className="size-5" strokeWidth={1.75} />
    </button>
  );
}
