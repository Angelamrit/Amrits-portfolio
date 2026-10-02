import test from "node:test";
import assert from "node:assert/strict";
import { cleanPhoneInput, isValidPhone } from "@/lib/inquiry/phone";

test("the phone field drops letters and symbols as they are typed or pasted", () => {
  assert.equal(cleanPhoneInput("abc"), "");
  assert.equal(cleanPhoneInput("hello world"), "");
  assert.equal(cleanPhoneInput("555-CHEF"), "555-");
  assert.equal(cleanPhoneInput("+1 (718) 555-0123"), "+1 (718) 555-0123");
  assert.equal(cleanPhoneInput("phone: 718 555 0123!"), "718 555 0123");
});

test("a plus sign is kept only at the start", () => {
  assert.equal(cleanPhoneInput("+44+20"), "+4420");
  assert.equal(cleanPhoneInput("1+2"), "12");
});

test("a phone number needs 7 to 15 digits and no letters", () => {
  assert.equal(isValidPhone("+1 718 555 0123"), true);
  assert.equal(isValidPhone("555 0100"), true);
  assert.equal(isValidPhone("123456"), false);
  assert.equal(isValidPhone("1234567890123456"), false);
  assert.equal(isValidPhone("718 555 O123"), false);
  assert.equal(isValidPhone("1+718 555 0123"), false);
});
