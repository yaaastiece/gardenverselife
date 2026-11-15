// Moonflower care quest: pure rules, no React/three. Each step teaches real-world care.
export type MoonStep = "discover" | "trellis" | "water" | "night" | "bloom";
export const MOON_STEPS: MoonStep[] = ["discover", "trellis", "water", "night", "bloom"];
export const MOON_TASKS: Record<MoonStep, { task: string; action: string; lesson: string }> = {
  discover: { task: "Meet the moonflower", action: "Inspect the vine", lesson: "This is a moonflower, a climbing vine that blooms at night. Its big white flowers open at dusk and close by morning." },
  trellis: { task: "Give the vine support", action: "Tie vine to trellis", lesson: "Moonflower vines can climb 10 to 15 feet. Give them a trellis or string early, and gently wrap new tendrils around it." },
  water: { task: "Water at the roots", action: "Water the soil", lesson: "Keep the soil evenly moist, not soggy. Water at the base in the evening and let the top inch dry between drinks." },
  night: { task: "Wait for the moon", action: "Let night fall", lesson: "Moonflowers need full sun by day to store energy, then they open as light fades. Watch closely at dusk!" },
  bloom: { task: "Moonflower in bloom!", action: "Start over", lesson: "Each bloom lasts one night, perfumed to attract hawk moths. Real plants take 2 to 3 months from seed to first flower." },
};
export function createMoonQuest() {
  const listeners = new Set<(step: MoonStep) => void>();
  const state = { index: 0, step: "discover" as MoonStep };
  return {
    state,
    subscribe(l: (step: MoonStep) => void) { listeners.add(l); return () => { listeners.delete(l); }; },
    /** Completes the current task and returns the lesson for it. */
    advance(): string {
      const lesson = MOON_TASKS[state.step].lesson;
      state.index = (state.index + 1) % MOON_STEPS.length;
      state.step = MOON_STEPS[state.index]!;
      listeners.forEach((l) => l(state.step));
      return lesson;
    },
  };
}
export type MoonQuest = ReturnType<typeof createMoonQuest>;
/** How tall the vine is (0..1) and how open the flowers are (0..1) at each step. */
export function moonVisual(step: MoonStep) {
  const i = MOON_STEPS.indexOf(step);
  return { vine: [0.25, 0.4, 0.85, 1, 1][i]!, bloom: step === "bloom" ? 1 : 0, wet: i >= 3, night: step === "bloom" };
}
