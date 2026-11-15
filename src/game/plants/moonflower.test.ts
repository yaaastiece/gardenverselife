import { describe, expect, it } from "vitest";
import { createMoonQuest, MOON_TASKS, moonVisual } from "./moonflower";

describe("moonflower quest", () => {
  it("runs discover → trellis → water → night → bloom, teaching each step", () => {
    const q = createMoonQuest();
    const seen = [q.state.step];
    for (let i = 0; i < 4; i++) { const lesson = MOON_TASKS[q.state.step].lesson; expect(q.advance()).toBe(lesson); seen.push(q.state.step); }
    expect(seen).toEqual(["discover", "trellis", "water", "night", "bloom"]);
  });
  it("only blooms after night falls, and restarts after bloom", () => {
    expect(moonVisual("night").bloom).toBe(0);
    expect(moonVisual("bloom").bloom).toBe(1);
    const q = createMoonQuest();
    for (let i = 0; i < 5; i++) q.advance();
    expect(q.state.step).toBe("discover");
  });
});
