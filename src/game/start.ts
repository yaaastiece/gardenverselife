import { PLANTLETS, type PlantletId } from "./plants/plantlets";

// Shared by the screen and world-space panel; no React, audio or XR dependencies.
export const START = {
  welcome: "Welcome to the Gardenverse. I'm Xion, your garden guide. Choose a plantlet person to grow, and I'll show you how to care for it.",
  fadeMs: 1000,
  characterMs: 30,
  distance: 1.9,
  chestOffset: 0,
};
export type StartState = { phase: "waiting" | "choosing" | "leaving" | "done"; selected: PlantletId | null; text: string; visibleText: string; opacity: number };
export function createStartScreen(actions: { speak: (text: string) => void; speechEnabled: () => boolean; enter: (id: PlantletId) => void; finish: () => void }, now = () => Date.now()) {
  let state: StartState = { phase: "waiting", selected: null, text: START.welcome, visibleText: "", opacity: 1 };
  let textAt = 0; let exitAt = 0;
  const subs = new Set<() => void>();
  const update = (next: Partial<StartState>) => { state = { ...state, ...next }; subs.forEach((f) => f()); };
  const say = (text: string) => { if (actions.speechEnabled()) actions.speak(text); };
  return {
    getSnapshot: () => state,
    subscribe(f: () => void) { subs.add(f); return () => { subs.delete(f); }; },
    begin() {
      if (state.phase !== "waiting") return;
      textAt = now(); update({ phase: "choosing" }); say(START.welcome);
    },
    select(id: PlantletId) {
      if (state.phase !== "choosing") return;
      const text = PLANTLETS[id].tagline;
      textAt = now(); update({ selected: id, text, visibleText: "" }); say(text);
    },
    enter() {
      if (state.phase !== "choosing" || !state.selected) return;
      exitAt = now(); update({ phase: "leaving" }); actions.enter(state.selected);
    },
    tick() {
      if (state.phase === "choosing") {
        const visibleText = state.text.slice(0, Math.floor((now() - textAt) / START.characterMs));
        if (visibleText !== state.visibleText) update({ visibleText });
      } else if (state.phase === "leaving") {
        const opacity = Math.max(0, 1 - (now() - exitAt) / START.fadeMs);
        update({ opacity, phase: opacity === 0 ? "done" : "leaving" });
        if (opacity === 0) actions.finish();
      }
    },
    reset() { update({ phase: "waiting", selected: null, text: START.welcome, visibleText: "", opacity: 1 }); },
  };
}
export type StartScreen = ReturnType<typeof createStartScreen>;