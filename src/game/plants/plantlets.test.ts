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
  it("swaps the plant person's name in shared care copy", () => {
    choosePlantlet("lumibud");
    expect(named("Pepper Peony is thirsty.")).toBe("Lumibud is thirsty.");
    choosePlantlet("pepper");
    expect(named("Pepper Peony is thirsty.")).toBe("Pepper Peony is thirsty.");
  });
  it("defines Pepper Peony's exact tagline, stages, four existing sprites and pink glow", () => {
    const pepper = PLANTLETS.pepper;
    expect(pepper.name).toBe("Pepper Peony");
    expect(pepper.tagline).toBe("A peony who dreams of the moon.");
    expect(pepper.stageNames).toEqual(["Seedling", "Sprout", "Young", "Queen"]);
    expect(pepper.sprites).toHaveLength(4);
    expect(pepper.sprites.every((url) => url.includes("companion_"))).toBe(true);
    expect(pepper.glowColor).toBe("#ff5fb8");
  });
  it("defines Lumibud with four scalable teal-orb placeholder stages", () => {
    const lumibud = PLANTLETS.lumibud;
    expect(lumibud.tagline).toBe("A little light that learned to grow.");
    expect(lumibud.stageNames).toEqual(["Glow Seed", "Sprout", "Leafling", "Bloom"]);
    expect(lumibud.sprites).toHaveLength(4);
    expect(new Set(lumibud.sprites).size).toBe(1);
    expect(lumibud.sprites[0]).toMatch(/^data:image\/svg\+xml/);
    expect(lumibud.glowColor).toBe("#8fffd2");
    expect([...lumibud.heights].sort((a, b) => a - b)).toEqual([...lumibud.heights]);
  });
  it("uses Lumibud's exact shade-care note", () => {
    expect(PLANTLETS.lumibud.careProfile.likes).toBe("Likes soft light and evenly moist soil, like many shade-loving plants and ferns.");
  });
  it("layout keeps feet at the planter for the chosen plantlet", () => {
    choosePlantlet("lumibud");
    const l = companionLayout(1);
    const f = PLANTLETS.lumibud.frames[1]!;
    expect(l.y - l.h / 2 + (1 - f.bottom) * l.h).toBeCloseTo(0, 5);
  });
});
