/**
 * The invisible proof-of-work behind the contact form.
 *
 * Shared by the browser and the server, so it imports nothing from either.
 *
 * The server hands the browser a signed challenge token. Before the form can
 * be sent, the browser has to find a counter such that SHA-256 of
 * `token:counter` starts with `bits` zero bits — on average `2^bits` hashes,
 * which a phone finishes in well under the time it takes to type a message,
 * and which costs the server exactly one hash to check. A guest never sees it.
 *
 * What it buys: a submission cannot be made by replaying an HTTP request. It
 * has to come from something that fetched a fresh challenge and burned CPU on
 * it, which rules out the form-spam bots that post straight at endpoints and
 * makes bulk submission from a headless browser a real cost per message. It is
 * not a CAPTCHA — a determined attacker aimed at this one site can implement
 * the loop — which is why the rate limits and the honeypot are still there.
 */

/**
 * Leading zero bits required. Each extra bit doubles the work: 13 is about
 * 8,000 hashes on average, under a second on a laptop and a few seconds on a
 * slow phone, and it runs while the guest is still typing. It was 15 at first,
 * which took a desktop Chrome close to four seconds and would have made a
 * guest who pastes a short message wait at the button.
 */
export const PROOF_BITS = 13;

/**
 * The shortest a genuine visit can be: how long the challenge must have been
 * issued for before the server will accept the form. Both sides use this — the
 * browser waits it out before submitting, so a real guest never trips it.
 */
export const CHALLENGE_MIN_AGE_MS = 3_000;

/** A decimal counter; 20 digits is past what any difficulty here could need. */
const SOLUTION_PATTERN = /^\d{1,20}$/;

const encoder = new TextEncoder();

function subtle(): SubtleCrypto {
  return globalThis.crypto.subtle;
}

/** Counts the zero bits at the start of a digest. */
export function leadingZeroBits(bytes: Uint8Array): number {
  let bits = 0;
  for (const byte of bytes) {
    if (byte !== 0) return bits + Math.clz32(byte) - 24;
    bits += 8;
  }
  return bits;
}

async function digest(token: string, counter: string): Promise<Uint8Array> {
  return new Uint8Array(await subtle().digest("SHA-256", encoder.encode(`${token}:${counter}`)));
}

/** One hash. The server's whole cost of checking a solution. */
export async function verifyProof(token: string, solution: string, bits: number): Promise<boolean> {
  if (!SOLUTION_PATTERN.test(solution)) return false;
  return leadingZeroBits(await digest(token, solution)) >= bits;
}

/**
 * The browser's search. Each hash is awaited, so the page stays responsive
 * while it runs, and it yields to the event loop outright every so often so
 * that typing never stutters on a slow device. `signal` stops it when the form
 * unmounts, otherwise a visitor who navigates away would leave it running.
 */
export async function solveProof(token: string, bits: number, signal?: AbortSignal): Promise<string> {
  for (let counter = 0; ; counter += 1) {
    if (signal?.aborted) throw new DOMException("Proof of work abandoned", "AbortError");
    if (counter % 256 === 255) await new Promise((resolve) => setTimeout(resolve, 0));

    const solution = String(counter);
    if (leadingZeroBits(await digest(token, solution)) >= bits) return solution;
  }
}
