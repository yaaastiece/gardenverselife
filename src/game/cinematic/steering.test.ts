import { describe, expect, it, vi } from "vitest";
import { createCinematicSteering, sanitizeSteering, steeringPrompt, validateSteering, STEERING_LIMIT } from "./steering";
import { CINEMATIC_PROMPTS } from "./prompts";

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
    const steering = createCinematicSteering(send, () => time);
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
    const steering = createCinematicSteering(async () => { throw new Error("refused"); }, () => 0);
    expect(await steering.submit(1, "Fireflies fill the air")).toBe(false);
    expect(steering.getSnapshot().sent).toBe(false);
    expect(steering.getSnapshot().message).toBe("The scene couldn’t change. Try again.");
  });
});
