#!/usr/bin/env node
/**
 * Turns a password into the value of ADMIN_PASSWORD_HASH.
 *
 *   npm run admin:password            prompts, with the typing hidden
 *   npm run admin:password -- "…"     takes it as an argument
 *
 * A deliberate duplicate of the scrypt parameters in
 * `src/lib/admin/password.ts`: this has to run with plain `node`, before the
 * app is built and without TypeScript, so it cannot import them. The format it
 * prints is self-describing (`scrypt:N:r:p:salt:hash`), so the two only have to
 * agree on the algorithm, not on the cost — the server reads N, r and p back
 * out of the string. Colons and base64url, never `$`: a `$` in a .env value is
 * read as a variable reference and silently eaten.
 */
import { randomBytes, scrypt } from "node:crypto";
import { createInterface } from "node:readline";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);

const N = 2 ** 15;
const R = 8;
const P = 1;
const KEYLEN = 32;
const MAXMEM = 64 * 1024 * 1024;

/** Reads a line without echoing it, so the password does not stay in the scrollback. */
function askHidden(question) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    const output = rl.output;
    let muted = false;

    output.write(question);
    // `_writeToOutput` is readline's own hook for exactly this; without it the
    // password is echoed to the terminal as it is typed.
    rl._writeToOutput = (text) => {
      if (!muted) output.write(text);
    };
    muted = true;

    rl.question("", (answer) => {
      muted = false;
      output.write("\n");
      rl.close();
      resolve(answer);
    });
  });
}

const fromArgs = process.argv.slice(2).join(" ").trim();
const password = fromArgs || (await askHidden("New dashboard password: ")).trim();

if (password.length < 10) {
  console.error("\n  The password must be at least 10 characters. Nothing was generated.\n");
  process.exit(1);
}

const salt = randomBytes(16);
const derived = await scryptAsync(password.normalize("NFKC"), salt, KEYLEN, { N, r: R, p: P, maxmem: MAXMEM });
const encoded = ["scrypt", N, R, P, salt.toString("base64url"), derived.toString("base64url")].join(":");

console.log(`
  Add this line to .env.local (development) or to the server's environment:

  ADMIN_PASSWORD_HASH=${encoded}

  The password itself is not stored anywhere. Keep it somewhere safe —
  generating a new hash is the only way back in if it is lost.
`);
