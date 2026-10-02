import { strict as assert } from "node:assert";
import { describe, it } from "node:test";

/**
 * The password set in the dashboard, and what it does to the one on the
 * server.
 *
 * Each of these is a way the feature could be wrong without looking wrong: the
 * old password still opening the dashboard after a change, a phone that was
 * signed in before the change staying signed in, a forgotten password with no
 * way back, or a storage outage quietly turning into "anyone may enter". They
 * run against the real manager with an in-memory stand-in for the store.
 */

// A placeholder so the modules can load; the real hash is set just below.
process.env.ADMIN_PASSWORD_HASH = "scrypt:16384:8:1:c2FsdHNhbHRzYWx0c2E:aGFzaGhhc2hoYXNoaGFzaA";

const { hashPassword } = await import("@/lib/admin/password");
const { CREDENTIAL_DOC, ENV_CREDENTIAL_ID, createCredentialManager, sessionIsCurrent } = await import(
  "@/lib/admin/credential"
);
const { issueSession, readSession } = await import("@/lib/admin/session");
type CredentialDocs = import("@/lib/admin/credential").CredentialDocs;

const FIRST = "first-password-from-the-server";
const SECOND = "a-new-one-chosen-in-the-dashboard";
const THIRD = "and-then-changed-once-more";

process.env.ADMIN_PASSWORD_HASH = await hashPassword(FIRST);

/** The two store calls the manager uses, over a Map, with a count of writes. */
function memoryDocs() {
  const docs = new Map<string, unknown>();
  const api: CredentialDocs & { docs: Map<string, unknown>; writes: number } = {
    docs,
    writes: 0,
    async readDoc<T>(name: string) {
      return docs.has(name) ? (structuredClone(docs.get(name)) as T) : null;
    },
    async writeDoc<T>(name: string, value: T) {
      api.writes += 1;
      docs.set(name, structuredClone(value));
    },
  };
  return api;
}

