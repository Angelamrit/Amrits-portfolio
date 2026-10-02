import { strict as assert } from "node:assert";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, beforeEach, describe, it } from "node:test";

/**
 * The dish list the chef runs from the dashboard: adding, hiding, deleting,
 * reordering and resetting dishes. Every one of these writes the same small
 * document, and a mistake here is invisible until a guest sees the wrong
 * menu — so the rules are pinned down against a real store in a throwaway
 * folder.
 */
const dataDir = mkdtempSync(join(tmpdir(), "dishes-test-"));
process.env.DATA_DIR = dataDir;

const dishes = await import("@/lib/content/dishes");
const { store } = await import("@/lib/store");
const { dishes: shipped } = await import("@/data/dishes");

const form = (overrides: Partial<import("@/lib/content/dishes").DishForm> = {}) => ({
  name: "Paneer Tikka",
  tagline: "From the tandoor",
  description: "Charred paneer.",
  tags: ["vegetarian" as const],
  signature: true,
  visible: true,
  imageKey: "foodDalNaan",
  ...overrides,
});

describe("the dashboard's dish list", () => {
  beforeEach(async () => {
    await store.deleteDoc("dishes");
  });
  after(() => rmSync(dataDir, { recursive: true, force: true }));

  it("starts as the dishes written in the code, in their order", async () => {
    const list = await dishes.getDishes();
    assert.deepEqual(
      list.map((dish) => dish.id),
      [...shipped].sort((a, b) => a.order - b.order).map((dish) => dish.id),
    );
  });

  it("adds a dish at the end of the list, on the website and in the showcase", async () => {
    const id = await dishes.createDish(form());
    assert.match(id, /^d-[a-f0-9]{10}$/);

    const list = await dishes.getDishes();
    assert.equal(list.at(-1)?.id, id);
    assert.equal(list.at(-1)?.order, shipped.length + 1);
    assert.ok((await dishes.getSignatureDishes()).some((dish) => dish.id === id));
    assert.equal(await dishes.dishExists(id), true);
  });

  it("a dish added as hidden is kept, but not on the website", async () => {
    const id = await dishes.createDish(form({ visible: false }));
    assert.ok(!(await dishes.getDishes()).some((dish) => dish.id === id));
    assert.equal((await dishes.getDishForAdmin(id))?.hidden, true);
  });

  it("stores only the fields that differ from the code, and keeps a moved dish in its place when saved", async () => {
    const first = shipped.find((dish) => dish.order === 1)!;
    const second = shipped.find((dish) => dish.order === 2)!;

    // Move the second dish to the top, then save a new description for it.
    const ids = (await dishes.getDishesForAdmin()).map((dish) => dish.id);
    await dishes.setDishOrder([second.id, first.id, ...ids.filter((id) => id !== first.id && id !== second.id)]);

    const current = (await dishes.getDishForAdmin(second.id))!;
    await dishes.saveDish(second.id, form({
      name: current.name,
      tagline: current.tagline,
      description: "A new description.",
      tags: current.tags,
      signature: current.signature,
      imageKey: current.imageKey,
    }));

    const doc = (await store.readDoc<{ patches: Record<string, Record<string, unknown>> }>("dishes"))!;
    assert.deepEqual(Object.keys(doc.patches[second.id]).sort(), ["description", "order"]);
    assert.equal((await dishes.getDishes())[0].id, second.id, "saving must not send the dish back to its old place");
  });

  it("putting the order back as the code has it leaves no order behind", async () => {
    const original = (await dishes.getDishesForAdmin()).map((dish) => dish.id);
    await dishes.setDishOrder([...original].reverse());
    await dishes.setDishOrder(original);
    const doc = await store.readDoc<{ patches: Record<string, unknown> }>("dishes");
    assert.deepEqual(doc?.patches ?? {}, {});
  });

  it("hides and shows a dish without losing it", async () => {
    const id = shipped[0].id;
    await dishes.setDishHidden(id, true);
    assert.ok(!(await dishes.getDishes()).some((dish) => dish.id === id));
    assert.ok((await dishes.getDishesForAdmin()).some((dish) => dish.id === id && dish.hidden));
    await dishes.setDishHidden(id, false);
    assert.ok((await dishes.getDishes()).some((dish) => dish.id === id));
  });

  it("switching a code dish out of the showcase and back leaves no edit behind", async () => {
    const id = shipped[0].id;
    await dishes.setDishSignature(id, false);
    assert.ok(!(await dishes.getSignatureDishes()).some((dish) => dish.id === id));
    await dishes.setDishSignature(id, true);
    assert.equal((await dishes.getDishForAdmin(id))?.edited, false);
  });

  it("deletes dishes the chef added, but never the ones in the code", async () => {
    const id = await dishes.createDish(form());
    assert.equal(await dishes.deleteDish(id), true);
    assert.equal(await dishes.dishExists(id), false);
    assert.equal(await dishes.deleteDish(shipped[0].id), false);
    assert.equal(await dishes.dishExists(shipped[0].id), true);
  });

  it("reset puts a code dish back — words, place and visibility", async () => {
    const id = shipped[0].id;
    const current = (await dishes.getDishForAdmin(id))!;
    await dishes.saveDish(id, form({ name: "Something else", imageKey: current.imageKey, visible: false }));
    await dishes.resetDish(id);
    const back = (await dishes.getDishForAdmin(id))!;
    assert.equal(back.name, shipped[0].name);
    assert.equal(back.hidden, false);
    assert.equal(back.edited, false);
  });

  it("refuses to save a dish that does not exist, and ids that were never issued", async () => {
    assert.equal(await dishes.saveDish("d-0000000000", form()), false);
    assert.equal(await dishes.dishExists("../../etc/passwd"), false);
    assert.equal(await dishes.dishExists("d-zzzz"), false);
  });

  it("knows which photographs exist", async () => {
    assert.equal(await dishes.isKnownImageKey("foodDalNaan"), true);
    assert.equal(await dishes.isKnownImageKey("noSuchPicture"), false);
    assert.equal(await dishes.isKnownImageKey("up-0000000000000000"), false);
  });
});
