/**
 * The pieces every storage adapter needs the same way, so the file store and
 * the cloud store cannot drift apart on what counts as a safe key or how
 * concurrent writes inside one server process are ordered.
 */

/**
 * Names arrive from route params and form fields, so they are never trusted to
 * stay inside the data directory. Only this alphabet is allowed, which rules
 * out `..`, absolute paths, NUL bytes and Windows drive letters in one check
 * rather than trying to spot each of them.
 */
export function safeName(name: string): string {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,127}$/.test(name) || name.includes("..")) {
    throw new Error(`Unsafe store key: ${JSON.stringify(name)}`);
  }
  return name;
}

/** Event partitions are UTC days, and nothing else may be used as one. */
export function safeDay(day: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) throw new Error(`Unsafe event day: ${JSON.stringify(day)}`);
  return day;
}

/**
 * Serialises work per key.
 *
 * Two admin tabs saving the same menu at the same moment, or two visits landing
 * in the same millisecond, would otherwise interleave a read-modify-write and
 * lose one of them. Chaining onto the previous promise for that key is enough
 * within one Node process. Across several processes it is not, which is why
 * the cloud store also checks each write against what it read.
 */
const queues = new Map<string, Promise<unknown>>();

export function serialise<T>(key: string, work: () => Promise<T>): Promise<T> {
  const previous = queues.get(key) ?? Promise.resolve();
  // `work` runs whether the previous write resolved or rejected: one failure
  // must not poison every later write to the same key. The swallowed copy is
  // what the next caller waits on, so the chain never carries a rejection.
  const next = previous.then(work, work);
  const settled = next.catch(() => {});
  queues.set(key, settled);
  // Drop the entry once nothing newer has queued behind it, so a long-lived
  // server does not keep one settled promise per key it has ever written.
  void settled.then(() => {
    if (queues.get(key) === settled) queues.delete(key);
  });
  return next;
}
