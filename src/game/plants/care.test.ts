import { describe, it, expect } from "vitest";
import { createCompanionCareStates, createPlantCare, status } from "./care";
import { PLANTLETS } from "./plantlets";
describe("plant care", () => {
  it("starts all bars at 70", () => { const c = createPlantCare(); expect([c.state.water, c.state.sun, c.state.soil]).toEqual([70, 70, 70]); });
  it("water drifts fastest, soil slowest", () => { const c = createPlantCare(); c.tick(10); expect(c.state.water).toBeLessThan(c.state.sun); expect(c.state.sun).toBeLessThan(c.state.soil); });
  it("shows a visible drop within a minute", () => { const c = createPlantCare(); c.tick(60); expect(c.state.water).toBeLessThanOrEqual(45); });
  it("overwatering above 90 lowers soil and warns", () => { const c = createPlantCare(); const got: string[] = []; c.onAlert((k) => got.push(k)); c.act("water"); expect(c.state.soil).toBe(65); expect(got).toContain("tooWet"); });
  it("does not grow unless all bars are above 40", () => { const c = createPlantCare(); c.state.sun = 35; for (let i = 0; i < 5; i++) { c.state.sun = 35; c.act("soil"); } expect(c.state.stage).toBe(0); });
  it("reaches the next stage in about 3 care actions", () => { const c = createPlantCare(); c.act("soil"); c.act("sun"); expect(c.state.stage).toBe(1); });
  it("repeats a low alert at most once per 30 s", () => { const c = createPlantCare(); const got: string[] = []; c.onAlert((k) => got.push(k)); c.state.water = 20; c.tick(1); c.tick(10); expect(got.filter((k) => k === "water")).toHaveLength(1); c.state.water = 20; c.tick(25); expect(got.filter((k) => k === "water")).toHaveLength(2); });
  it("status words", () => { const c = createPlantCare(); expect(status(c.state)).toBe("Thriving"); c.state.sun = 20; expect(status(c.state)).toBe("Struggling"); });
  it("Lumibud's Sun drifts at half speed and Water 30 percent faster than Pepper Peony", () => {
    const pepper = createPlantCare(PLANTLETS.pepper), lumibud = createPlantCare(PLANTLETS.lumibud);
    pepper.tick(10); lumibud.tick(10);
    expect(70 - lumibud.state.sun).toBeCloseTo((70 - pepper.state.sun) * 0.5, 8);
    expect(70 - lumibud.state.water).toBeCloseTo((70 - pepper.state.water) * 1.3, 8);
  });
  it("keeps separate care progress and resets only the current companion", () => {
    const states = createCompanionCareStates();
    states.lumibud.act("soil"); states.lumibud.act("sun"); states.lumibud.tick(10);
    expect(states.lumibud.state.stage).toBe(1);
    expect(states.lumibud.state.water).toBeCloseTo(63.5, 8);
    expect(states.pepper.state.stage).toBe(0);
    expect(states.pepper.state.water).toBe(70);
    states.lumibud.reset();
    expect(states.lumibud.state).toMatchObject({ stage: 0, points: 0, water: 70, sun: 70, soil: 70, time: 0 });
    states.lumibud.act("soil"); states.lumibud.act("sun");
    expect(states.lumibud.state.stage).toBe(1);
    expect(states.pepper.state.stage).toBe(0);
  });
});
