import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { nav } from "../src/data/nav.ts";

/**
 * Regression: MegaMenu keyed each card by `item.href` alone. Both Angel dining
 * rooms point at /angel, so React saw two children with the key "/angel" and
 * warned they may be duplicated or omitted. A destination is not an identity.
 *
 * The panels are assembled in Header.tsx from data modules that use
 * extensionless relative imports, which bare Node cannot resolve, so the card
 * data itself is asserted at source level rather than by importing it.
 */

const read = (p: string) => readFileSync(new URL(p, import.meta.url), "utf8");
const megaMenu = read("../src/components/layout/MegaMenu.tsx");
const header = read("../src/components/layout/Header.tsx");
const restaurant = read("../src/data/restaurant.ts");

test("MegaMenu does not key cards by href alone", () => {
  assert.ok(
    !/key=\{item\.href\}/.test(megaMenu),
    "MegaMenu must not use the bare href as a React key — cards can share a destination",
  );
  assert.match(
    megaMenu,
    /key=\{`\$\{item\.href\}::\$\{item\.name\}`\}/,
    "MegaMenu should key cards by href and name together",
  );
});

test("the Angel panel still gives every location the same href", () => {
  // This is the condition that made href-only keys collide. If it ever changes,
  // the test above is still correct but this comment should be revisited.
  const angelPanel = header.slice(header.indexOf('key: "/angel"'), header.indexOf('key: "/experiences"'));
  assert.match(angelPanel, /restaurant\.locations\.map/, "Angel cards come from restaurant.locations");
  assert.match(angelPanel, /href: "\/angel"/, "every Angel card points at /angel");
});

test("Angel locations have distinct names, which is what makes the key unique", () => {
  const names = [...restaurant.matchAll(/name: "([^"]+)",\s*\n\s*kind:/g)].map((m) => m[1]);
  assert.ok(names.length >= 2, `expected at least two locations, found ${names.length}`);
  assert.equal(
    new Set(names).size,
    names.length,
    `location names must stay distinct or the keys collide again: ${JSON.stringify(names)}`,
  );
});

test("nav items have unique hrefs, so keying them by href stays safe", () => {
  // Footer, HeaderClient and MobileMenu key on item.href. That is only sound
  // while nav hrefs are unique, so assert the invariant they depend on.
  const hrefs = nav.map((item) => item.href);
  assert.equal(new Set(hrefs).size, hrefs.length, `duplicate nav hrefs: ${JSON.stringify(hrefs)}`);
});
