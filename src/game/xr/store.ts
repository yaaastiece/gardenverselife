import { createXRStore } from "@react-three/xr";
import { VR } from "./rules";

// Called by a lazy component initializer, never at module evaluation.
export function createGardenXRStore() {
  return createXRStore({
    emulate: false, offerSession: false, enterGrantedSession: false,
    customSessionInit: { requiredFeatures: [...VR.requiredFeatures], optionalFeatures: [...VR.optionalFeatures] },
    frameRate: (rates) => Array.from(rates).includes(VR.frameRate) ? VR.frameRate : Math.min(...Array.from(rates)), frameBufferScaling: 1, foveation: 1,
    // Pointing and tapping is handled by our own TapPointer (xr/TapPointer.tsx), so the library pointers are off.
    controller: { rayPointer: false, grabPointer: false, teleportPointer: false },
    hand: { rayPointer: false, grabPointer: false, touchPointer: false, teleportPointer: false },
  });
}