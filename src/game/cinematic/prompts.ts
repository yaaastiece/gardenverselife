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
  const prompt = currentPlantlet().story[stage]?.prompt;
  if (!prompt) throw new Error("Unknown companion stage");
  return prompt;
}

export function stageNarration(stage: number) {
  const narration = currentPlantlet().story[stage]?.narration;
  if (!narration) throw new Error("Unknown companion stage");
  return narration;
}

export function stageSuggestions(stage: number) {
  const story = CINEMATIC_STAGES[stage];
  if (!story) throw new Error("Unknown companion stage");
  return story.suggestions;
}

export function stageXionSuggestions(stage: number) {
  const story = CINEMATIC_STAGES[stage];
  if (!story) throw new Error("Unknown companion stage");
  return story.xionSuggestions;
}

const MEDITATION_SCENES = {
  arrive: "A slow, dreamy meditation scene on a moonlit neon rooftop garden: mist curls over the meditation cushion, the gray and pink city glows softly far below, calm and still, slow camera drift.",
  breatheIn: "On the moonlit rooftop garden, soft pink and green light slowly swells through glowing leaves, fireflies rise gently into the night air, calm and peaceful, slow camera drift.",
  breatheOut: "On the moonlit rooftop garden, the pink and green glow softens and dims, petals drift slowly down past the leaves, mist settles, calm and peaceful, slow camera drift.",
  calm: "The moon brightens over the quiet rooftop garden, {companion} in the round center planter glows with a {glow}, silver moonlight on the leaves, deep calm, very slow camera drift.",
  return: "Dawn-soft light washes over the rooftop garden, a tiny pink-winged fairy's wings shimmer gently above the meditation cushion, the city wakes softly in pink and gray, peaceful, slow camera drift.",
} as const;
/** Which scene each meditation script step shows (index = step). */
export const MEDITATION_STEP_SCENES: (keyof typeof MEDITATION_SCENES)[] = ["arrive", "breatheIn", "arrive", "breatheIn", "breatheOut", "calm", "calm", "return"];
/** Orbis prompt for one meditation step, tinted with the chosen companion's glow. */
export function meditationPrompt(step: number, companion: { name: string; glowName: string }) {
  const scene = MEDITATION_STEP_SCENES[Math.min(Math.max(step, 0), MEDITATION_STEP_SCENES.length - 1)] ?? "arrive";
  return MEDITATION_SCENES[scene].replace("{companion}", companion.name).replace("{glow}", companion.glowName);
}

/** Calm Orbis visuals that accompany Xion's guided meditation (separate from growth lore). */
export const MEDITATION_PROMPT = "A slow, dreamy meditation scene on a moonlit neon rooftop garden: soft pink and green light breathes gently through glowing leaves, fireflies drift, mist curls over the meditation cushion, the city glows softly far below, calm and peaceful, slow camera drift.";
