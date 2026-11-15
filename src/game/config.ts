// Palette + feel constants. City stays monochrome + pink/green neon; garden is the only full-color area.
export const PALETTE = {
  ink: "#0b0a0d",
  wallLight: "#cfccd2",
  wallMid: "#9a97a0",
  wallDark: "#5d5a63",
  pink: "#ff5fb8",
  pinkSoft: "#ffb3d9",
  green: "#5dff8f",
  skyTop: "#0d0612",
  skyMid: "#3a1d34",
  skyHorizon: "#d8879f",
  moon: "#fff3f8",
  wood: "#8a7f78",
};
export const WIND = { strength: 0.06, speed: 1.3 };
export const CARS = { count: 4, minCross: 15, maxCross: 25, gap: 4, minY: 6.5, maxY: 11 };
// One image: height uses its full original aspect before cropping below the painted railing.
export const BACKDROP = { radius: 20, arc: 150 * Math.PI / 180, aspect: 1920 / 1072, bottom: -1.2, vMin: 0.42, edgeFade: 0.09, fill: "#0d0a10" };
// Sky dome colors: horizon matches the painted dusk, zenith matches the image top.
export const SKY = { horizon: "#d8879f", zenith: "#0d0a10", haze: "#8a6a7c" };
// Permit a five-degree sky margin beyond either image edge, accounting for viewport FOV.
export const LOOK = { margin: 5 * Math.PI / 180, polarMin: 0.9, polarMax: 2.25, fov: 55, maxDpr: 2 };
export function lookYawLimit(width: number, height: number, inXR = false) {
  if (inXR) return Infinity;
  const horizontalHalfFov = Math.atan(Math.tan(LOOK.fov * Math.PI / 360) * width / Math.max(1, height));
  return Math.max(0, BACKDROP.arc / 2 + LOOK.margin - horizontalHalfFov);
}
export function backdropHeight() {
  return BACKDROP.radius * BACKDROP.arc / BACKDROP.aspect * (1 - BACKDROP.vMin);
}
export const EYE_HEIGHT = 1.6;
// Xion, the welcoming fairy: fairy-sized (~30 cm), hovering beside the seedling planter.
export const XION = {
  position: [-0.25, 0.98, -0.85] as [number, number, number],
  height: 0.48, hover: 0.98, bobAmount: 0.025, bobSpeed: 1.4,
  bubbleMs: 6000, fadeMs: 1000,
  welcome: "Welcome to the Gardenverse. Here's your first seedling. Water it and watch it grow.",
};
