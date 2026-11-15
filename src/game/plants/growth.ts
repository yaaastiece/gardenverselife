// Plain TS growth rules so more plants can be added without touching the scene.
import { currentPlantlet } from "./plantlets";
export type Stage = { name: string; height: number; leaves: number; leafSize: number };
export const SEEDLING_STAGES: Stage[] = [
  { name: "Seedling", height: 0.12, leaves: 2, leafSize: 0.05 },
  { name: "Sprout", height: 0.28, leaves: 4, leafSize: 0.08 },
  { name: "Young", height: 0.5, leaves: 8, leafSize: 0.11 },
  { name: "Queen", height: 0.7, leaves: 12, leafSize: 0.13 },
];
/** Shared growth geometry with the chosen companion's four data-driven stage names. */
export function companionStages(): Stage[] {
  const names = currentPlantlet().stageNames;
  return SEEDLING_STAGES.map((stage, index) => ({ ...stage, name: names[index] ?? stage.name }));
}
export function nextStage(current: number, total = SEEDLING_STAGES.length): number {
  return Math.min(current + 1, total - 1);
}
