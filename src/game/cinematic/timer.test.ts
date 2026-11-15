import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CINEMATIC_DURATION_SECONDS, createCinematicTimer } from "./timer";

describe("cinematic auto-end timer", () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });
  it("does not count loading time before first frames", () => {
    const end = vi.fn();
    const timer = createCinematicTimer(end);
    vi.advanceTimersByTime(90000);
    expect(timer.getSnapshot().running).toBe(false);
    expect(timer.getSnapshot().remainingMs).toBe(15000);
    expect(end).not.toHaveBeenCalled();
    timer.stop();
  });
  it("drains for exactly 15 seconds, fades for one second, then ends once", () => {
    expect(CINEMATIC_DURATION_SECONDS).toBe(15);
    const end = vi.fn();
    const timer = createCinematicTimer(end);
    timer.start();
    vi.advanceTimersByTime(7500);
    expect(timer.getSnapshot().progress).toBe(0.5);
    vi.advanceTimersByTime(7500);
    expect(timer.getSnapshot().fading).toBe(true);
    expect(end).not.toHaveBeenCalled();
    vi.advanceTimersByTime(950);
    expect(end).not.toHaveBeenCalled();
    vi.advanceTimersByTime(50);
    expect(end).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(30000);
    expect(end).toHaveBeenCalledTimes(1);
  });
  it("resets a running countdown to 15 seconds, including during fade", () => {
    const end = vi.fn();
    const timer = createCinematicTimer(end);
    timer.start();
    vi.advanceTimersByTime(15000);
    timer.reset();
    expect(timer.getSnapshot()).toMatchObject({ fading: false, progress: 1, remainingMs: 15000 });
    vi.advanceTimersByTime(14950);
    expect(timer.getSnapshot().fading).toBe(false);
    expect(end).not.toHaveBeenCalled();
    timer.stop();
  });
  it("does not restart on repeated frame notifications or pre-frame resets", () => {
    const timer = createCinematicTimer(vi.fn());
    timer.reset();
    expect(timer.getSnapshot().running).toBe(false);
    timer.start();
    vi.advanceTimersByTime(10000);
    timer.start();
    expect(timer.getSnapshot().remainingMs).toBe(5000);
    timer.stop();
  });
  it("cancels immediately on close and starts fresh on another run", () => {
    const end = vi.fn();
    const timer = createCinematicTimer(end);
    timer.start();
    vi.advanceTimersByTime(15000);
    timer.stop();
    vi.advanceTimersByTime(20000);
    expect(end).not.toHaveBeenCalled();
    timer.start();
    expect(timer.getSnapshot().remainingMs).toBe(15000);
    timer.stop();
  });
});