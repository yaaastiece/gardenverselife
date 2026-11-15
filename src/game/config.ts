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
// Painted panorama: radius, arc (radians), cropped image aspect, bottom height, vMin = image row of painted railing.
export const BACKDROP = { radius: 20, aspect: 1920 / 960, bottom: -1.2, vMin: 0.44, seam: 0.06, repeat: 2, fill: "#121420" };
// Sky dome colors: horizon matches the painted dusk, zenith matches the image top.
export const SKY = { horizon: "#5a3c4a", zenith: "#121420", haze: "#8a6a7c" };
// How far the player may turn: keep the image edges out of view.
export const LOOK = { yaw: Infinity, polarMin: 0.9, polarMax: 2.25, fov: 55 };
export const EYE_HEIGHT = 1.6;
// Xion, the welcoming fairy: fairy-sized (~30 cm), hovering beside the seedling planter.
export const XION = {
  position: [-0.25, 0.98, -0.85] as [number, number, number],
  height: 0.48, hover: 0.98, bobAmount: 0.025, bobSpeed: 1.4,
  bubbleMs: 6000, fadeMs: 1000,
  welcome: "Welcome to the Gardenverse. Here's your first seedling. Water it and watch it grow.",
};
