import { describe, it, expect } from "vitest";
import { createGardenHelper, report, HELP, type Patient } from "./helper";
import { createPlantCare } from "../plants/care";

const pt = (id: string, label: string, water: number, sun: number, soil: number): Patient => ({ id, label, stats: { water, sun, soil }, tooWet: water > 90, perch: { x: 0, y: 1, z: 0 }, fx: { x: 0, y: 1, z: 0 } });
describe("Xion helps", () => {
  it("names needy plants and their problem, neediest first", () => {
    const r = report([pt("a", "tomatoes", 20, 70, 70), pt("b", "roses", 70, 35, 70), pt("c", "peppers", 70, 70, 70)]);
    expect(r.text).toBe("The tomatoes are thirsty and the roses want more light. The peppers look happy. Want me to help?");
    expect(r.needs.map((n) => n.patient.id)).toEqual(["a", "b"]);
  });
  it("says all is well with a tip when healthy", () => {
    expect(report([pt("a", "tomatoes", 70, 70, 70)]).text).toMatch(/^Everything is thriving! Tip:/);
  });
  it("helps up to 3 plants, then cools down for 45 seconds", () => {
    let pos = { x: 0, y: 1, z: 0 }; const fixed: string[] = [];
    const h = createGardenHelper({ move: (p) => { pos = p; }, position: () => pos, say: () => {}, fix: (n) => fixed.push(n.patient.id), onState: () => {} });
    h.setOffer(report(["a", "b", "c", "d"].map((id, i) => pt(id, id, 10 + i, 70, 70))).needs);
    expect(h.start()).toBe(true);
    for (let i = 0; i < 200; i++) h.tick(0.1);
    expect(fixed).toEqual(["a", "b", "c"]);
    h.setOffer(report([pt("a", "a", 10, 70, 70)]).needs);
    expect(h.start()).toBe(false);
    for (let i = 0; i < 260; i++) h.tick(0.1);
    expect(h.start()).toBe(true);
    expect(HELP.cooldown).toBe(45);
  });
  it("raises a low bar to about 60 and earns no growth points", () => {
    const c = createPlantCare(); c.state.water = 20;
    c.assist("water", HELP.target);
    expect(c.state.water).toBe(60);
    expect(c.state.points).toBe(0);
  });
});
