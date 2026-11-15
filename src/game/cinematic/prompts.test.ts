import { beforeEach, describe, expect, it } from "vitest";
import { _resetPlantletCache, choosePlantlet } from "../plants/plantlets";
import { CINEMATIC_PROMPTS, stageNarration, stagePrompt } from "./prompts";

beforeEach(() => { window.localStorage.clear(); _resetPlantletCache(); });

describe("data-driven companion cinematics", () => {
  it("keeps Pepper Peony's original four narrations and Orbis prompts", () => {
    expect([0, 1, 2, 3].map((stage) => ({ narration: stageNarration(stage), prompt: stagePrompt(stage) }))).toEqual([
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
    ]);
    expect(CINEMATIC_PROMPTS).toEqual([stagePrompt(0), stagePrompt(1), stagePrompt(2), stagePrompt(3)]);
  });

  it.each([
    [0, "This one fell from the sky wrapped in starlight. It doesn't know it's a seed yet.", "A tiny glowing seed sits in a glass planter on a moonlit rooftop garden, a soft teal light pulses inside it and a first sprout peeks out, the pixie hovers close, the gray and pink city skyline behind."],
    [1, "It opened its eyes and saw you first. It will remember.", "A round mint-green plant creature with a pink belly and a single glowing leaf tip hops out of the soil and blinks its big eyes."],
    [2, "The more you tend it, the brighter it glows. Light is how it says thank you.", "Glowing teal veins spread across its broad leaves as it stretches its arms, little lights drift upward."],
    [3, "Every petal holds a little moonlight, and the garden glows back.", "A crown of pink blossoms and glowing leaves blooms on its head as teal patterns light up its body, the camera tilts up to the moon."],
  ] as const)("uses Lumibud's narration and Orbis prompt at stage %i", (stage, narration, prompt) => {
    choosePlantlet("lumibud");
    expect(stageNarration(stage)).toBe(narration);
    expect(stagePrompt(stage)).toBe(prompt);
  });
});
