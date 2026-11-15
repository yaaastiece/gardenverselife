import { describe, expect, it, vi } from "vitest";
import { createCinematicMusic, CINEMATIC_MUSIC_LEVEL } from "./cinematicMusic";

describe("music under Orbis videos", () => {
  it("pauses the radio, plays Night Garden softly, then resumes the radio", () => {
    let playing = true;
    const radio = { getSnapshot: () => ({ playing, volume: 0.5 }), pause: vi.fn(() => { playing = false; }), play: vi.fn(() => Promise.resolve()) };
    const el = { volume: 1, loop: false, src: "", play: vi.fn(() => Promise.resolve()), pause: vi.fn() };
    const m = createCinematicMusic(radio as never, () => el as never);
    m.start();
    expect(radio.pause).toHaveBeenCalled(); expect(el.loop).toBe(true); expect(el.src).toMatch(/night_garden/);
    expect(el.volume).toBeCloseTo(0.5 * CINEMATIC_MUSIC_LEVEL);
    m.stop();
    expect(el.pause).toHaveBeenCalled(); expect(radio.play).toHaveBeenCalled();
  });
});