describe("the dashboard password", () => {
  it("is the server's until one is set in the dashboard", async () => {
    const manager = createCredentialManager(memoryDocs());
    const active = await manager.active();
    assert.equal(active?.source, "environment");
    assert.equal(active?.id, ENV_CREDENTIAL_ID);
    assert.equal(await active!.verify(FIRST), true);
    assert.equal(await active!.verify(SECOND), false);
  });

  it("will not change without the current password", async () => {
    const docs = memoryDocs();
    const manager = createCredentialManager(docs);
    assert.deepEqual(await manager.change({ current: "not the password", next: SECOND }), {
      ok: false,
      reason: "wrong-current",
    });
    assert.equal(docs.writes, 0, "nothing may be written on a refused change");
    assert.equal(await (await manager.active())!.verify(FIRST), true, "the old password still works");
  });

  it("refuses a new password that is too short, or the same as the old one", async () => {
    const docs = memoryDocs();
    const manager = createCredentialManager(docs);
    assert.deepEqual(await manager.change({ current: FIRST, next: "short" }), { ok: false, reason: "too-short" });
    assert.deepEqual(await manager.change({ current: FIRST, next: FIRST }), { ok: false, reason: "unchanged" });
    assert.equal(docs.writes, 0);
  });

  it("once changed, replaces the server's password entirely", async () => {
    const docs = memoryDocs();
    const manager = createCredentialManager(docs);
    const outcome = await manager.change({ current: FIRST, next: SECOND, now: 1_750_000_000_000 });
    assert.equal(outcome.ok, true);

    const active = await manager.active();
    assert.equal(active?.source, "dashboard");
    assert.equal(active?.changedAt, 1_750_000_000_000);
    assert.equal(await active!.verify(SECOND), true, "the new password opens the dashboard");
    assert.equal(await active!.verify(FIRST), false, "the server's password no longer does");

    const stored = docs.docs.get(CREDENTIAL_DOC) as { hash: string };
    assert.ok(!stored.hash.includes(SECOND), "the password itself is never stored");
  });

  it("signs out the sessions issued before the change, and keeps the one issued after", async () => {
    const manager = createCredentialManager(memoryDocs());

    const before = await readSession(await issueSession(ENV_CREDENTIAL_ID));
    assert.ok(before);
    assert.equal(sessionIsCurrent(before, await manager.active()), true);

    const changed = await manager.change({ current: FIRST, next: SECOND });
    assert.ok(changed.ok);
    const active = await manager.active();
    assert.equal(sessionIsCurrent(before, active), false, "a session from before the change is refused");

    const after = await readSession(await issueSession(changed.id));
    assert.ok(after);
    assert.equal(sessionIsCurrent(after, active), true, "the session issued with the change is kept");

    // And a second change retires the first dashboard password's sessions too.
    const again = await manager.change({ current: SECOND, next: THIRD });
    assert.ok(again.ok);
    assert.notEqual(again.id, changed.id);
    assert.equal(sessionIsCurrent(after, await manager.active()), false);
  });

  it("is set aside when a new password is put on the server", async () => {
    const docs = memoryDocs();
    const manager = createCredentialManager(docs);
    assert.ok((await manager.change({ current: FIRST, next: SECOND })).ok);

    const previous = process.env.ADMIN_PASSWORD_HASH;
    try {
      // The operator has reset the password: a new hash on the server, redeployed.
      process.env.ADMIN_PASSWORD_HASH = await hashPassword(THIRD);
      const active = await manager.active();
      assert.equal(active?.source, "environment");
      assert.equal(await active!.verify(THIRD), true, "the new server password wins");
      assert.equal(await active!.verify(SECOND), false, "the forgotten dashboard password is gone");
      // A fresh change from here replaces the stale document rather than reviving it.
      assert.ok((await manager.change({ current: THIRD, next: SECOND })).ok);
      assert.equal((await manager.active())?.source, "dashboard");
    } finally {
      process.env.ADMIN_PASSWORD_HASH = previous;
    }
  });

  it("ignores a stored credential it does not understand rather than trusting it", async () => {
    const docs = memoryDocs();
    for (const junk of [{ v: 1, id: "x" }, "scrypt:…", { v: 2, id: "x", hash: "h", changedAt: 1, replaces: "r" }, { v: 1, id: ENV_CREDENTIAL_ID, hash: "h", changedAt: 1, replaces: "r" }]) {
      docs.docs.set(CREDENTIAL_DOC, junk);
      const active = await createCredentialManager(docs).active();
      assert.equal(active?.source, "environment", `${JSON.stringify(junk)} must not be used`);
    }
  });

  it("fails closed when storage cannot be read", async () => {
    const manager = createCredentialManager({
      async readDoc() {
        throw new Error("Redis is away");
      },
      async writeDoc() {},
    });
    assert.equal(await manager.active(), null, "an unknown answer is not a pass");
    const claims = await readSession(await issueSession(ENV_CREDENTIAL_ID));
    assert.equal(sessionIsCurrent(claims!, null), false);
    assert.deepEqual(await manager.change({ current: FIRST, next: SECOND }), { ok: false, reason: "not-configured" });
  });

  it("does nothing when no password is configured on the server at all", async () => {
    const hash = process.env.ADMIN_PASSWORD_HASH;
    const plain = process.env.ADMIN_PASSWORD;
    try {
      delete process.env.ADMIN_PASSWORD_HASH;
      delete process.env.ADMIN_PASSWORD;
      const docs = memoryDocs();
      const manager = createCredentialManager(docs);
      assert.equal(await manager.active(), null);
      assert.deepEqual(await manager.change({ current: "", next: SECOND }), { ok: false, reason: "not-configured" });
      assert.equal(docs.writes, 0);
    } finally {
      process.env.ADMIN_PASSWORD_HASH = hash;
      if (plain !== undefined) process.env.ADMIN_PASSWORD = plain;
    }
  });
});
