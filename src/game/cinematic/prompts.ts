import { currentPlantlet, PLANTLETS } from "../plants/plantlets";
// Steering suggestions stay shared; each companion's narration and Orbis prompts live in plants/plantlets.ts.
const STAGE_SUGGESTIONS = [
  {
    suggestions: ["Make it rain petals", "The pixie flies closer", "Fireflies fill the air", "A gentle breeze"],
    xionSuggestions: ["Moonlight beads on the leaves", "A soft cloud crosses the moon", "Tiny roots shimmer below", "The skyline lights pulse gently", "Dew gathers on the planter", "A warm breeze stirs the soil", "The seed glows from within", "Small stars reflect in the glass"],
  },
  {
    suggestions: ["The moon glows brighter", "Make it rain petals", "Fireflies fill the air", "The pixie flies closer"],
    xionSuggestions: ["New leaves catch pink light", "A quiet mist curls around her", "The bud sways with her breath", "Soft ripples cross the soil", "Fireflies trace a slow circle", "Moonbeams frame her leaves", "The city hums in the distance", "A single petal drifts down"],
  },
  {
    suggestions: ["Show the whole city", "A gentle breeze", "Fireflies fill the air", "The moon glows brighter"],
    xionSuggestions: ["Her neon veins softly brighten", "Moss curls move in the breeze", "A lotus shadow crosses the roof", "Pink pollen floats upward", "The garden answers with light", "Clouds part above her", "Her reflection fills the glass", "Leaves open toward the moon"],
  },
  {
    suggestions: ["Make it rain petals", "Show the whole city", "The moon glows brighter", "The pixie flies closer"],
    xionSuggestions: ["Her crown blooms one petal more", "A gentle halo rings the moon", "Moss locs glow at their tips", "Petals settle like soft snow", "The rooftop fills with fireflies", "Pink light reaches the skyline", "She bows to the waiting garden", "The camera circles her crown"],
  },
] as const;

// Pepper's original exported story remains available to the world-minting route and session tests.
export const CINEMATIC_STAGES = PLANTLETS.pepper.story.map((story, index) => ({
  name: PLANTLETS.pepper.stageNames[index]!,
  narration: story.narration,
  prompt: story.prompt,
  ...STAGE_SUGGESTIONS[index]!,
}));

export const CINEMATIC_PROMPTS = [
  PLANTLETS.pepper.story[0].prompt,
  PLANTLETS.pepper.story[1].prompt,
  PLANTLETS.pepper.story[2].prompt,
  PLANTLETS.pepper.story[3].prompt,
] as const;

export function stagePrompt(stage: number) {
  const prompt = moonBeat(stage)?.prompt ?? currentPlantlet().story[stage]?.prompt;
  if (!prompt) throw new Error("Unknown companion stage");
  return prompt;
}

export function stageNarration(stage: number) {
  const narration = moonBeat(stage)?.narration ?? currentPlantlet().story[stage]?.narration;
  if (!narration) throw new Error("Unknown companion stage");
  return narration;
}

export function stageSuggestions(stage: number) {
  const story = moonBeat(stage) ? MOON_SUGGESTIONS : CINEMATIC_STAGES[stage];
  if (!story) throw new Error("Unknown companion stage");
  return story.suggestions;
}

export function stageXionSuggestions(stage: number) {
  const story = moonBeat(stage) ? MOON_SUGGESTIONS : CINEMATIC_STAGES[stage];
  if (!story) throw new Error("Unknown companion stage");
  return story.xionSuggestions;
}

const STYLE = "inked comic outlines, gray and black world lit by soft pink neon with green plants, slow dreamy camera drift";
const MEDITATION_SCENES = {
  arrive: "A tiny pink-winged fairy with twin buns sits cross-legged on a cushion in her moonlit neon rooftop garden, eyes closed, shoulders softening, mist curling around her",
  beach: "The tiny pink-winged fairy stands on a calm twilight beach and slowly raises her arms overhead as she breathes in, waves rolling gently in time with her breath",
  city: "The tiny pink-winged fairy does a slow side-body stretch on a high ledge above a softly glowing night cityscape, city lights twinkling far below",
  forest: "The tiny pink-winged fairy folds gently forward in a misty forest of moss and glowing ferns, roots and soft light all around her",
  tech: "The tiny pink-winged fairy holds a calm standing stretch in a high-tech rooftop garden of glass planters and LED vines under a bright moon, {companion} glowing nearby with a {glow}",
  return: "The tiny pink-winged fairy sits back down on her cushion in her own rooftop garden at dawn, wings shimmering, opening her eyes with a smile",
} as const;
/** Scenery and stretch for each meditation script step (index = step). */
export const MEDITATION_STEP_SCENES: (keyof typeof MEDITATION_SCENES)[] = ["arrive", "beach", "beach", "city", "city", "forest", "tech", "return"];
/** Orbis prompt for one meditation step, tinted with the chosen companion's glow. */
export function meditationPrompt(step: number, companion: { name: string; glowName: string }) {
  const scene = MEDITATION_STEP_SCENES[Math.min(Math.max(step, 0), MEDITATION_STEP_SCENES.length - 1)] ?? "arrive";
  return `${MEDITATION_SCENES[scene].replace("{companion}", companion.name).replace("{glow}", companion.glowName)}, ${STYLE}.`;
}

/** Moonflower story: plays as cinematic stages MOON_STAGE..MOON_STAGE+2 when the quest blooms. */
export const MOON_STAGE = 10;
export const MOONFLOWER_STORY = [
  { narration: "Moonflowers wait all day for one thing: the moon.", prompt: "A closed white moonflower bud on its trellis in a rooftop garden under a dark sky, the city humming far below, stillness and anticipation, " + STYLE + "." },
  { narration: "It only opens for someone patient. That's you.", prompt: "Moonlight touches the vine and the big white moonflower petals slowly unfurl, glowing softly, " + STYLE + "." },
  { narration: "It'll bloom every night now, a little lamp for the garden.", prompt: "Silver pollen drifts up from the glowing moonflowers toward the moon as the whole rooftop garden glows softly, " + STYLE + "." },
] as const;
const MOON_SUGGESTIONS = {
  suggestions: ["The moon glows brighter", "Fireflies fill the air", "A gentle breeze", "The pixie flies closer"],
  xionSuggestions: ["Hawk moths circle the blooms", "Petals glow like lanterns", "A cloud slides off the moon", "Dew shines on the trellis", "Perfume drifts on the breeze", "The vine climbs one more loop"],
};
const moonBeat = (stage: number) => (stage >= MOON_STAGE ? MOONFLOWER_STORY[stage - MOON_STAGE] : undefined);

/** Calm Orbis visuals that accompany Xion's guided meditation (separate from growth lore). */
export const MEDITATION_PROMPT = "A slow, dreamy meditation scene on a moonlit neon rooftop garden: soft pink and green light breathes gently through glowing leaves, fireflies drift, mist curls over the meditation cushion, the city glows softly far below, calm and peaceful, slow camera drift.";
