import { describe, expect, it } from "vitest";
import { spokenText } from "./voice";
import { meditationPrompt, MEDITATION_STEP_SCENES, MOON_STAGE, stageNarration, stagePrompt, stageSuggestions } from "../cinematic/prompts";
import { MEDITATION_SCRIPT } from "../meditation/meditation";

describe("Xion pronunciation", () => {
  it("says Xion as Zion", () => expect(spokenText("Hi, I'm Xion! XION xion.")).toBe("Hi, I'm Zion! ZION zion."));
  it("leaves other words alone", () => expect(spokenText("Xiongnu")).toBe("Xiongnu"));
});
describe("meditation video prompts", () => {
  it("has a scene for every script step", () => expect(MEDITATION_STEP_SCENES).toHaveLength(MEDITATION_SCRIPT.length));
  it("tints the calm scene with the chosen companion", () => {
    const p = meditationPrompt(6, { name: "Lumibud", glowName: "soft teal-green glow" });
    expect(p).toContain("Lumibud"); expect(p).toContain("teal-green");
  });
  it("Xion stretches through beach, city, forest and a high-tech rooftop", () => {
    const all = MEDITATION_SCRIPT.map((_, i) => meditationPrompt(i, { name: "a", glowName: "b" })).join(" ");
    for (const place of ["beach", "cityscape", "forest", "high-tech rooftop garden"]) expect(all).toContain(place);
    expect(all).toMatch(/stretch/);
  });
});
describe("moonflower story", () => {
  it("has three beats with Xion's lines", () => {
    expect(stageNarration(MOON_STAGE)).toBe("Moonflowers wait all day for one thing: the moon.");
    expect(stageNarration(MOON_STAGE + 2)).toBe("It'll bloom every night now, a little lamp for the garden.");
    expect(stagePrompt(MOON_STAGE + 1)).toMatch(/petals slowly unfurl/);
    expect(stageSuggestions(MOON_STAGE)).toHaveLength(4);
  });
});
