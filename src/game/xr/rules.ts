// Hardware-independent VR settings and handoff rules.
export const VR = {
  referenceSpace: "local-floor",
  requiredFeatures: ["local-floor"],
  optionalFeatures: ["hand-tracking"],
  pixelRatio: 1,
  frameRate: 72,
  snapDegrees: 30,
  snapEngage: 0.65,
  snapRelease: 0.25,
  dragMeters: 0.02,
  minTarget: 0.03,
  buttonHeight: 0.075,
  origin: [0, 0, 0.2] as [number, number, number],
};
export function snapStep(axis: number, latched: boolean, enabled: boolean) {
  if (!enabled || Math.abs(axis) < VR.snapRelease) return { latched: false, radians: 0 };
  if (latched || Math.abs(axis) < VR.snapEngage) return { latched, radians: 0 };
  return { latched: true, radians: -Math.sign(axis) * VR.snapDegrees * Math.PI / 180 };
}
export function createCinematicGate(play: (stage: number) => void) {
  let pending: number | null = null;
  return {
    get pending() { return pending; },
    advance(stage: number, inVR: boolean) {
      if (inVR) pending = Math.max(pending ?? stage, stage);
      else play(stage);
    },
    flush() { const stage = pending; pending = null; if (stage !== null) play(stage); },
  };
}