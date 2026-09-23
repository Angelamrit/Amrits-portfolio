/**
 * The whole surface the dashboard needs from persistent storage.
 *
 * Everything above this line — the analytics roll-ups, the menu editor, the
 * photo uploads — talks to this interface and nothing else. That is deliberate.
 * Hosting for this site is not settled yet, and the two plausible answers need
 * completely different storage: a Node server with a disk can keep all of this
 * in plain files, while a serverless platform has a read-only filesystem that
 * is wiped between requests and would silently lose every visit and every edit.
 *
 * So the rule is: no module outside `src/lib/store` may import `node:fs`.
 * Moving this site onto Vercel later means writing one more file next to
 * `fs-store.ts` and changing the single line in `index.ts` that picks the
 * adapter. Nothing else in the application has to know.
 *
 * Three kinds of data, because they have genuinely different access patterns:
 *
 *   docs    — small JSON records read on nearly every page render and written
 *             rarely (the menu overrides, the restaurant details). Reads must
 *             be cheap; writes must be atomic, because a half-written menu
 *             would take the public site down.
 *   events  — append-only analytics lines, written once per visit and never
 *             modified. Partitioned by day so a roll-up reads only the range
 *             it needs and old data can be dropped by deleting whole days.
 *   blobs   — uploaded photography. Bytes in, URL-safe key out.
 */

export type StoredBlob = {
  key: string;
  bytes: Uint8Array;
  contentType: string;
};

export type BlobInfo = {
  key: string;
  size: number;
  contentType: string;
  uploadedAt: number;
};

export interface Store {
  /** The adapter's name, shown on the dashboard's system panel. */
  readonly kind: string;

  /** Where it is writing, when that is a thing a person can look at — a path, a database name. */
  readonly location?: string;

  /**
   * Whether writes made through this adapter are expected to survive a
   * restart. False on an ephemeral filesystem, which the dashboard surfaces as
   * a warning rather than pretending the data is safe.
   */
  readonly durable: boolean;

  /** `null` when the document has never been written. Never throws on absence. */
  readDoc<T>(name: string): Promise<T | null>;

  /** Replaces the document atomically: a reader sees the old value or the new one. */
  writeDoc<T>(name: string, value: T): Promise<void>;

  /**
   * Read-modify-write as one step.
   *
   * `readDoc` followed by `writeDoc` is two steps, and anything that can run
   * twice at once — two guests submitting the booking form in the same second —
   * will read the same old value and one write will silently erase the other.
   * This runs `change` against the current value inside the same serialised
   * slot as the write, so concurrent updates queue rather than race. Returns
   * what was written.
   */
  updateDoc<T>(name: string, change: (current: T | null) => T): Promise<T>;

  deleteDoc(name: string): Promise<void>;

  /** `day` is an ISO date, `YYYY-MM-DD`, in UTC. */
  appendEvent(day: string, line: string): Promise<void>;

  /** One string per line, in the order they were appended. `[]` when the day has no data. */
  readEvents(day: string): Promise<string[]>;

  /** Every day that holds events, ascending. */
  listEventDays(): Promise<string[]>;

  /** Drops whole days older than `day`. Returns how many days were removed. */
  pruneEventsBefore(day: string): Promise<number>;

  putBlob(blob: StoredBlob): Promise<void>;
  readBlob(key: string): Promise<StoredBlob | null>;
  listBlobs(): Promise<BlobInfo[]>;
  deleteBlob(key: string): Promise<void>;
}
