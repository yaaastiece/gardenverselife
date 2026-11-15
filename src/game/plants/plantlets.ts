// Plain TS companion catalog: choice, art, care, stage names and Orbis lore live here,
// independently of the screen, 3D scene or a future WebXR chooser.
import pepperSeedling from "@/assets/companion_1_seedling.png.asset.json";
import pepperSprout from "@/assets/companion_2_sprout.png.asset.json";
import pepperYoung from "@/assets/companion_3_young.png.asset.json";
import pepperQueen from "@/assets/companion_4_queen.png.asset.json";
import lumibudSprout from "@/assets/lumibud_sprout.png.asset.json";
import lumibudLeafling from "@/assets/lumibud_leafling.png.asset.json";
import lumibudBloom from "@/assets/lumibud_bloom.png.asset.json";

export type PlantletId = "pepper" | "lumibud";
export type Frame = { top: number; bottom: number; cx: number };
export type Four<T> = readonly [T, T, T, T];
export type StoryBeat = { narration: string; prompt: string };
export type CareProfile = {
  drift: { water: number; sun: number; soil: number };
  likes: string;
};
export type Plantlet = {
  id: PlantletId;
  name: string;
  tagline: string;
  stageNames: Four<string>;
  sprites: Four<string>;
  glowColor: string;
  careProfile: CareProfile;
  story: Four<StoryBeat>;
  stageNotes: Four<string>;
  /** Billboard measurements; change these with the art, without touching scene code. */
  aspect: number;
  heights: Four<number>;
  frames: Four<Frame>;
  queenGlow: number;
  burstColor: string;
  /** Which stage image the start-screen card shows. */
  cardStage: 0 | 1 | 2 | 3;
};

// Lumibud's Glow Seed has no artwork yet: a glowing teal orb with a first sprout peeking out.
const LUMIBUD_ORB = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
    <defs>
      <radialGradient id="halo"><stop offset="0" stop-color="#8fffd2" stop-opacity=".8"/><stop offset=".55" stop-color="#8fffd2" stop-opacity=".25"/><stop offset="1" stop-color="#8fffd2" stop-opacity="0"/></radialGradient>
      <radialGradient id="orb" cx="35%" cy="28%"><stop offset="0" stop-color="#e4fff5"/><stop offset=".35" stop-color="#a8ffdc"/><stop offset="1" stop-color="#42c99b"/></radialGradient>
    </defs>
    <circle cx="256" cy="256" r="240" fill="url(#halo)"/>
    <circle cx="256" cy="256" r="126" fill="url(#orb)" stroke="#173f38" stroke-width="10"/>
    <path d="M256 132 C256 110 256 96 256 84" stroke="#173f38" stroke-width="12" fill="none"/>
    <path d="M256 92 C226 58 186 66 180 88 C206 110 240 108 256 92Z" fill="#9ee07a" stroke="#173f38" stroke-width="8"/>
    <path d="M256 88 C286 48 334 58 338 82 C312 108 274 106 256 88Z" fill="#b6f08e" stroke="#173f38" stroke-width="8"/>
    <ellipse cx="216" cy="207" rx="35" ry="24" fill="#effff9" opacity=".72"/>
  </svg>
`)}`;

