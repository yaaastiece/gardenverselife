import { describe, it, expect } from "vitest";
import { nextStage, SEEDLING_STAGES } from "./growth";
describe("seedling growth", () => {
  it("has three stages", () => expect(SEEDLING_STAGES.map((s) => s.name)).toEqual(["Seedling", "Sprout", "Young plant"]));
  it("watering advances one stage", () => expect(nextStage(0)).toBe(1));
  it("stops at young plant", () => expect(nextStage(2)).toBe(2));
});
