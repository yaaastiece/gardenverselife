import type * as THREE from "three";

// Where each controller's pink beam is in the world (set by VRRig, read by the tap pointer).
export const beamObjects = new Map<XRInputSource, THREE.Object3D>();
if (import.meta.env.DEV) Object.assign(window, { __beams: beamObjects });
