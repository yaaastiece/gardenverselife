import { describe, it, expect } from "vitest";
import { createCooldown, soundForHold, notesFor } from "./plantVoice";
describe("plant voice", () => {
  it("short tap is a poke, a 250ms hold is a squeeze", () => {
    expect(soundForHold(100)).toBe("poke");
    expect(soundForHold(250)).toBe("squeeze");
  });
  it("spaces repeat taps by the cooldown", () => {
    const ok = createCooldown(180);
    expect(ok(0)).toBe(true); expect(ok(100)).toBe(false); expect(ok(200)).toBe(true);
  });
  it("each plantlet has its own voice", () => {
    expect(notesFor("pepper", "poke")[0]!.f0).not.toBe(notesFor("lumibud", "poke")[0]!.f0);
  });
});
