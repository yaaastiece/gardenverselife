import { describe, it, expect } from "vitest";
import { createPlantCare, status } from "./care";
describe("plant care", () => {
  it("starts all bars at 70", () => { const c = createPlantCare(); expect([c.state.water, c.state.sun, c.state.soil]).toEqual([70, 70, 70]); });
  it("water drifts fastest, soil slowest", () => { const c = createPlantCare(); c.tick(10); expect(c.state.water).toBeLessThan(c.state.sun); expect(c.state.sun).toBeLessThan(c.state.soil); });
  it("shows a visible drop within a minute", () => { const c = createPlantCare(); c.tick(60); expect(c.state.water).toBeLessThanOrEqual(45); });
  it("overwatering above 90 lowers soil and warns", () => { const c = createPlantCare(); const got: string[] = []; c.onAlert((k) => got.push(k)); c.act("water"); expect(c.state.soil).toBe(65); expect(got).toContain("tooWet"); });
  it("does not grow unless all bars are above 40", () => { const c = createPlantCare(); c.state.sun = 35; for (let i = 0; i < 5; i++) { c.state.sun = 35; c.act("soil"); } expect(c.state.stage).toBe(0); });
  it("reaches the next stage in about 3 care actions", () => { const c = createPlantCare(); c.act("soil"); c.act("sun"); expect(c.state.stage).toBe(1); });
  it("repeats a low alert at most once per 30 s", () => { const c = createPlantCare(); const got: string[] = []; c.onAlert((k) => got.push(k)); c.state.water = 20; c.tick(1); c.tick(10); expect(got.filter((k) => k === "water")).toHaveLength(1); c.state.water = 20; c.tick(25); expect(got.filter((k) => k === "water")).toHaveLength(2); });
  it("status words", () => { const c = createPlantCare(); expect(status(c.state)).toBe("Thriving"); c.state.sun = 20; expect(status(c.state)).toBe("Struggling"); });
});
