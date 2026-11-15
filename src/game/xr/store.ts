import { createXRStore } from "@react-three/xr";
import { PALETTE } from "../config";
import { VR } from "./rules";

// Called by a lazy component initializer, never at module evaluation.
export function createGardenXRStore() {
  const cursorModel = { color: PALETTE.green, size: 0.018, opacity: 0.9 };
  const rayPointer = { rayModel: { color: PALETTE.pink, size: 0.002, maxLength: 5, opacity: 0.65 }, cursorModel };
  return createXRStore({
    emulate: false, offerSession: false, enterGrantedSession: false,
    customSessionInit: { requiredFeatures: [...VR.requiredFeatures], optionalFeatures: [...VR.optionalFeatures] },
    frameRate: (rates) => Array.from(rates).includes(VR.frameRate) ? VR.frameRate : Math.min(...Array.from(rates)), frameBufferScaling: 1, foveation: 1,
    controller: { rayPointer, grabPointer: { cursorModel }, teleportPointer: false },
    hand: { rayPointer, grabPointer: { cursorModel }, touchPointer: { cursorModel }, teleportPointer: false },
  });
}