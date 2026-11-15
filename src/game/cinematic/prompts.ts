// Editable Orbis story: stage copy, narration and player-facing suggestions stay together.
export const CINEMATIC_STAGES = [
  {
    name: "Seedling",
    narration: "Long ago, the moon dropped a single seed on this rooftop. It's been waiting for someone kind enough to wake it.",
    prompt: "A tiny glowing pink-winged pixie hovers over a glass planter on a rooftop garden at moonlit dusk as a small sprout breaks through the soil, soft moonlight, the gray and pink city skyline behind, slow gentle camera drift.",
    suggestions: ["Make it rain petals", "The pixie flies closer", "Fireflies fill the air", "A gentle breeze"],
  },
  {
    name: "Sprout",
    narration: "It remembers you now. Every drop of water is a word in its language.",
    prompt: "The sprout unfurls new leaves and a small pink bud swells, soft light rising from the soil, the pixie circles it.",
    suggestions: ["The moon glows brighter", "Make it rain petals", "Fireflies fill the air", "The pixie flies closer"],
  },
  {
    name: "Young",
    narration: "Something old is waking up inside her. She's starting to dream of the whole garden.",
    prompt: "A small plant person with a green moss afro and a pink bud flower in her hair stands up in the planter, her leaves lighting with thin pink neon veins.",
    suggestions: ["Show the whole city", "A gentle breeze", "Fireflies fill the air", "The moon glows brighter"],
  },
  {
    name: "Queen",
    narration: "The first bloom has returned to the moon, and the Gardenverse remembers its queen.",
    prompt: "The plant person grows into a graceful plant queen with long moss locs, a large glowing pink peony crown opens, soft pink light fills the garden, the camera tilts up to the moon.",
    suggestions: ["Make it rain petals", "Show the whole city", "The moon glows brighter", "The pixie flies closer"],
  },
] as const;

// Kept as a simple prompt list for the world-minting route and existing session tests.
export const CINEMATIC_PROMPTS = CINEMATIC_STAGES.map((stage) => stage.prompt);

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
