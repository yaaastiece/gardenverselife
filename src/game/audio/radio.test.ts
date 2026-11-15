import { describe, expect, it, vi } from "vitest";
import { createRadio, bowlLight, BOWL_COLORS } from "./radio";

const tracks = [{ title: "A", url: "/a.mp3" }, { title: "B", url: "/b.mp3" }, { title: "C", url: "/c.mp3" }];
const fakePlayer = () => ({ src: "", volume: 1, onended: null as (() => void) | null, play: vi.fn(() => Promise.resolve()), pause: vi.fn() });

describe("sound bowl radio", () => {
  it("plays the songs in order and loops back to the first", async () => {
    const p = fakePlayer(); const r = createRadio(tracks, () => p);
    await r.play(); expect(p.src).toBe("/a.mp3");
    p.onended?.(); await Promise.resolve(); expect(r.track?.title).toBe("B");
    await r.next(); await r.next(); expect(r.track?.title).toBe("A");
    expect(r.getSnapshot().playing).toBe(true);
  });
  it("pauses and resumes", async () => {
    const p = fakePlayer(); const r = createRadio(tracks, () => p);
    await r.toggle(); await r.toggle();
    expect(p.pause).toHaveBeenCalled(); expect(r.getSnapshot().playing).toBe(false);
  });
  it("LED starts pink and dims when idle", () => {
    expect(bowlLight(0, false).color).toBe(BOWL_COLORS[0]);
    expect(bowlLight(0, false).intensity).toBeLessThan(bowlLight(0, true, 1).intensity);
  });
});
