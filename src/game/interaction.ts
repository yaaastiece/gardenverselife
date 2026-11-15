import { PLANTER } from "./config";
// World-space interaction rules: pointer and future tracked-hand adapters share these.
export type Point3 = { x: number; y: number; z: number };
export type CareKind = "tomato" | "herb" | "rose" | "seedling";
export const SPEECH_MS = 6000;
export const FADE_MS = 1000;
export const DRAG_THRESHOLD = 6;
export const WELCOME = "Welcome to the Gardenverse. Here's your first seedling. Water it and watch it grow.";
export const CARE_TIPS: Record<CareKind, string> = {
  tomato: "Tomatoes love 6 to 8 hours of sun. Water deeply at the base, not on the leaves, and stake the vines as they grow.",
  herb: "Herbs like basil want lots of sun. Water when the top inch of soil feels dry, and pinch off flower buds so the leaves keep growing.",
  rose: "Roses need about 6 hours of sun and good airflow. Water at the soil, not the petals, to prevent mildew.",
  seedling: "Seedlings need steady moisture, not a flood. Too much water can rot the roots. Water when the surface starts to dry.",
};
export type CareTarget = { kind: CareKind; position: Point3 };
export const CARE_TARGETS: CareTarget[] = [
  { kind: "seedling", position: { x: PLANTER.x, y: 0.95, z: PLANTER.z } },
  ...Array.from({ length: 8 }, (_, j): CareTarget => ({ kind: [3, 4, 5, 7].includes(j) ? "tomato" : "herb", position: { x: -2.6, y: 0.85, z: 0.9 - j * 0.6 } })),
  { kind: "tomato", position: { x: -1.9, y: 0.85, z: -3.4 } },
  { kind: "herb", position: { x: -0.5, y: 0.85, z: -3.4 } },
  ...[1.1, 1.7, 2.3].map((x): CareTarget => ({ kind: "rose", position: { x, y: 0.9, z: -3.4 } })),
  ...[-2.8, -2.2, -1, -0.4].map((z): CareTarget => ({ kind: "rose", position: { x: 2.8, y: 0.9, z } })),
  { kind: "herb", position: { x: 2.8, y: 0.85, z: -1.6 } },
  ...[-0.3, -0.2, 0.2, 0.3].map((x): CareTarget => ({ kind: x < 0 ? "herb" : "rose", position: { x: PLANTER.x + x, y: 0.8, z: PLANTER.z } })),
];
export function nearestPlant(position: Point3, targets = CARE_TARGETS): CareKind | null {
  let distance = 0.85;
  let kind: CareKind | null = null;
  for (const target of targets) {
    const d = Math.hypot(position.x - target.position.x, (position.y - target.position.y) * 0.5, position.z - target.position.z);
    if (d < distance) { distance = d; kind = target.kind; }
  }
  return kind;
}
export function floatingPosition(p: Point3): Point3 {
  return { x: Math.max(-3, Math.min(3, p.x)), y: Math.max(0.65, Math.min(2.4, p.y)), z: Math.max(-3.5, Math.min(0.4, p.z)) };
}
export function isDrag(start: { x: number; y: number }, end: { x: number; y: number }) {
  return Math.hypot(end.x - start.x, end.y - start.y) >= DRAG_THRESHOLD;
}
export function speechPhase(elapsedMs: number) {
  return elapsedMs < SPEECH_MS ? "show" : elapsedMs < SPEECH_MS + FADE_MS ? "fade" : "gone";
}
export type Speech = { text: string; id: number };
export function createXionInteraction(initial: Point3) {
  const listeners = new Set<(speech: Speech | null) => void>();
  const state = { position: { ...initial }, focused: false, dragging: false, pointerHandled: false, speech: { text: WELCOME, id: 0 } as Speech | null };
  let sequence = 0;
  const say = (text: string | null) => {
    state.speech = text ? { text, id: ++sequence } : null;
    listeners.forEach((listener) => listener(state.speech));
  };
  return {
    state,
    subscribe(listener: (speech: Speech | null) => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    begin() { state.dragging = true; state.pointerHandled = true; },
    move(position: Point3) { state.position = floatingPosition(position); },
    release(dragged: boolean) {
      state.dragging = false;
      if (!dragged) {
        state.focused = !state.focused;
        const kind = nearestPlant(state.position);
        say(state.focused ? kind ? CARE_TIPS[kind] : WELCOME : null);
      } else {
        const kind = nearestPlant(state.position);
        if (kind) say(CARE_TIPS[kind]); else say(null);
      }
    },
    say,
    dismiss() { if (!state.dragging) { state.focused = false; say(null); } },
  };
}
export type XionInteraction = ReturnType<typeof createXionInteraction>;