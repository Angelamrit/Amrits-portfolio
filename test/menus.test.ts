import { strict as assert } from "node:assert";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, beforeEach, describe, it } from "node:test";

/**
 * The menus the chef runs from the dashboard: adding one, hiding it, putting
 * it on the home page, reordering, deleting and resetting — and the one rule
 * that keeps the menus page from ever being empty.
 */
const dataDir = mkdtempSync(join(tmpdir(), "menus-test-"));
process.env.DATA_DIR = dataDir;

const menus = await import("@/lib/content/menus");
const { store } = await import("@/lib/store");
const { menus: shipped } = await import("@/data/menus");

type Form = import("@/lib/content/menus").MenuForm;
const form = (overrides: Partial<Form> = {}): Form => ({
  name: "Sunday Lunch",
  courseLabel: "3 Courses",
  venue: "At Angel",
  intro: "Three courses for Sunday.",
  notes: ["Served 12 to 3."],
  featured: false,
  visible: true,
  imageKey: "foodNaanBiryani",
  courses: [
    { title: "Start", dishId: shipped[0].courses[0].dishId, status: "confirmed" },
    { title: "Soup", name: "Chef's soup", status: "draft" },
  ],
  ...overrides,
});

describe("the dashboard's menus", () => {
  beforeEach(async () => {
    await store.deleteDoc("menus");
  });
  after(() => rmSync(dataDir, { recursive: true, force: true }));

  it("starts as the menus written in the code", async () => {
    assert.deepEqual((await menus.getMenus()).map((menu) => menu.slug), shipped.map((menu) => menu.slug));
  });

  it("adds a menu with a readable web address, at the end", async () => {
    const slug = await menus.createMenu(form());
    assert.equal(slug, "sunday-lunch");
    const list = await menus.getMenus();
    assert.equal(list.at(-1)?.slug, slug);
    assert.equal(list.at(-1)?.courseCount, 2, "the course count is derived from the courses");
    assert.equal(await menus.menuExists(slug), true);
  });

  it("gives a second menu with the same name its own address", async () => {
    await menus.createMenu(form());
    assert.equal(await menus.createMenu(form()), "sunday-lunch-2");
  });

  it("makes an address from a name with no letters it can use", async () => {
    assert.equal(await menus.createMenu(form({ name: "!!! ***" })), "menu");
  });

  it("puts a menu on the home page only when asked", async () => {
    const slug = await menus.createMenu(form({ featured: false }));
    assert.ok(!(await menus.getFeaturedMenus()).some((menu) => menu.slug === slug));
    await menus.setMenuFeatured(slug, true);
    assert.ok((await menus.getFeaturedMenus()).some((menu) => menu.slug === slug));
  });

  it("never lets the last menu on the website be hidden or deleted", async () => {
    const only = shipped[0].slug;
    await assert.rejects(menus.setMenuHidden(only, true), menus.LastMenuError);
    assert.ok((await menus.getMenus()).some((menu) => menu.slug === only), "it stays on the website");

    const extra = await menus.createMenu(form());
    await menus.setMenuHidden(only, true);
    assert.deepEqual((await menus.getMenus()).map((menu) => menu.slug), [extra]);
    await assert.rejects(menus.deleteMenu(extra), menus.LastMenuError);
    await assert.rejects(menus.saveMenu(extra, form({ visible: false })), menus.LastMenuError);
  });

  it("reorders the menus", async () => {
    const extra = await menus.createMenu(form());
    await menus.setMenuOrder([extra, shipped[0].slug]);
    assert.equal((await menus.getMenus())[0].slug, extra);
  });

  it("stores only the fields of a code menu that changed, and a reset removes them", async () => {
    const menu = (await menus.getMenuForAdmin(shipped[0].slug))!;
    await menus.saveMenu(menu.slug, {
      name: menu.name,
      courseLabel: menu.courseLabel,
      venue: menu.venue,
      intro: "A new introduction.",
      notes: menu.notes,
      featured: menu.featured,
      visible: true,
      imageKey: menu.imageKey,
      courses: menu.courses as Form["courses"],
    });
    const doc = (await store.readDoc<{ patches: Record<string, Record<string, unknown>> }>("menus"))!;
    assert.deepEqual(Object.keys(doc.patches[menu.slug]), ["intro"]);

    await menus.resetMenu(menu.slug);
    assert.equal((await menus.getMenuForAdmin(menu.slug))?.intro, shipped[0].intro);
  });

  it("changes a code menu's cover photograph by key", async () => {
    const menu = (await menus.getMenuForAdmin(shipped[0].slug))!;
    await menus.saveMenu(menu.slug, { ...form(), name: menu.name, imageKey: "angelDiningRoom" });
    assert.match((await menus.getMenuBySlug(menu.slug))!.image.src, /angel/i);
  });

  it("deletes menus the chef added, never the ones in the code", async () => {
    const slug = await menus.createMenu(form());
    assert.equal(await menus.deleteMenu(slug), true);
    assert.equal(await menus.menuExists(slug), false);
    assert.equal(await menus.deleteMenu(shipped[0].slug), false);
  });

  it("refuses addresses that were never issued", async () => {
    assert.equal(await menus.menuExists("../secret"), false);
    assert.equal(await menus.menuExists("no-such-menu"), false);
  });
});
