import { describe, it, expect } from "vitest";
import { createBedCare, bedStatus, BEDS } from "./beds";

describe("garden beds", () => {
  it("start between 65 and 80 and differ per bed", () => {
    const c = createBedCare();
    c.beds.forEach((b) => [b.water, b.sun, b.soil].forEach((v) => { expect(v).toBeGreaterThanOrEqual(65); expect(v).toBeLessThanOrEqual(80); }));
    expect(new Set(c.beds.map((b) => `${b.water}-${b.sun}-${b.soil}`)).size).toBe(4);
  });
  it("stay above 30 for at least 4 minutes untouched", () => {
    const c = createBedCare();
    for (let i = 0; i < 240; i++) c.tick(1);
    c.beds.forEach((b) => expect(Math.min(b.water, b.sun, b.soil)).toBeGreaterThan(30));
  });
  it("overwatering above 90 lowers soil", () => {
    const c = createBedCare(); const soil = c.beds[0]!.soil;
    c.act(0, "water");
    expect(c.beds[0]!.water).toBeGreaterThan(90);
    expect(c.beds[0]!.soil).toBe(soil - BEDS.overwaterSoilLoss);
    expect(bedStatus(c.beds[0]!)).toBe("Struggling");
  });
  it("alerts at most once every 30 seconds per bed", () => {
    const c = createBedCare(); const got: string[] = [];
    c.onAlert((a) => { if (a.bed === 0) got.push(a.text); });
    c.beds[0]!.water = 20; c.tick(0.1); c.tick(10);
    expect(got).toEqual(["The tomato bed is thirsty. Water deeply at the base."]);
    c.beds[0]!.water = 20; c.tick(25);
    expect(got.length).toBe(2);
  });
});
