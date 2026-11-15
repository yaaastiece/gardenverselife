// Editable Orbis story: stage copy, narration and player-facing suggestions stay together.
export const CINEMATIC_STAGES = [
  {
    name: "Seedling",
    narration: "Long ago, the moon dropped a single seed on this rooftop. It's been waiting for someone kind enough to wake it.",
    prompt: "A tiny glowing pink-winged pixie hovers over a glass planter on a rooftop garden at moonlit dusk as a small sprout breaks through the soil, soft moonlight, the gray and pink city skyline behind, slow gentle camera drift.",
    suggestions: ["Make it rain petals", "The pixie flies closer", "Fireflies fill the air", "A gentle breeze"],
    xionSuggestions: ["Moonlight beads on the leaves", "A soft cloud crosses the moon", "Tiny roots shimmer below", "The skyline lights pulse gently", "Dew gathers on the planter", "A warm breeze stirs the soil", "The seed glows from within", "Small stars reflect in the glass"],
  },
  {
    name: "Sprout",
    narration: "It remembers you now. Every drop of water is a word in its language.",
    prompt: "The sprout unfurls new leaves and a small pink bud swells, soft light rising from the soil, the pixie circles it.",
    suggestions: ["The moon glows brighter", "Make it rain petals", "Fireflies fill the air", "The pixie flies closer"],
    xionSuggestions: ["New leaves catch pink light", "A quiet mist curls around her", "The bud sways with her breath", "Soft ripples cross the soil", "Fireflies trace a slow circle", "Moonbeams frame her leaves", "The city hums in the distance", "A single petal drifts down"],
  },
  {
    name: "Young",
    narration: "Something old is waking up inside Pepper Peony. She's starting to dream of the whole garden.",
    prompt: "A small plant person with a green moss afro and a pink bud flower in her hair stands up in the planter, her leaves lighting with thin pink neon veins.",
    suggestions: ["Show the whole city", "A gentle breeze", "Fireflies fill the air", "The moon glows brighter"],
    xionSuggestions: ["Her neon veins softly brighten", "Moss curls move in the breeze", "A lotus shadow crosses the roof", "Pink pollen floats upward", "The garden answers with light", "Clouds part above her", "Her reflection fills the glass", "Leaves open toward the moon"],
  },
  {
    name: "Queen",
    narration: "The first bloom has returned to the moon, and the Gardenverse remembers its queen, Pepper Peony.",
    prompt: "The plant person grows into a graceful plant queen with long moss locs, a large glowing pink peony crown opens, soft pink light fills the garden, the camera tilts up to the moon.",
    suggestions: ["Make it rain petals", "Show the whole city", "The moon glows brighter", "The pixie flies closer"],
    xionSuggestions: ["Her crown blooms one petal more", "A gentle halo rings the moon", "Moss locs glow at their tips", "Petals settle like soft snow", "The rooftop fills with fireflies", "Pink light reaches the skyline", "She bows to the waiting garden", "The camera circles her crown"],
  },
] as const;

// Kept as a fixed tuple for the world-minting route and existing session tests.
export const CINEMATIC_PROMPTS = [
  CINEMATIC_STAGES[0].prompt,
  CINEMATIC_STAGES[1].prompt,
  CINEMATIC_STAGES[2].prompt,
  CINEMATIC_STAGES[3].prompt,
] as const;

export function stagePrompt(stage: number) {
  const prompt = CINEMATIC_PROMPTS[stage];
  if (!prompt) throw new Error("Unknown companion stage");
  return prompt;
}

export function stageNarration(stage: number) {
  const story = CINEMATIC_STAGES[stage];
  if (!story) throw new Error("Unknown companion stage");
  return story.narration;
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
