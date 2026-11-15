import { describe, it, expect } from "vitest";
import { createJournal } from "./journal";
import { createXionChat, ERRORS } from "./chat";

const snap = { stage: "Sprout", water: 51.4, sun: 70, soil: 33 };
describe("journal", () => {
  it("stamps entries with plant, stage, snapshot and time, newest first", () => {
    const j = createJournal(null);
    j.add({ plant: "tomato", text: "first" }, snap, 1000);
    j.add({ plant: "rose", text: "second", tags: ["Pests"] }, snap, 2000);
    expect(j.list().map((e) => e.text)).toEqual(["second", "first"]);
    expect(j.list("tomato")[0]).toMatchObject({ plant: "tomato", stage: "Sprout", water: 51, sun: 70, soil: 33, at: 1000 });
  });
  it("deletes entries and works when storage throws", () => {
    const bad = { getItem: () => { throw new Error("x"); }, setItem: () => { throw new Error("x"); } } as unknown as Storage;
    const j = createJournal(bad);
    const e = j.add({ plant: "herb", text: "note" }, snap)!;
    expect(j.list()).toHaveLength(1);
    j.remove(e.id);
    expect(j.list()).toHaveLength(0);
  });
  it("returns the last 3 notes for a plant", () => {
    const j = createJournal(null);
    for (let i = 0; i < 5; i++) j.add({ plant: "pepper", text: `n${i}` }, snap, i);
    expect(j.lastNotes("pepper").map((e) => e.text)).toEqual(["n4", "n3", "n2"]);
  });
});
describe("chat", () => {
  it("shows a polite message when rate limited", async () => {
    const c = createXionChat(async () => ({ ok: false, reason: "rate" }));
    const r = await c.send("hi", "");
    expect(r?.text).toBe(ERRORS.rate);
    expect(c.state.thinking).toBe(false);
  });
});
