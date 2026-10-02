/**
 * The rules for the contact form's phone number, shared by the form (which
 * filters keystrokes) and the server schema (which has the final say, since a
 * request can skip the browser entirely).
 *
 * A number may hold digits and the separators people write between them —
 * spaces, dashes, dots and brackets — with one optional leading "+". It needs
 * 7 to 15 digits: 15 is the longest an international (E.164) number can be,
 * and 7 is the shortest local number worth calling back. Letters are refused,
 * which also rules out vanity numbers such as 1-800-FLOWERS.
 *
 * Kept free of Zod so the contact form can import it without shipping Zod to
 * the browser.
 */

export const PHONE_MIN_DIGITS = 7;
export const PHONE_MAX_DIGITS = 15;
/** Room for the longest number with generous separators, and no more. */
export const PHONE_MAX_LENGTH = 25;

export const PHONE_ERROR = "Please enter a phone number using digits only, for example +1 718 555 0123.";

const ALLOWED = /^\+?[\d\s().-]+$/;

/**
 * What the phone field keeps as the guest types or pastes: every character
 * that cannot be part of a phone number is dropped, along with any spaces
 * before the number, and a "+" survives only as the first character.
 */
export function cleanPhoneInput(value: string): string {
  const kept = value.replace(/[^\d\s().+-]/g, "").trimStart();
  const body = kept.replace(/\+/g, "").trimStart();
  return (kept.startsWith("+") ? "+" + body : body).slice(0, PHONE_MAX_LENGTH);
}

/** True when `value` is a phone number the restaurant could call back. */
export function isValidPhone(value: string): boolean {
  if (value.length > PHONE_MAX_LENGTH || !ALLOWED.test(value)) return false;
  const digits = value.replace(/\D/g, "").length;
  return digits >= PHONE_MIN_DIGITS && digits <= PHONE_MAX_DIGITS;
}
