import { describe, expect, it, vi } from "vitest";
import { MEDITATION_SCRIPT, MEDITATION_SECONDS, PAD_SEAT, breathPhase, createMeditation } from "./meditation";

const setup = (playing = false) => {
  let musicOn = playing;
  const deps = { move: vi.fn(), speak: vi.fn(), stopSpeaking: vi.fn(), onEnd: vi.fn(),
    music: { playing: () => musicOn, play: vi.fn(() => { musicOn = true; }), pause: vi.fn(() => { musicOn = false; }) } };
  return { deps, m: createMeditation(deps) };
};

describe("guided meditation", () => {
  it("lasts about two minutes", () => { expect(MEDITATION_SECONDS).toBe(120); });
  it("seats Xion on the pad, starts music and speaks the first line", () => {
    const { deps, m } = setup();
    m.start({ x: 0, y: 1, z: 0 });
    expect(deps.move).toHaveBeenCalledWith(PAD_SEAT);
    expect(deps.music.play).toHaveBeenCalledOnce();
    expect(deps.speak).toHaveBeenCalledWith(MEDITATION_SCRIPT[0]?.text);
    expect(m.getSnapshot().seated).toBe(true);
  });
  it("speaks each step in order and ends by returning Xion home", () => {
    const { deps, m } = setup();
    m.start({ x: 0, y: 1, z: 0 });
    for (let t = 0; t < MEDITATION_SECONDS + 1; t += 0.5) m.tick(0.5);
    expect(deps.speak).toHaveBeenCalledTimes(MEDITATION_SCRIPT.length);
    expect(deps.move).toHaveBeenLastCalledWith({ x: 0, y: 1, z: 0 });
    expect(m.getSnapshot().active).toBe(false);
    expect(deps.music.pause).toHaveBeenCalledOnce();
    expect(deps.onEnd).toHaveBeenCalledOnce();
  });
  it("stopping early leaves music the player already had on", () => {
    const { deps, m } = setup(true);
    m.start({ x: 0, y: 1, z: 0 }); m.tick(5); m.stop();
    expect(deps.music.play).not.toHaveBeenCalled();
    expect(deps.music.pause).not.toHaveBeenCalled();
    expect(deps.stopSpeaking).toHaveBeenCalledOnce();
  });
  it("breathes in for 4 seconds and out for 6", () => {
    expect(breathPhase(2)).toEqual({ label: "Breathe in", level: 0.5 });
    expect(breathPhase(7)).toEqual({ label: "Breathe out", level: 0.5 });
    expect(breathPhase(10).label).toBe("Breathe in");
  });
});
