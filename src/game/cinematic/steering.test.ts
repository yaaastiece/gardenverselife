import { describe, expect, it, vi } from "vitest";
import {
  createCinematicSteering, sanitizeSteering, steeringPrompt, validateSteering,
  STEERING_LIMIT, STEERING_VOICE_UNAVAILABLE, XION_SUGGESTION_ROTATION_MS,
  type SteeringDictationFactory,
} from "./steering";
import { CINEMATIC_PROMPTS, stageXionSuggestions } from "./prompts";

describe("Orbis player steering", () => {
  it("combines only the current stage prompt and sanitized player request", () => {
    expect(steeringPrompt(2, "  Fireflies   fill the air!  ")).toBe(`${CINEMATIC_PROMPTS[2]} Then: Fireflies fill the air!.`);
    expect(sanitizeSteering("Pink petals 🌸 <script> everywhere")).toBe("Pink petals script everywhere");
  });

  it("limits a request to 140 characters", () => {
    expect(sanitizeSteering("a".repeat(180))).toHaveLength(STEERING_LIMIT);
  });

  it.each([
    "make them fight with a gun",
    "show blood and gore",
    "make it sexual and nude",
    "racist hate propaganda",
    "Taylor Swift visits the garden",
    "show a real person",
    "turn this into a Disney movie",
  ])("rejects unsafe or protected content: %s", (request) => {
    expect(validateSteering(request)).toEqual({ ok: false, message: "Try something gentle and garden-like" });
  });

  it("allows gentle requests with letters, numbers and basic punctuation", () => {
    expect(validateSteering("Add 3 fireflies, then a gentle breeze!")).toEqual({ ok: true, text: "Add 3 fireflies, then a gentle breeze!" });
  });

  it("enforces six seconds between successful prompt submissions", async () => {
    let time = 1000;
    const send = vi.fn(async () => undefined);
    const steering = createCinematicSteering(send, { now: () => time });
    expect(await steering.submit(0, "Make it rain petals")).toBe(true);
    expect(steering.getSnapshot().sent).toBe(true);
    expect(steering.remaining()).toBe(6);
    expect(await steering.submit(0, "The moon glows brighter")).toBe(false);
    expect(send).toHaveBeenCalledTimes(1);
    time += 5999;
    expect(steering.remaining()).toBe(1);
    expect(await steering.submit(0, "The moon glows brighter")).toBe(false);
    time += 1;
    expect(await steering.submit(0, "The moon glows brighter")).toBe(true);
    expect(send).toHaveBeenCalledTimes(2);
  });

  it("does not report Sent when the stream refuses a prompt", async () => {
    const steering = createCinematicSteering(async () => { throw new Error("refused"); }, { now: () => 0 });
    expect(await steering.submit(1, "Fireflies fill the air")).toBe(false);
    expect(steering.getSnapshot().sent).toBe(false);
    expect(steering.getSnapshot().message).toBe("The scene couldn’t change. Try again.");
  });

  it("shows four chips and rotates two fresh Xion suggestions every eight seconds without repeating the eight-item bag", () => {
    let time = 0;
    const steering = createCinematicSteering(async () => undefined, { now: () => time, random: () => 0.37 });
    expect(steering.chips()).toHaveLength(4);
    expect(steering.getSnapshot().xionSuggestions).toHaveLength(2);
    const initial = steering.getSnapshot().xionSuggestions;
    time = XION_SUGGESTION_ROTATION_MS - 1;
    steering.tick();
    expect(steering.getSnapshot().xionSuggestions).toEqual(initial);
    const seen = new Set(initial);
    for (let round = 0; round < 3; round++) {
      time += 1;
      steering.tick();
      const next = steering.getSnapshot().xionSuggestions;
      expect(next).toHaveLength(2);
      expect(next.every((text) => !seen.has(text))).toBe(true);
      next.forEach((text) => seen.add(text));
      time += XION_SUGGESTION_ROTATION_MS - 1;
    }
    expect([...seen].sort()).toEqual([...stageXionSuggestions(0)].sort());
  });

  it("does not offer an already chosen automatic suggestion while fresh choices remain", async () => {
    let time = 0;
    const steering = createCinematicSteering(async () => undefined, { now: () => time, random: () => 0.2 });
    const chosen = steering.getSnapshot().xionSuggestions[0]!;
    expect(await steering.submitCurrent(chosen)).toBe(true);
    time = XION_SUGGESTION_ROTATION_MS;
    steering.tick();
    expect(steering.getSnapshot().xionSuggestions).not.toContain(chosen);
  });

  it("uses the same safety, 140-character limit and cooldown for heard voice text", async () => {
    let time = 0;
    let callbacks: Parameters<SteeringDictationFactory>[0] | undefined;
    const start = vi.fn(() => callbacks?.listening(true));
    const stop = vi.fn(() => callbacks?.listening(false));
    const send = vi.fn(async () => undefined);
    const steering = createCinematicSteering(send, {
      now: () => time,
      dictation: (value) => { callbacks = value; return { start, stop }; },
    });
    steering.startVoice();
    expect(start).toHaveBeenCalledTimes(1);
    expect(steering.getSnapshot().listening).toBe(true);
    callbacks?.heard("A gentle breeze 🌸");
    steering.stopVoice();
    expect(stop).toHaveBeenCalledTimes(1);
    expect(steering.getSnapshot().draft).toBe("A gentle breeze");
    expect(await steering.submitCurrent()).toBe(true);
    expect(send).toHaveBeenCalledWith(`${CINEMATIC_PROMPTS[0]} Then: A gentle breeze.`, 0);
    callbacks?.heard("a".repeat(180));
    expect(steering.getSnapshot().draft).toHaveLength(STEERING_LIMIT);
    time += 6000;
    callbacks?.heard("make them fight with a gun");
    expect(await steering.submitCurrent()).toBe(false);
    expect(steering.getSnapshot().message).toBe("Try something gentle and garden-like");
  });

  it("keeps chips available when voice recognition is unavailable", () => {
    const steering = createCinematicSteering(async () => undefined, { dictation: () => null });
    const chips = steering.chips();
    steering.startVoice();
    expect(steering.getSnapshot().voiceMessage).toBe(STEERING_VOICE_UNAVAILABLE);
    expect(steering.getSnapshot().listening).toBe(false);
    expect(steering.chips()).toEqual(chips);
  });
});
