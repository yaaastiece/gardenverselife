import { describe, expect, it } from "vitest";
import { BACKDROP, LOOK, backdropHeight, lookYawLimit } from "./config";

describe("single skyline projection", () => {
  it("covers 150 degrees with the original image proportions", () => {
    expect(BACKDROP.arc * 180 / Math.PI).toBeCloseTo(150);
    expect(BACKDROP.radius * BACKDROP.arc / (backdropHeight() / (1 - BACKDROP.vMin))).toBeCloseTo(1920 / 1072);
  });
  it.each([[1280, 1800], [1920, 1080], [390, 844]])("allows only a five-degree sky margin at %ix%i", (width, height) => {
    const halfFov = Math.atan(Math.tan(55 * Math.PI / 360) * width / height);
    expect((lookYawLimit(width, height) + halfFov) * 180 / Math.PI).toBeCloseTo(80);
  });
  it("does not limit XR head turns", () => {
    expect(lookYawLimit(390, 844, true)).toBe(Infinity);
  });
  it("allows mobile rendering up to pixel ratio two", () => {
    expect(LOOK.maxDpr).toBe(2);
  });
});