// Plain TS plantlet choice: which plant person grows in the center planter, its art layout and story wording.
export type PlantletId = "pepper" | "lumibud";
export type Frame = { top: number; bottom: number; cx: number };
export type Plantlet = {
  id: PlantletId; name: string; blurb: string;
  aspect: number; heights: number[]; frames: Frame[];
  /** Index of the art image used for each of the 4 stages (Lumibud reuses its flower-crown art at Queen). */
  art: number[]; queenGlow: number;
  /** Story prompts for the Young and Queen stages (Seedling and Sprout are shared). */
  prompts: { young: string; queen: string };
};

export const PLANTLETS: Record<PlantletId, Plantlet> = {
  pepper: {
    id: "pepper", name: "Pepper Peony", blurb: "A moss-haired plant person who dreams of a peony crown.",
    aspect: 1920 / 1048, heights: [0.35, 0.53, 0.72, 0.9],
    frames: [{ top: 0.142, bottom: 0.917, cx: 0.495 }, { top: 0.089, bottom: 0.917, cx: 0.49 }, { top: 0.081, bottom: 0.916, cx: 0.49 }, { top: 0.051, bottom: 0.915, cx: 0.473 }],
    art: [0, 1, 2, 3], queenGlow: 1,
    prompts: {
      young: "A small plant person with a green moss afro and a pink bud flower in her hair stands up in the planter, her leaves lighting with thin pink neon veins.",
      queen: "The plant person grows into a graceful plant queen with long moss locs, a large glowing pink peony crown opens, soft pink light fills the garden, the camera tilts up to the moon.",
    },
  },
  lumibud: {
    id: "lumibud", name: "Lumibud", blurb: "A round little sprout creature with glowing teal leaf veins.",
    aspect: 1280 / 720, heights: [0.3, 0.45, 0.6, 0.72],
    frames: [{ top: 0.067, bottom: 0.922, cx: 0.498 }, { top: 0.04, bottom: 0.965, cx: 0.509 }, { top: 0.035, bottom: 0.997, cx: 0.503 }, { top: 0.035, bottom: 0.997, cx: 0.503 }],
    art: [0, 1, 2, 2], queenGlow: 1.6,
    prompts: {
      young: "A chubby round peach-green plant creature with big shiny eyes stands up in the planter, a crown of leaves with glowing teal veins and pink blossoms opens on its head, teal swirls glow on its belly.",
      queen: "The chubby plant creature glows brighter, its crown of teal-veined leaves and pink blossoms opens wide, glowing teal swirls light its body, soft teal and pink light fills the garden, the camera tilts up to the moon.",
    },
  },
};

const KEY = "gv-plantlet";
const isId = (v: unknown): v is PlantletId => v === "pepper" || v === "lumibud";
let chosen: PlantletId | null = null;
let loaded = false;
const subs = new Set<() => void>();

function storage(): Storage | null { try { return typeof window === "undefined" ? null : window.localStorage; } catch { return null; } }
/** Saved choice, or null when the player hasn't chosen yet. */
export function chosenPlantlet(): PlantletId | null {
  if (!loaded) { loaded = true; try { const v = storage()?.getItem(KEY); if (isId(v)) chosen = v; } catch { /* storage unavailable */ } }
  return chosen;
}
export function currentPlantlet(): Plantlet { return PLANTLETS[chosenPlantlet() ?? "pepper"]; }
export function plantName() { return currentPlantlet().name; }
export function choosePlantlet(id: PlantletId) {
  chosenPlantlet(); chosen = id;
  try { storage()?.setItem(KEY, id); } catch { /* storage unavailable */ }
  subs.forEach((f) => f());
}
export function onPlantletChange(f: () => void) { subs.add(f); return () => { subs.delete(f); }; }
/** Story and tip copy is written with Pepper Peony's name; swap in the chosen plantlet's. */
export function named(text: string) { return text.split("Pepper Peony").join(plantName()); }
/** Test hook: forget the cached choice so storage is re-read. */
export function _resetPlantletCache() { loaded = false; chosen = null; }
