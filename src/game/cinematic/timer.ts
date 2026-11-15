export const CINEMATIC_DURATION_SECONDS = 15;
export const CINEMATIC_FADE_MS = 1000;

export type CinematicTimerState = { running: boolean; fading: boolean; remainingMs: number; progress: number };

/** Wall-clock countdown shared by screen and future XR presentations. */
export function createCinematicTimer(onEnd: () => void, now: () => number = Date.now) {
  const durationMs = CINEMATIC_DURATION_SECONDS * 1000;
  const initial = (): CinematicTimerState => ({ running: false, fading: false, remainingMs: durationMs, progress: 1 });
  let state = initial();
  let deadline = 0;
  let interval: ReturnType<typeof setInterval> | undefined;
  const listeners = new Set<() => void>();
  const update = (next: CinematicTimerState) => { state = next; listeners.forEach((listener) => listener()); };
  const clear = () => { if (interval !== undefined) clearInterval(interval); interval = undefined; };
  const tick = () => {
    const remainingMs = Math.max(0, deadline - now());
    if (now() >= deadline + CINEMATIC_FADE_MS) {
      clear();
      update({ running: false, fading: true, remainingMs: 0, progress: 0 });
      onEnd();
      return;
    }
    update({ running: true, fading: remainingMs === 0, remainingMs, progress: remainingMs / durationMs });
  };
  return {
    getSnapshot: () => state,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    start() {
      if (state.running) return;
      deadline = now() + durationMs;
      update({ running: true, fading: false, remainingMs: durationMs, progress: 1 });
      interval = setInterval(tick, 50);
    },
    reset() {
      if (!state.running) return;
      deadline = now() + durationMs;
      update({ running: true, fading: false, remainingMs: durationMs, progress: 1 });
    },
    stop() { clear(); update(initial()); },
  };
}