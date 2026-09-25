import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

/**
 * The parts of the dashboard where being wrong is not a visual bug.
 *
 * A session cookie that can be edited, a password comparison that can be
 * skipped, or an upload whose type is taken on trust are all failures that
 * look exactly like success from the outside. These are the checks that would
 * notice.
 *
 * The environment is set before the modules are imported, because the session
 * module reads its signing secret at call time from whatever is configured —
 * and "nothing is configured" is itself one of the cases worth pinning down.
 */
process.env.ADMIN_PASSWORD_HASH = "scrypt:16384:8:1:c2FsdHNhbHRzYWx0c2E:aGFzaGhhc2hoYXNoaGFzaA";

const { issueSession, readSession } = await import("@/lib/admin/session");
const { hashPassword, verifyPassword } = await import("@/lib/admin/password");
const { readImage } = await import("@/lib/content/image-size");
const { applyPatch } = await import("@/lib/content/overrides");

describe("admin sessions", () => {
  it("issues a token this server will accept back", async () => {
    const token = await issueSession();
    assert.ok(token, "a token should be issued when a credential is configured");
    const claims = await readSession(token);
    assert.equal(claims?.sub, "admin");
  });

  it("rejects a token whose claims have been edited", async () => {
    const token = (await issueSession())!;
    const [payload, signature] = token.split(".");

    const claims = JSON.parse(Buffer.from(payload, "base64url").toString());
    claims.exp += 60 * 60 * 24 * 365;
    const forged = Buffer.from(JSON.stringify(claims)).toString("base64url");

    assert.equal(await readSession(`${forged}.${signature}`), null);
  });

  it("rejects a token whose signature has been edited", async () => {
    const token = (await issueSession())!;
    const [payload, signature] = token.split(".");
    const flipped = `${signature.slice(0, -1)}${signature.slice(-1) === "A" ? "B" : "A"}`;
    assert.equal(await readSession(`${payload}.${flipped}`), null);
  });

  it("rejects an expired token even though it is genuinely signed", async () => {
    const thirteenHoursAgo = Date.now() - 13 * 60 * 60 * 1000;
    const token = (await issueSession(thirteenHoursAgo))!;
    assert.equal(await readSession(token), null);
  });

  it("rejects rubbish without throwing", async () => {
    for (const value of ["", "...", "a.b", "not-a-token", undefined, null]) {
      assert.equal(await readSession(value as string | undefined), null);
    }
  });

  it("stops accepting old tokens once the password changes", async () => {
    const token = (await issueSession())!;
    const previous = process.env.ADMIN_PASSWORD_HASH;
    try {
      // The signing key is derived from the credential, so changing it is the
      // lever for signing every open session out.
      process.env.ADMIN_PASSWORD_HASH = "scrypt:16384:8:1:b3RoZXJzYWx0b3RoZXI:b3RoZXJoYXNob3RoZXJoYXNo";
      assert.equal(await readSession(token), null);
    } finally {
      process.env.ADMIN_PASSWORD_HASH = previous;
    }
  });

  it("issues nothing when no credential is configured", async () => {
    const hash = process.env.ADMIN_PASSWORD_HASH;
    const plain = process.env.ADMIN_PASSWORD;
    try {
      delete process.env.ADMIN_PASSWORD_HASH;
      delete process.env.ADMIN_PASSWORD;
      assert.equal(await issueSession(), undefined);
    } finally {
      process.env.ADMIN_PASSWORD_HASH = hash;
      if (plain !== undefined) process.env.ADMIN_PASSWORD = plain;
    }
  });
});

