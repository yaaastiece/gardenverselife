import { describe, expect, it, vi } from "vitest";
import { VR, createCinematicGate, snapStep } from "./rules";
describe("Quest rules", () => {
  it("requires floor tracking and makes hand tracking optional", () => {
    expect(VR.requiredFeatures).toEqual(["local-floor"]); expect(VR.optionalFeatures).toEqual(["hand-tracking"]);
    expect(VR.origin[1]).toBe(0);
  });
  it("turns exactly 30 degrees once per stick deflection", () => {
    const turn = snapStep(0.8, false, true); expect(turn.radians).toBeCloseTo(-30 * Math.PI / 180);
    expect(snapStep(0.9, turn.latched, true).radians).toBe(0);
    expect(snapStep(0, true, true).latched).toBe(false);
    expect(snapStep(-0.8, false, true).radians).toBeCloseTo(30 * Math.PI / 180);
  });
  it("does not turn when disabled or when the stick rests", () => {
    expect(snapStep(1, false, false).radians).toBe(0); expect(snapStep(0.1, false, true).radians).toBe(0);
  });
  it("has targets larger than three centimeters and VR ratio one", () => {
    expect(VR.buttonHeight).toBeGreaterThanOrEqual(0.03); expect(VR.pixelRatio).toBe(1); expect(VR.frameRate).toBe(72);
  });
  it("defers all VR stage changes until exit, keeping the latest stage", () => {
    const play = vi.fn(); const gate = createCinematicGate(play);
    gate.advance(1, true); gate.advance(2, true); expect(play).not.toHaveBeenCalled(); expect(gate.pending).toBe(2);
    gate.flush(); expect(play).toHaveBeenCalledExactlyOnceWith(2); expect(gate.pending).toBeNull();
    gate.flush(); expect(play).toHaveBeenCalledTimes(1);
  });
  it("keeps normal cinematic triggers immediate", () => {
    const play = vi.fn(); createCinematicGate(play).advance(1, false); expect(play).toHaveBeenCalledWith(1);
  });
});