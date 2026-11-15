import { beforeEach, describe, expect, it } from "vitest";
import { PLANTLETS, _resetPlantletCache, chosenPlantlet, choosePlantlet, named, plantName } from "./plantlets";
import { companionLayout } from "./companion";

beforeEach(() => { window.localStorage.clear(); _resetPlantletCache(); });
describe("plantlets", () => {
  it("has no choice until the player picks, then remembers it", () => {
    expect(chosenPlantlet()).toBeNull();
    choosePlantlet("lumibud");
    _resetPlantletCache();
    expect(chosenPlantlet()).toBe("lumibud");
    expect(plantName()).toBe("Lumibud");
  });
  it("swaps the plant person's name in story copy", () => {
    choosePlantlet("lumibud");
    expect(named("Pepper Peony is thirsty.")).toBe("Lumibud is thirsty.");
    choosePlantlet("pepper");
    expect(named("Pepper Peony is thirsty.")).toBe("Pepper Peony is thirsty.");
  });
  it("Lumibud grows through 4 stages using its 3 images, reusing the flower crown at Queen", () => {
    expect(PLANTLETS.lumibud.art).toEqual([0, 1, 2, 2]);
    expect(PLANTLETS.lumibud.heights[3]).toBeGreaterThan(PLANTLETS.lumibud.heights[2]!);
  });
  it("layout keeps feet at the planter for the chosen plantlet", () => {
    choosePlantlet("lumibud");
    const l = companionLayout(1);
    const f = PLANTLETS.lumibud.frames[1]!;
    expect(l.y - l.h / 2 + (1 - f.bottom) * l.h).toBeCloseTo(0, 5);
  });
});