export const PLANTLETS: Record<PlantletId, Plantlet> = {
  pepper: {
    id: "pepper",
    name: "Pepper Peony",
    tagline: "A peony who dreams of the moon.",
    stageNames: ["Seedling", "Sprout", "Young", "Queen"],
    sprites: [pepperSeedling.url, pepperSprout.url, pepperYoung.url, pepperQueen.url],
    glowColor: "#ff5fb8",
    careProfile: {
      drift: { water: 0.5, sun: 0.3, soil: 0.15 },
      likes: "Likes bright light, water when the top inch of soil feels dry, and compost-rich soil.",
    },
    story: [
      {
        narration: "Long ago, the moon dropped a single seed on this rooftop. It's been waiting for someone kind enough to wake it.",
        prompt: "A tiny glowing pink-winged pixie hovers over a glass planter on a rooftop garden at moonlit dusk as a small sprout breaks through the soil, soft moonlight, the gray and pink city skyline behind, slow gentle camera drift.",
      },
      {
        narration: "It remembers you now. Every drop of water is a word in its language.",
        prompt: "The sprout unfurls new leaves and a small pink bud swells, soft light rising from the soil, the pixie circles it.",
      },
      {
        narration: "Something old is waking up inside Pepper Peony. She's starting to dream of the whole garden.",
        prompt: "A small plant person with a green moss afro and a pink bud flower in her hair stands up in the planter, her leaves lighting with thin pink neon veins.",
      },
      {
        narration: "The first bloom has returned to the moon, and the Gardenverse remembers its queen, Pepper Peony.",
        prompt: "The plant person grows into a graceful plant queen with long moss locs, a large glowing pink peony crown opens, soft pink light fills the garden, the camera tilts up to the moon.",
      },
    ],
    stageNotes: ["", "Pepper Peony is a sprout now", "Pepper Peony is thriving", "Pepper Peony is a Queen now!"],
    aspect: 1920 / 1048,
    heights: [0.35, 0.53, 0.72, 0.9],
    frames: [
      { top: 0.142, bottom: 0.917, cx: 0.495 },
      { top: 0.089, bottom: 0.917, cx: 0.49 },
      { top: 0.081, bottom: 0.916, cx: 0.49 },
      { top: 0.051, bottom: 0.915, cx: 0.473 },
    ],
    queenGlow: 1,
    burstColor: "#ffb3d9",
    cardStage: 0,
  },
  lumibud: {
    id: "lumibud",
    name: "Lumibud",
    tagline: "A little light that learned to grow.",
    stageNames: ["Glow Seed", "Sprout", "Leafling", "Bloom"],
    sprites: [LUMIBUD_ORB, lumibudSprout.url, lumibudLeafling.url, lumibudBloom.url],
    glowColor: "#8fffd2",
    careProfile: {
      drift: { water: 0.65, sun: 0.15, soil: 0.15 },
      likes: "Likes soft light and evenly moist soil, like many shade-loving plants and ferns.",
    },
    story: [
      {
        narration: "This one fell from the sky wrapped in starlight. It doesn't know it's a seed yet.",
        prompt: "A tiny glowing seed sits in a glass planter on a moonlit rooftop garden, a soft teal light pulses inside it and a first sprout peeks out, the pixie hovers close, the gray and pink city skyline behind.",
      },
      {
        narration: "It opened its eyes and saw you first. It will remember.",
        prompt: "A round mint-green plant creature with a pink belly and a single glowing leaf tip hops out of the soil and blinks its big eyes.",
      },
      {
        narration: "The more you tend it, the brighter it glows. Light is how it says thank you.",
        prompt: "Glowing teal veins spread across its broad leaves as it stretches its arms, little lights drift upward.",
      },
      {
        narration: "Every petal holds a little moonlight, and the garden glows back.",
        prompt: "A crown of pink blossoms and glowing leaves blooms on its head as teal patterns light up its body, the camera tilts up to the moon.",
      },
    ],
    stageNotes: ["", "Lumibud is a Sprout now", "Lumibud is thriving", "Lumibud is a Bloom now!"],
    aspect: 1,
    heights: [0.28, 0.42, 0.58, 0.76],
    frames: [
      { top: 0, bottom: 1, cx: 0.5 },
      { top: 0.036, bottom: 0.964, cx: 0.5 },
      { top: 0.036, bottom: 0.964, cx: 0.5 },
      { top: 0.036, bottom: 0.964, cx: 0.5 },
    ],
    queenGlow: 1.25,
    burstColor: "#8fffd2",
    cardStage: 1,
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
/** Shared care and meditation copy uses the selected companion's name. */
export function named(text: string) { return text.split("Pepper Peony").join(plantName()); }
/** Test hook: forget the cached choice so storage is re-read. */
export function _resetPlantletCache() { loaded = false; chosen = null; }
