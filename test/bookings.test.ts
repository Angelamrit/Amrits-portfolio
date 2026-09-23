import { strict as assert } from "node:assert";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, describe, it } from "node:test";

/**
 * The booking store against a real filesystem.
 *
 * Node runs each test file in its own process, so pointing DATA_DIR at a
 * throwaway directory before the first import keeps these writes out of the
 * project's own `.data` entirely.
 */
const dir = mkdtempSync(join(tmpdir(), "chef-bookings-"));
process.env.DATA_DIR = join(dir, "data");
after(() => rmSync(dir, { recursive: true, force: true }));

const bookings = await import("@/lib/bookings/bookings");

const details = {
  name: "Priya Sharma",
  email: "priya@example.com",
  phone: "+1 555 0101",
  eventDate: "2099-06-14",
  location: "Upper West Side",
  guests: 12,
  experience: "private-dining" as const,
  budget: "5k-10k" as const,
  dietary: "Two vegan guests",
  message: "An anniversary dinner at home.",
};

describe("bookings", () => {
  it("keeps every booking when many arrive at the same moment", async () => {
    // The race this store exists to prevent: twenty guests pressing submit in
    // the same instant. A read-then-write would keep only some of them.
    const created = await Promise.all(
      Array.from({ length: 20 }, (_, i) => bookings.createManualBooking({ ...details, name: `Guest ${i}` }, "new")),
    );
    const all = await bookings.listBookings();
    for (const booking of created) {
      assert.ok(all.some((stored) => stored.id === booking.id), `${booking.name} was lost`);
    }
    assert.equal(new Set(created.map((booking) => booking.ref)).size, created.length, "references must be unique");
  });

  it("gives every booking a reference that can be read aloud", async () => {
    const booking = await bookings.createManualBooking(details, "new");
    assert.match(booking.ref, /^APS-[2346789ACDEFGHJKMNPQRTUVWXYZ]{5}$/);
  });

  it("records every change of status, in order", async () => {
    const booking = await bookings.createManualBooking(details, "new");
    await bookings.setStatus(booking.id, "contacted");
    await bookings.setStatus(booking.id, "confirmed");
    // Choosing the status it already has is not a new event.
    await bookings.setStatus(booking.id, "confirmed");

    const stored = await bookings.getBooking(booking.id);
    assert.deepEqual(
      stored?.history.map((event) => event.status),
      ["new", "contacted", "confirmed"],
    );
    assert.equal(stored?.status, "confirmed");
  });

  it("keeps private notes and lets them be removed", async () => {
    const booking = await bookings.createManualBooking(details, "new", "Called on Tuesday");
    await bookings.addNote(booking.id, "Wants the tasting menu");

    let stored = await bookings.getBooking(booking.id);
    assert.deepEqual(
      stored?.notes.map((note) => note.text),
      ["Called on Tuesday", "Wants the tasting menu"],
    );

    await bookings.removeNote(booking.id, stored!.notes[0].id);
    stored = await bookings.getBooking(booking.id);
    assert.deepEqual(
      stored?.notes.map((note) => note.text),
      ["Wants the tasting menu"],
    );
  });

  it("stores cleared optional fields as absent rather than as empty text", async () => {
    const booking = await bookings.createManualBooking(details, "new");
    await bookings.updateDetails(booking.id, { ...details, email: "", phone: "", budget: "", guests: 6 });
    const stored = await bookings.getBooking(booking.id);
    assert.equal(stored?.email, undefined);
    assert.equal(stored?.phone, undefined);
    assert.equal(stored?.budget, undefined);
    assert.equal(stored?.guests, 6);
  });

  it("reports an unknown booking rather than pretending to update it", async () => {
    assert.equal(await bookings.setStatus("bk-does-not-exist", "confirmed"), false);
    assert.equal(await bookings.deleteBooking("bk-does-not-exist"), false);
  });

  it("deletes a booking for good", async () => {
    const booking = await bookings.createManualBooking(details, "new");
    assert.equal(await bookings.deleteBooking(booking.id), true);
    assert.equal(await bookings.getBooking(booking.id), undefined);
  });

  it("summarises what needs attention", () => {
    const now = Date.parse("2099-06-01T15:00:00Z");
    const base = {
      ...details,
      ref: "APS-XXXXX",
      source: "manual" as const,
      emailed: false,
      notes: [],
      history: [],
      createdAt: now,
      updatedAt: now,
    };
    const summary = bookings.summarise(
      [
        { ...base, id: "a", status: "new" },
        { ...base, id: "b", status: "new" },
        { ...base, id: "c", status: "confirmed", eventDate: "2099-06-20", guests: 10 },
        { ...base, id: "d", status: "confirmed", eventDate: "2099-06-10", guests: 4 },
        // Already happened, so not "upcoming".
        { ...base, id: "e", status: "confirmed", eventDate: "2099-05-01", guests: 50 },
      ],
      now,
    );
    assert.equal(summary.awaitingReply, 2);
    assert.equal(summary.upcomingConfirmed, 2);
    assert.equal(summary.guestsConfirmedUpcoming, 14);
    assert.equal(summary.nextEvent?.id, "d");
  });
});
