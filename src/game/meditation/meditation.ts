import type { Point3 } from "../interaction";

export type MeditationStep = { text: string; seconds: number };
/** Xion's guided meditation, about two minutes. Edit text or timing here. */
export const MEDITATION_SCRIPT: MeditationStep[] = [
  { text: "Settle in beside me on the cushion. Let your shoulders soften.", seconds: 12 },
  { text: "Breathe in slowly through your nose... and let it go.", seconds: 14 },
  { text: "Feel the rooftop under you, steady and warm, like soil holding a seed.", seconds: 16 },
  { text: "With each breath in, imagine soft pink light gathering in your chest.", seconds: 16 },
  { text: "With each breath out, let the noise of the city drift away.", seconds: 16 },
  { text: "Picture Pepper Peony's roots reaching down, slow and patient. You are growing too.", seconds: 18 },
  { text: "Stay here a moment. Nothing to do, nothing to fix.", seconds: 16 },
  { text: "When you're ready, wiggle your fingers and open your eyes. Thank you for breathing with me.", seconds: 12 },
];
export const MEDITATION_SECONDS = MEDITATION_SCRIPT.reduce((n, s) => n + s.seconds, 0);
export const BREATH_IN_SECONDS = 4;
export const BREATH_OUT_SECONDS = 6;
/** Where Xion sits: the meditation pad's cushion (logic position; seated art is drawn at SEAT_Y). */
export const PAD_SEAT: Point3 = { x: 1.8, y: 0.65, z: -2.22 };
export const SEAT_Y = 0.36;
export const PAD_FACING = -0.4; // pad rotation; Xion faces +z rotated by this

export function breathPhase(seconds: number) {
  const cycle = BREATH_IN_SECONDS + BREATH_OUT_SECONDS;
  const t = ((seconds % cycle) + cycle) % cycle;
  return t < BREATH_IN_SECONDS
    ? { label: "Breathe in", level: t / BREATH_IN_SECONDS }
    : { label: "Breathe out", level: 1 - (t - BREATH_IN_SECONDS) / BREATH_OUT_SECONDS };
}

export type MeditationState = { active: boolean; seated: boolean; step: number; elapsed: number; visuals: boolean };
type Deps = {
  move: (p: Point3) => void;
  speak: (text: string) => void;
  stopSpeaking: () => void;
  music: { playing: () => boolean; play: () => void; pause: () => void };
  onEnd?: () => void;
};

/** Meditation rules shared by web and VR: seat Xion, step the script, breathe, return her and restore music. */
export function createMeditation(deps: Deps) {
  let state: MeditationState = { active: false, seated: false, step: 0, elapsed: 0, visuals: false };
  let home: Point3 | null = null;
  let startedMusic = false;
  const subs = new Set<() => void>();
  const set = (patch: Partial<MeditationState>) => { state = { ...state, ...patch }; subs.forEach((f) => f()); };
  const stepAt = (elapsed: number) => {
    let t = 0;
    for (let i = 0; i < MEDITATION_SCRIPT.length; i++) { t += MEDITATION_SCRIPT[i]?.seconds ?? 0; if (elapsed < t) return i; }
    return MEDITATION_SCRIPT.length;
  };
  const m = {
    getSnapshot: () => state,
    subscribe(f: () => void) { subs.add(f); return () => { subs.delete(f); }; },
    get caption() { return MEDITATION_SCRIPT[state.step]?.text ?? ""; },
    get breath() { return breathPhase(state.elapsed); },
    start(from: Point3, visuals = false) {
      if (state.active) return;
      home = { ...from };
      startedMusic = !deps.music.playing();
      if (startedMusic) deps.music.play();
      deps.move(PAD_SEAT);
      set({ active: true, seated: true, step: 0, elapsed: 0, visuals });
      deps.speak(MEDITATION_SCRIPT[0]?.text ?? "");
    },
    setVisuals(on: boolean) { if (state.visuals !== on) set({ visuals: on }); },
    tick(dt: number) {
      if (!state.active) return;
      const elapsed = state.elapsed + dt;
      const step = stepAt(elapsed);
      if (step >= MEDITATION_SCRIPT.length) { m.stop(); return; }
      if (step !== state.step) deps.speak(MEDITATION_SCRIPT[step]?.text ?? "");
      state = { ...state, elapsed, step };
      if (step !== stepAt(elapsed - dt)) subs.forEach((f) => f());
    },
    stop() {
      if (!state.active) return;
      deps.stopSpeaking();
      if (startedMusic) deps.music.pause();
      startedMusic = false;
      if (home) deps.move(home);
      set({ active: false, seated: false, step: 0, elapsed: 0, visuals: false });
      deps.onEnd?.();
    },
  };
  return m;
}
export type Meditation = ReturnType<typeof createMeditation>;
