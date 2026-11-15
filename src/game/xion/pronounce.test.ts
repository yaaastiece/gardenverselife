import { describe, expect, it } from "vitest";
import { spokenText } from "./voice";
import { meditationPrompt, MEDITATION_STEP_SCENES } from "../cinematic/prompts";
import { MEDITATION_SCRIPT } from "../meditation/meditation";

describe("Xion pronunciation", () => {
  it("says Xion as Zion", () => expect(spokenText("Hi, I'm Xion! XION xion.")).toBe("Hi, I'm Zion! ZION zion."));
  it("leaves other words alone", () => expect(spokenText("Xiongnu")).toBe("Xiongnu"));
});
describe("meditation video prompts", () => {
  it("has a scene for every script step", () => expect(MEDITATION_STEP_SCENES).toHaveLength(MEDITATION_SCRIPT.length));
  it("tints the calm scene with the chosen companion", () => {
    const p = meditationPrompt(5, { name: "Lumibud", glowName: "soft teal-green glow" });
    expect(p).toContain("Lumibud"); expect(p).toContain("teal-green");
  });
  it("breathe in and out differ", () => expect(meditationPrompt(3, { name: "a", glowName: "b" })).not.toBe(meditationPrompt(4, { name: "a", glowName: "b" })));
});
