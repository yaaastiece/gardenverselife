// Plain TS growth rules so more plants can be added without touching the scene.
export type Stage = { name: string; height: number; leaves: number; leafSize: number };
export const SEEDLING_STAGES: Stage[] = [
  { name: "Seedling", height: 0.12, leaves: 2, leafSize: 0.05 },
  { name: "Sprout", height: 0.28, leaves: 4, leafSize: 0.08 },
  { name: "Young plant", height: 0.5, leaves: 8, leafSize: 0.11 },
];
export function nextStage(current: number, total = SEEDLING_STAGES.length): number {
  return Math.min(current + 1, total - 1);
}
