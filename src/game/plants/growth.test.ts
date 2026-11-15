import { describe, it, expect } from "vitest";
import { nextStage, SEEDLING_STAGES } from "./growth";
describe("seedling growth", () => {
  it("has four stages", () => expect(SEEDLING_STAGES.map((s) => s.name)).toEqual(["Seedling", "Sprout", "Young", "Queen"]));
  it("watering advances one stage", () => expect(nextStage(0)).toBe(1));
  it("stops at queen", () => expect(nextStage(3)).toBe(3));
});
