import { describe, expect, it } from "vitest";
import { CARE_TARGETS, createXionInteraction, floatingPosition, isDrag, nearestPlant, speechPhase, WELCOME } from "./interaction";

describe("Xion interactions", () => {
  it("keeps the welcome visible for six seconds before fading", () => {
    const interaction = createXionInteraction({ x: 0, y: 1, z: -1 });
    expect(interaction.state.speech?.text).toBe(WELCOME);
    expect(speechPhase(5999)).toBe("show");
    expect(speechPhase(6000)).toBe("fade");
    expect(speechPhase(7000)).toBe("gone");
  });
  it("distinguishes a tap from mouse or touch dragging", () => {
    expect(isDrag({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(false);
    expect(isDrag({ x: 0, y: 0 }, { x: 6, y: 0 })).toBe(true);
  });
  it("retains the floating release position", () => {
    const i = createXionInteraction({ x: 0, y: 1, z: -1 });
    i.begin(); i.move({ x: -2.6, y: 1.2, z: -1.5 }); i.release(true);
    expect(i.state.position).toEqual({ x: -2.6, y: 1.2, z: -1.5 });
    expect(i.state.dragging).toBe(false);
    expect(i.state.focused).toBe(false);
  });
  for (const kind of ["tomato", "herb", "rose", "seedling"] as const) {
    it(`selects the ${kind} care tip near that plant`, () => {
      const target = CARE_TARGETS.find((t) => t.kind === kind);
      if (!target) throw new Error("Missing care target");
      expect(nearestPlant(target.position)).toBe(kind);
      const i = createXionInteraction(target.position);
      i.release(true);
      expect(i.state.speech?.text).toContain({ tomato: "6 to 8 hours", herb: "top inch", rose: "good airflow", seedling: "rot the roots" }[kind]);
    });
  }
  it("returns from close-up on a second tap or empty-space dismissal", () => {
    const i = createXionInteraction({ x: 0, y: 1, z: -1 });
    i.release(false); expect(i.state.focused).toBe(true);
    i.release(false); expect(i.state.focused).toBe(false);
    i.release(false); i.dismiss(); expect(i.state.focused).toBe(false);
    expect(i.state.speech).toBeNull();
  });
  it("keeps Xion above the deck and inside the garden", () => {
    expect(floatingPosition({ x: 10, y: -2, z: -20 })).toEqual({ x: 3, y: 0.65, z: -3.5 });
  });
});