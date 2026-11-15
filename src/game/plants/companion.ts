// Plant companion stage art: frame layout measured from the cut-outs (fractions of the 1920x1048 frame).
import type { status } from "./care";
import { currentPlantlet } from "./plantlets";
export type Condition = ReturnType<typeof status>;
export const COMPANION = {
  aspect: 1920 / 1048,
  heights: [0.35, 0.53, 0.72, 0.9],
  frames: [
    { top: 0.142, bottom: 0.917, cx: 0.495 },
    { top: 0.089, bottom: 0.917, cx: 0.49 },
    { top: 0.081, bottom: 0.916, cx: 0.49 },
    { top: 0.051, bottom: 0.915, cx: 0.473 },
  ],
  sink: 0.02, fadeSec: 0.8, struggleDrop: 0.97,
};
export const GLOW: Record<Condition, number> = { Thriving: 0.9, Okay: 0.45, Struggling: 0.05 };
export const SWAY_SPEED: Record<Condition, number> = { Thriving: 1, Okay: 1, Struggling: 0.45 };
/** Plane size and offset so the figure's visible height matches the stage height and its feet sit at y=0. */
export function companionLayout(stage: number) {
  const p = currentPlantlet();
  const f = p.frames[stage]!;
  const h = p.heights[stage]! / (f.bottom - f.top);
  const w = h * p.aspect;
  return { w, h, x: (0.5 - f.cx) * w, y: (f.bottom - 0.5) * h };
}
