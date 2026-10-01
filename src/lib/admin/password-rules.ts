/**
 * The one rule a dashboard password has to meet, in a module with no server
 * imports so the form can check it as the chef types and the server can check
 * it again on submit. `scripts/admin-password.mjs` repeats the minimum, because
 * it runs with plain `node` and cannot import TypeScript.
 */
export const MIN_PASSWORD_LENGTH = 10;

/** Well past anything a person types, and short enough that hashing it stays cheap. */
export const MAX_PASSWORD_LENGTH = 256;
