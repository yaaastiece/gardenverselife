import { describe, expect, it } from "vitest";
import { BACKDROP, LOOK, backdropHeight, lookYawLimit } from "./config";

describe("360 skyline ring", () => {
  it("wraps a full circle while the front painting keeps its 150-degree span", () => {
    expect(BACKDROP.arc).toBeCloseTo(2 * Math.PI);
    expect(BACKDROP.frontArc / BACKDROP.arc).toBeCloseTo(1920 / 4608);
    expect(BACKDROP.radius * BACKDROP.arc / (backdropHeight() / (1 - BACKDROP.vMin))).toBeCloseTo(4608 / 768);
  });
  it.each([[1280, 1800], [390, 844]])("does not limit turning at %ix%i", (w, h) => {
    expect(lookYawLimit(w, h)).toBe(Infinity);
  });
  it("allows mobile rendering up to pixel ratio two", () => {
    expect(LOOK.maxDpr).toBe(2);
  });
  it("allows looking almost directly overhead without the orbit pole singularity", () => {
    expect(LOOK.polarMin).toBe(0.08);
    expect(LOOK.polarMin).toBeGreaterThan(0);
    expect(LOOK.polarMax).toBe(2.25);
  });
});
