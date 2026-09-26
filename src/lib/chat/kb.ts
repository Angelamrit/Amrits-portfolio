import "server-only";
import { z } from "zod";
import raw from "./kb-data/Amrit_Chatbot_Knowledge_Base_Final_v1.8.json" with { type: "json" };

/**
 * Knowledge base loader and validator.
 *
 * The JSON in ./kb-data is the authoritative chatbot knowledge source, supplied
 * by the project owner. Nothing in this file rewrites, corrects or supplements
 * its content — it only validates the shape, drops the sections that must never
 * reach the model, and exposes the rest read-only.
 */

/**
 * Authoritative KB version, matched against the file's own `metadata.version`.
 *
 * History: the file as supplied was v1.7 but carried `"1.6"` in this field; the
 * project owner confirmed v1.7 and approved correcting it. v1.8 then records a
 * content revision — the `client-003` education fact dropped an unanchored
 * "later", which had been letting the assistant assert an order between the
 * move to Australia and the Rahi/Adda roles that no source supports.
 *
 * The equality check below is what stops a version mismatch shipping silently:
 * if the KB is ever replaced or revised without updating this constant, loading
 * throws rather than quietly serving unexpected content.
 */
export const KB_VERSION = "1.8";

const factSchema = z.object({
  id: z.string(),
  topic: z.string(),
  fact: z.string(),
  status: z.string(),
  sources: z.array(z.string()).optional(),
});

const menuItemSchema = z.object({
  name: z.string(),
  category: z.string(),
  description: z.string().optional().default(""),
  price_usd: z.string(),
  source_labels: z.array(z.string()).optional().default([]),
  source: z.string(),
  status: z.string(),
  price_status: z.string(),
});

const kbSchema = z
  .object({
    metadata: z
      .object({
        project: z.string(),
        version: z.string(),
        research_date: z.string(),
      })
      .loose(),
    answer_policy: z
      .object({
        source_precedence: z.array(z.string()),
        must_not_invent: z.array(z.string()),
        must_not_call_michelin_starred: z.literal(true),
        must_not_claim_unconfirmed_services: z.literal(true),
        must_distinguish_current_from_historical: z.literal(true),
        fallback: z.string(),
        accuracy_and_source_rules: z.string(),
        security_and_privacy_rules: z.record(z.string(), z.string()),
        response_style_rules: z.record(z.string(), z.string()),
        strict_relevance_and_input_rules: z.record(z.string(), z.string()),
        client_confirmed_source_rule: z.string(),
      })
      .loose(),
    facts: z.array(factSchema).min(1),
    pending_confirmation: z.array(z.string()),
    menu_snapshot: z
      .object({
        source: z.string(),
        status: z.string(),
        note: z.string(),
        dietary_label_note: z.string().optional(),
        items: z.array(menuItemSchema).min(1),
      })
      .loose(),
    sources: z.record(z.string(), z.string()),
    client_confirmed_brief: z
      .object({
        source_id: z.string(),
        status: z.string(),
        usage_rule: z.string(),
        confirmed_scope: z.array(z.string()),
      })
      .loose(),
    current_operational_update: z
      .object({
        effective_date: z.string(),
        status: z.string(),
        address: z.string(),
        phone: z.string(),
        email: z.string(),
        hours: z.record(z.string(), z.string()),
        source: z.string(),
      })
      .loose(),
    client_visibility_rule: z.string(),
    // Present in the file and deliberately NOT part of the loaded KB: the
    // archived v1.4 web menu overlaps the confirmed menu_snapshot and would let
    // the model blend two price sets. Validated as present, then dropped.
    archived_web_menu_snapshot_v1_4: z.unknown().optional(),
});

/**
 * The shape callers actually receive: the validated KB minus the archived menu.
 * Mapped over the schema's own shape rather than written as TypeScript's
 * `Omit<z.infer<...>>`, because the nested `.loose()` index signatures would
 * otherwise widen every known property to `unknown`.
 */
type KbShape = typeof kbSchema.shape;

export type KnowledgeBase = {
  [K in Exclude<keyof KbShape, "archived_web_menu_snapshot_v1_4">]: z.infer<KbShape[K]>;
};
export type KbFact = z.infer<typeof factSchema>;
export type KbMenuItem = z.infer<typeof menuItemSchema>;

export class KnowledgeBaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "KnowledgeBaseError";
  }
}

let cached: KnowledgeBase | null = null;

/**
 * Parses, validates and caches the knowledge base. Throws `KnowledgeBaseError`
 * on any shape or version problem so a malformed or unexpected KB fails loudly
 * instead of silently degrading answers.
 */
export function loadKnowledgeBase(): KnowledgeBase {
  if (cached) return cached;
  cached = parseKnowledgeBase(raw);
  return cached;
}

/**
 * The validation half of `loadKnowledgeBase`, separated so the guarantees can be
 * tested against a deliberately broken knowledge base.
 */
export function parseKnowledgeBase(input: unknown): KnowledgeBase {
  const parsed = kbSchema.safeParse(input);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .slice(0, 5)
      .map((i) => `${i.path.join(".") || "<root>"}: ${i.message}`)
      .join("; ");
    throw new KnowledgeBaseError(`Knowledge base failed validation — ${issues}`);
  }

  const kb = parsed.data;

  if (kb.metadata.version !== KB_VERSION) {
    throw new KnowledgeBaseError(
      `Knowledge base metadata.version is "${kb.metadata.version}" but this build expects ` +
        `"${KB_VERSION}". The KB file changed — re-verify its contents and update KB_VERSION ` +
        `in src/lib/chat/kb.ts.`,
    );
  }

  if (kb.menu_snapshot.items.some((item) => item.price_status !== "volatile")) {
    throw new KnowledgeBaseError("Every menu item must carry price_status \"volatile\".");
  }

  // Structurally drop the archived menu so it cannot reach the model.
  const { archived_web_menu_snapshot_v1_4: _archived, ...rest } = kb;
  void _archived;

  return rest;
}

/**
 * Memoised per knowledge base. The lexicon is a pure function of the KB, and
 * the route calls it on every request — rebuilding a set from 84 menu items and
 * 51 facts each time. Keyed by the KB object so a different one (a test fixture,
 * say) still gets its own lexicon.
 */
const lexiconCache = new WeakMap<KnowledgeBase, readonly string[]>();

/** In-scope vocabulary derived from the KB, used to widen the deterministic gate. */
export function buildScopeLexicon(kb: KnowledgeBase): readonly string[] {
  const cached = lexiconCache.get(kb);
  if (cached) return cached;

  const built = computeScopeLexicon(kb);
  lexiconCache.set(kb, built);
  return built;
}

function computeScopeLexicon(kb: KnowledgeBase): readonly string[] {
  const terms = new Set<string>();

  const add = (value: string) => {
    const t = value.trim().toLowerCase();
    if (t.length >= 4) terms.add(t);
  };

  for (const item of kb.menu_snapshot.items) {
    add(item.name);
    for (const word of item.name.toLowerCase().split(/[^\p{L}]+/u)) add(word);
    add(item.category);
  }
  for (const fact of kb.facts) add(fact.topic);

  return [...terms];
}
