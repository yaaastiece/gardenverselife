import { describe, expect, it } from "vitest";
import { companionLayout, COMPANION, GLOW } from "./companion";
describe("plant companion", () => {
  it("seedling figure is 0.35 tall and queen 0.9", () => {
    const f0 = COMPANION.frames[0]!, f3 = COMPANION.frames[3]!;
    expect(companionLayout(0).h * (f0.bottom - f0.top)).toBeCloseTo(0.35);
    expect(companionLayout(3).h * (f3.bottom - f3.top)).toBeCloseTo(0.9);
  });
  it("glow is brightest when thriving and nearly off when struggling", () => {
    expect(GLOW.Thriving).toBeGreaterThan(GLOW.Okay);
    expect(GLOW.Struggling).toBeLessThan(0.1);
  });
  it("struggling sits 3 percent lower", () => expect(COMPANION.struggleDrop).toBe(0.97));
});