describe("admin passwords", () => {
  it("round-trips a password through its stored hash", async () => {
    const previous = process.env.ADMIN_PASSWORD_HASH;
    try {
      process.env.ADMIN_PASSWORD_HASH = await hashPassword("a correct horse battery staple");
      assert.equal(await verifyPassword("a correct horse battery staple"), true);
      assert.equal(await verifyPassword("a correct horse battery stapl"), false);
      assert.equal(await verifyPassword(""), false);
    } finally {
      process.env.ADMIN_PASSWORD_HASH = previous;
    }
  });

  it("never writes the password into the hash", async () => {
    const encoded = await hashPassword("sourdough-and-saffron");
    assert.ok(!encoded.includes("sourdough"));
    // Colons and base64url only: a `$` here would be eaten by .env expansion.
    assert.match(encoded, /^scrypt:\d+:\d+:\d+:[A-Za-z0-9_-]+:[A-Za-z0-9_-]+$/);
  });

  it("produces a different hash every time, so two equal passwords do not look equal", async () => {
    const [a, b] = await Promise.all([hashPassword("same-password-twice"), hashPassword("same-password-twice")]);
    assert.notEqual(a, b);
  });

  it("refuses a hash that claims an absurd cost rather than trying to compute it", async () => {
    const previous = process.env.ADMIN_PASSWORD_HASH;
    try {
      process.env.ADMIN_PASSWORD_HASH = "scrypt:1073741824:1024:64:c2FsdA:aGFzaA";
      assert.equal(await verifyPassword("anything"), false);
    } finally {
      process.env.ADMIN_PASSWORD_HASH = previous;
    }
  });

  it("refuses a malformed hash rather than treating it as a match", async () => {
    const previous = process.env.ADMIN_PASSWORD_HASH;
    try {
      for (const bad of ["scrypt:not:a:hash", "bcrypt:1:2:3:4:5", "", "scrypt"]) {
        process.env.ADMIN_PASSWORD_HASH = bad;
        assert.equal(await verifyPassword("anything"), false, `"${bad}" must not verify`);
      }
    } finally {
      process.env.ADMIN_PASSWORD_HASH = previous;
    }
  });
});

describe("uploaded photographs", () => {
  const jpeg = new Uint8Array(readFileSync("public/images/placeholders/bar.jpg"));

  it("reads the real dimensions out of a JPEG's own header", () => {
    const read = readImage(jpeg);
    assert.equal(read?.type, "image/jpeg");
    assert.ok(read && read.dimensions.width > 0 && read.dimensions.height > 0);
  });

  it("decides the type from the bytes, not from a claimed name", () => {
    // The same file would be uploaded as "portrait.png" by a renamed copy; the
    // answer has to come from the header either way.
    assert.equal(readImage(jpeg)?.type, "image/jpeg");
  });

  it("refuses anything that is not one of the three accepted formats", () => {
    const notAnImage = new TextEncoder().encode("GIF89a" + "x".repeat(64));
    assert.equal(readImage(notAnImage), null);
    assert.equal(readImage(new Uint8Array(8)), null);
    assert.equal(readImage(new Uint8Array(0)), null);
  });

  it("refuses a JPEG signature with nothing behind it", () => {
    const truncated = new Uint8Array(40);
    truncated[0] = 0xff;
    truncated[1] = 0xd8;
    assert.equal(readImage(truncated), null);
  });
});

describe("content patches", () => {
  it("takes only the fields a patch actually carries", () => {
    const base = { name: "Chef's Tasting Menu", venue: "At Angel", featured: true };
    assert.deepEqual(applyPatch(base, { name: "Tasting Journey" }), {
      name: "Tasting Journey",
      venue: "At Angel",
      featured: true,
    });
  });

  it("treats undefined as 'not overridden' rather than as 'clear it'", () => {
    const base = { name: "House Specialties", venue: "At Angel" };
    assert.deepEqual(applyPatch(base, { venue: undefined }), base);
  });

  it("does allow a field to be cleared with an empty value of its own type", () => {
    const base = { caption: "At the pass", notes: ["Halal"] };
    assert.deepEqual(applyPatch(base, { caption: "", notes: [] }), { caption: "", notes: [] });
  });

  it("returns the base untouched when there is no patch at all", () => {
    const base = { name: "House Specialties" };
    assert.equal(applyPatch(base, undefined), base);
  });
});
