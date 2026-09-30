"use client";

import Image from "next/image";
import Link from "next/link";
import { memo, startTransition, useActionState, useCallback, useEffect, useOptimistic, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  CircleAlert,
  CircleCheck,
  EyeOff,
  LoaderCircle,
  PencilLine,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type { Appearance } from "@/lib/content/dish-usage";
import { idleState, type EditorState } from "@/lib/content/state";
import type { DietaryTag, ImageAsset } from "@/types/content";
import { DietaryBadges } from "@/components/ui/Badge";
import {
  reorderDishesAction,
  setDishSignatureAction,
  setDishVisibilityAction,
} from "@/app/admin/(dashboard)/dishes/actions";

/**
 * Every dish, as a list the chef can run from one screen.
 *
 * The two things he does most — putting a dish on or off the website, and in
 * or out of the signature showcase — are switches on the row itself, and the
 * order is set with arrows rather than by typing position numbers. Each row
 * says in words where that dish appears, so the effect of a switch is never a
 * guess. Everything takes effect at once and shows on screen before the
 * server has answered; a failed write puts the row back and says why.
 */

export type ListDish = {
  id: string;
  name: string;
  tagline: string;
  image: ImageAsset;
  tags: DietaryTag[];
  signature: boolean;
  hidden: boolean;
  added: boolean;
  edited: boolean;
  appears: Appearance[];
  /** Menu courses that use it — shown even while it is hidden, as a warning. */
  inMenus: Appearance[];
};

type Flags = { hidden?: boolean; signature?: boolean };

function Status({ state, pending }: { state: EditorState | null; pending: boolean }) {
  if (pending)
    return (
      <span className="flex items-center gap-2 text-fg/55">
        <LoaderCircle aria-hidden className="size-3.5 animate-spin" strokeWidth={2} />
        Saving
      </span>
    );
  if (state?.status === "error")
    return (
      <span className="flex items-start gap-2 text-[#e59a93]">
        <CircleAlert aria-hidden className="mt-0.5 size-3.5 shrink-0" strokeWidth={1.8} />
        {state.message}
      </span>
    );
  if (state?.message)
    return (
      <span className="flex items-center gap-2 text-[#7fc39b]">
        <CircleCheck aria-hidden className="size-3.5 shrink-0" strokeWidth={1.8} />
        {state.message}
      </span>
    );
  return null;
}

export function DishList({ dishes, notice }: { dishes: ListDish[]; notice?: { kind: "added" | "deleted"; id?: string; name: string } }) {
  const [orderState, orderAction, reordering] = useActionState<EditorState, FormData>(reorderDishesAction, idleState);
  const [visibleState, visibleAction, showing] = useActionState<EditorState, FormData>(setDishVisibilityAction, idleState);
  const [signatureState, signatureAction, featuring] = useActionState<EditorState, FormData>(setDishSignatureAction, idleState);

  const [order, setOptimisticOrder] = useOptimistic(dishes.map((dish) => dish.id));
  const [flags, setOptimisticFlags] = useOptimistic<Record<string, Flags>, [string, Flags]>({}, (current, [id, change]) => ({
    ...current,
    [id]: { ...current[id], ...change },
  }));
  const [banner, setBanner] = useState(notice);

  const byId = new Map(dishes.map((dish) => [dish.id, dish]));
  const ranked = [
    ...order.map((id) => byId.get(id)).filter((dish): dish is ListDish => Boolean(dish)),
    ...dishes.filter((dish) => !order.includes(dish.id)),
  ].map((dish) => ({ ...dish, ...flags[dish.id] }));

  // Stable handlers, reading the list as it is at the moment of the press, so
  // an unchanged row is skipped when another one moves.
  const current = useRef(ranked);
  useEffect(() => {
    current.current = ranked;
  });

  const move = useCallback(
    (id: string, by: -1 | 1) => {
      const ids = current.current.map((dish) => dish.id);
      const from = ids.indexOf(id);
      const to = from + by;
      if (from < 0 || to < 0 || to >= ids.length) return;
      [ids[from], ids[to]] = [ids[to], ids[from]];
      const data = new FormData();
      data.set("order", JSON.stringify(ids));
      startTransition(() => {
        setOptimisticOrder(ids);
        orderAction(data);
      });
    },
    [orderAction, setOptimisticOrder],
  );

  const setVisible = useCallback(
    (id: string, visible: boolean) => {
      const data = new FormData();
      data.set("id", id);
      data.set("visible", String(visible));
      startTransition(() => {
        setOptimisticFlags([id, { hidden: !visible }]);
        visibleAction(data);
      });
    },
    [visibleAction, setOptimisticFlags],
  );

  const setSignature = useCallback(
    (id: string, signature: boolean) => {
      const data = new FormData();
      data.set("id", id);
      data.set("signature", String(signature));
      startTransition(() => {
        setOptimisticFlags([id, { signature }]);
        signatureAction(data);
      });
    },
    [signatureAction, setOptimisticFlags],
  );

  const latest =
    [orderState, visibleState, signatureState].filter((state) => state.at).sort((a, b) => (b.at ?? 0) - (a.at ?? 0))[0] ?? null;
  const pending = reordering || showing || featuring;

  const onSite = ranked.filter((dish) => !dish.hidden).length;
  const inShowcase = ranked.filter((dish) => !dish.hidden && dish.signature).length;
  const hidden = ranked.length - onSite;

  return (
    <div className="flex flex-col gap-4">
      {banner && (
        <p
          role="status"
          className="flex items-start gap-3 rounded-frame border border-[#7fc39b]/30 bg-[#7fc39b]/[0.08] px-4 py-3.5 text-[0.86rem] text-[#9fd6b4]"
        >
          <CircleCheck aria-hidden className="mt-0.5 size-4 shrink-0" strokeWidth={1.8} />
          <span className="flex-1">
            {banner.kind === "added" ? (
              <>
                <strong className="font-semibold">{banner.name}</strong> was added and is on the website now.
              </>
            ) : (
              <>
                <strong className="font-semibold">{banner.name}</strong> was deleted.
              </>
            )}
          </span>
          <button type="button" onClick={() => setBanner(undefined)} aria-label="Dismiss" className="text-fg/40 transition-colors hover:text-fg">
            <X aria-hidden className="size-4" strokeWidth={1.8} />
          </button>
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <ul className="flex flex-wrap gap-2 text-[0.78rem]">
          <li className="glass rounded-pill px-3.5 py-1.5 text-fg/75">
            <strong className="font-semibold text-fg">{onSite}</strong> on the website
          </li>
          <li className="glass rounded-pill px-3.5 py-1.5 text-fg/75">
            <strong className="font-semibold text-gold-light">{inShowcase}</strong> in the signature showcase
          </li>
          {hidden > 0 && (
            <li className="glass rounded-pill px-3.5 py-1.5 text-fg/75">
              <strong className="font-semibold text-fg">{hidden}</strong> hidden
            </li>
          )}
        </ul>
        <p aria-live="polite" className="min-h-5 text-[0.78rem]">
          <Status state={latest} pending={pending} />
        </p>
      </div>

      <ol className="flex flex-col gap-3">
        {ranked.map((dish, index) => (
          <DishRow
            key={dish.id}
            dish={dish}
            position={index + 1}
            isFirst={index === 0}
            isLast={index === ranked.length - 1}
            highlighted={banner?.kind === "added" && banner.id === dish.id}
            onMove={move}
            onVisible={setVisible}
            onSignature={setSignature}
          />
        ))}
      </ol>
    </div>
  );
}

/** A small labelled on/off switch for a row. */
function RowSwitch({ label, on, onChange }: { label: string; on: boolean; onChange: (on: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      // 40px tall: the whole label is the target, and a thumb needs the room.
      className="group flex min-h-10 items-center gap-2.5 rounded-pill pl-1 pr-2 text-left text-[0.76rem] text-fg/70 transition-colors duration-300 hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
    >
      <span
        aria-hidden
        className={cn(
          "flex h-[18px] w-8 shrink-0 items-center rounded-pill p-0.5 transition-colors duration-300",
          on ? "bg-gold/80" : "bg-fg/15",
        )}
      >
        <span
          className={cn(
            "size-3.5 rounded-pill bg-ivory shadow-sm transition-transform duration-300 ease-luxe",
            on ? "translate-x-3.5" : "translate-x-0",
          )}
        />
      </span>
      {label}
    </button>
  );
}

type RowProps = {
  dish: ListDish;
  position: number;
  isFirst: boolean;
  isLast: boolean;
  highlighted: boolean;
  onMove: (id: string, by: -1 | 1) => void;
  onVisible: (id: string, visible: boolean) => void;
  onSignature: (id: string, signature: boolean) => void;
};

/**
 * Compared by what is drawn, because after every change the server sends the
 * whole list again as new objects; comparing identities would redraw every
 * row, photograph and all, on each tap.
 */
const sameRow = (a: RowProps, b: RowProps) =>
  a.position === b.position &&
  a.isFirst === b.isFirst &&
  a.isLast === b.isLast &&
  a.highlighted === b.highlighted &&
  a.onMove === b.onMove &&
  a.onVisible === b.onVisible &&
  a.onSignature === b.onSignature &&
  a.dish.id === b.dish.id &&
  a.dish.name === b.dish.name &&
  a.dish.tagline === b.dish.tagline &&
  a.dish.image.src === b.dish.image.src &&
  a.dish.signature === b.dish.signature &&
  a.dish.hidden === b.dish.hidden &&
  a.dish.added === b.dish.added &&
  a.dish.edited === b.dish.edited &&
  a.dish.tags.join() === b.dish.tags.join() &&
  a.dish.appears.map((place) => place.label).join() === b.dish.appears.map((place) => place.label).join();

const DishRow = memo(function DishRow({ dish, position, isFirst, isLast, highlighted, onMove, onVisible, onSignature }: RowProps) {
  const row = useRef<HTMLLIElement>(null);
  useEffect(() => {
    if (highlighted) row.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [highlighted]);

  // What the chef will see on the site, derived from the switches as they
  // stand now rather than from the last server answer.
  const places = dish.hidden
    ? []
    : [
        ...(dish.signature ? ["Home page", "Angel page"] : []),
        ...dish.appears.filter((place) => !["Home page", "Angel page"].includes(place.label)).map((place) => place.label),
      ];

  return (
    <li
      ref={row}
      className={cn(
        "glass border-gradient group relative flex flex-col gap-4 rounded-frame p-3 transition-shadow duration-500 sm:flex-row sm:items-center sm:p-4",
        highlighted ? "shadow-glow ring-1 ring-[#7fc39b]/60" : "hover:shadow-glow",
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <span className="relative block aspect-[4/3] w-28 shrink-0 overflow-hidden rounded-xl bg-sand sm:w-32">
          <Image
            src={dish.image.src}
            alt=""
            fill
            sizes="128px"
            className={cn("object-cover transition-[filter,opacity] duration-500", dish.hidden && "opacity-40 grayscale")}
          />
          <span className="absolute left-1.5 top-1.5 grid size-6 place-items-center rounded-full bg-charcoal/80 font-sans text-[0.62rem] font-semibold tnum text-gold-light backdrop-blur">
            {position}
          </span>
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h2 className={cn("font-display text-[1.3rem] leading-tight", dish.hidden ? "text-fg/50" : "text-fg")}>{dish.name}</h2>
            {dish.signature && !dish.hidden && (
              <span className="inline-flex items-center gap-1 rounded-pill border border-gold/35 bg-gold/10 px-2 py-0.5 text-[0.56rem] uppercase tracking-[0.14em] text-gold-light">
                <Star aria-hidden className="size-2.5 fill-current" strokeWidth={0} />
                Signature
              </span>
            )}
            {dish.hidden && (
              <span className="inline-flex items-center gap-1 rounded-pill border border-fg/20 bg-fg/[0.06] px-2 py-0.5 text-[0.56rem] uppercase tracking-[0.14em] text-fg/70">
                <EyeOff aria-hidden className="size-2.5" strokeWidth={2} />
                Hidden
              </span>
            )}
            {dish.added && (
              <span className="inline-flex items-center gap-1 rounded-pill border border-[#7fc39b]/35 bg-[#7fc39b]/10 px-2 py-0.5 text-[0.56rem] uppercase tracking-[0.14em] text-[#7fc39b]">
                <Sparkles aria-hidden className="size-2.5" strokeWidth={2} />
                Added by you
              </span>
            )}
            {dish.edited && (
              <span className="rounded-pill border border-fg/15 px-2 py-0.5 text-[0.56rem] uppercase tracking-[0.14em] text-fg/50">Edited</span>
            )}
          </div>
          {dish.tagline && <p className="mt-0.5 truncate text-[0.8rem] text-fg/55">{dish.tagline}</p>}

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <DietaryBadges tags={dish.tags} />
          </div>

          <p className="mt-2 text-[0.74rem] leading-relaxed">
            {dish.hidden ? (
              <span className="text-fg/45">
                Guests cannot see this dish.
                {dish.inMenus.length > 0 && ` ${dish.inMenus.map((place) => place.label).join(", ")} shows only the course heading until you switch it back on or choose another dish in Menus.`}
              </span>
            ) : places.length > 0 ? (
              <span className="text-fg/55">
                <span className="text-fg/40">Shown on </span>
                {places.join(" · ")}
              </span>
            ) : (
              <span className="text-gold-light/85">
                Not shown anywhere yet — turn on Signature, or add it to a menu.
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-fg/8 pt-3 sm:flex-nowrap sm:justify-end sm:border-t-0 sm:pt-0">
        <div className="flex flex-col">
          <RowSwitch label="On the website" on={!dish.hidden} onChange={(on) => onVisible(dish.id, on)} />
          <RowSwitch label="Signature showcase" on={dish.signature} onChange={(on) => onSignature(dish.id, on)} />
        </div>

        <div className="flex items-center gap-1.5">
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => onMove(dish.id, -1)}
              disabled={isFirst}
              aria-label={`Move ${dish.name} up`}
              title="Move up"
              className="grid size-8 place-items-center rounded-lg border border-fg/10 text-fg/55 transition-colors duration-200 hover:border-gold/45 hover:text-gold-light disabled:pointer-events-none disabled:opacity-25"
            >
              <ArrowUp aria-hidden className="size-3.5" strokeWidth={1.8} />
            </button>
            <button
              type="button"
              onClick={() => onMove(dish.id, 1)}
              disabled={isLast}
              aria-label={`Move ${dish.name} down`}
              title="Move down"
              className="grid size-8 place-items-center rounded-lg border border-fg/10 text-fg/55 transition-colors duration-200 hover:border-gold/45 hover:text-gold-light disabled:pointer-events-none disabled:opacity-25"
            >
              <ArrowDown aria-hidden className="size-3.5" strokeWidth={1.8} />
            </button>
          </div>

          <Link
            href={`/admin/dishes/${dish.id}`}
            className="inline-flex h-[4.25rem] items-center gap-2 rounded-xl border border-gold/35 bg-gold/[0.08] px-4 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-gold-light transition-colors duration-300 hover:border-gold/70 hover:bg-gold/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          >
            <PencilLine aria-hidden className="size-3.5" strokeWidth={1.8} />
            Edit
          </Link>
        </div>
      </div>
    </li>
  );
}, sameRow);
