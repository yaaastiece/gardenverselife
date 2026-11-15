export const CINEMATIC_PROMPTS = [
  "A tiny glowing pink-winged pixie floats above a glowing glass planter on a rooftop garden at dusk, a small sprout rises from the soil, the gray and pink city skyline glimmers behind, slow gentle camera drift.",
  "The sprout unfurls new leaves and a small pink bud swells, soft light rising from the planter, the pixie circles it.",
  "A small plant person with a green moss afro and a pink bud flower in her hair stands up in the planter, her leaves glowing with thin pink neon veins.",
  "The plant person grows into a graceful plant queen with long moss locs, a large glowing pink peony crown opens, soft pink light fills the garden, the camera tilts up to the moon.",
] as const;

export function stagePrompt(stage: number) {
  const prompt = CINEMATIC_PROMPTS[stage];
  if (!prompt) throw new Error("Unknown companion stage");
  return prompt;
}