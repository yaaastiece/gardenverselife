// Plain TS condition rules for the four garden beds; screen cards or future WebXR panels subscribe to the same state.
import type { CareAction } from "./care";

export type BedKind = "tomato" | "herb" | "rose" | "lettuce" | "strawberry" | "pepper";
export type BedStat = "water" | "sun" | "soil";
export type BedState = { water: number; sun: number; soil: number; lightUntil: number; compostAt: number };
export type BedAlert = { bed: number; key: BedStat | "tooWet"; text: string };

export const BEDS = {
  // Slower than the center plant (0.5/0.3/0.15) so beds stay healthy for several minutes.
  drift: { water: 0.12, sun: 0.08, soil: 0.04 },
  boost: { water: 25, sun: 30, soil: 25 },
  overwater: 90, overwaterSoilLoss: 5, low: 30, thriving: 60,
  alertCooldown: 30, lightSeconds: 5,
  starts: [[72, 68, 78], [66, 80, 70], [78, 70, 65], [70, 75, 74]] as [number, number, number][],
  // Each bed is called by its signature plant in Xion's alerts.
  names: ["tomato", "strawberry", "pepper", "rose"],
};

export const PLANT_INFO: Record<BedKind, { name: string; likes: string }> = {
  tomato: { name: "Tomato", likes: "Loves 6 to 8 hours of sun and deep, steady watering at the base." },
  herb: { name: "Basil", likes: "Likes 6 or more hours of sun. Water when the top inch of soil feels dry." },
  rose: { name: "Rose", likes: "Needs about 6 hours of sun and good airflow. Water at the soil, not the petals." },
  lettuce: { name: "Lettuce", likes: "Likes cooler weather and steady moisture. Gets bitter and bolts in the heat." },
  strawberry: { name: "Strawberry", likes: "Wants 6 to 8 hours of sun and steady moisture. Keep the fruit off wet soil." },
  pepper: { name: "Pepper", likes: "Loves warmth and 6 to 8 hours of sun. Water when the top inch of soil is dry." },
};

const WHY: Record<BedStat | "tooWet", string> = {
  water: "is thirsty. Water deeply at the base.",
  sun: "needs more light. Give it 6 or more hours of sun.",
  soil: "has tired soil. Feed it some compost.",
  tooWet: "is too wet. Let the soil dry before watering again.",
};
export const bedAlertText = (bed: number, key: BedStat | "tooWet") => `The ${BEDS.names[bed] ?? "garden"} bed ${WHY[key]}`;

const clamp = (v: number) => Math.max(0, Math.min(100, v));
export function bedStatus(s: Pick<BedState, BedStat>): "Thriving" | "Okay" | "Struggling" {
  const min = Math.min(s.water, s.sun, s.soil);
  if (min < BEDS.low || s.water > BEDS.overwater) return "Struggling";
  return min > BEDS.thriving ? "Thriving" : "Okay";
}
/** 0 = full and healthy, 1 = fully drooping. */
export function wilt(s: Pick<BedState, BedStat>) {
  const st = bedStatus(s);
  return st === "Struggling" ? 1 : st === "Okay" ? 0.25 : 0;
}

export function createBedCare(count = BEDS.starts.length) {
  let time = 0;
  const beds: BedState[] = Array.from({ length: count }, (_, i) => {
    const [water, sun, soil] = BEDS.starts[i % BEDS.starts.length]!;
    return { water, sun, soil, lightUntil: -1, compostAt: -1 };
  });
  const lastAlert = beds.map(() => -Infinity);
  const subs = new Set<() => void>();
  const alertSubs = new Set<(a: BedAlert) => void>();
  const emit = () => subs.forEach((f) => f());
  const check = (i: number) => {
    const b = beds[i]!;
    const key: BedStat | "tooWet" | null = b.water > BEDS.overwater ? "tooWet" : (["water", "sun", "soil"] as const).find((k) => b[k] < BEDS.low) ?? null;
    if (!key || time - lastAlert[i]! < BEDS.alertCooldown) return;
    lastAlert[i] = time;
    alertSubs.forEach((f) => f({ bed: i, key, text: bedAlertText(i, key) }));
  };
  return {
    beds,
    get time() { return time; },
    subscribe(f: () => void) { subs.add(f); return () => { subs.delete(f); }; },
    onAlert(f: (a: BedAlert) => void) { alertSubs.add(f); return () => { alertSubs.delete(f); }; },
    tick(dt: number) {
      time += dt;
      beds.forEach((b, i) => {
        b.water = clamp(b.water - BEDS.drift.water * dt);
        b.sun = clamp(b.sun - BEDS.drift.sun * dt);
        b.soil = clamp(b.soil - BEDS.drift.soil * dt);
        check(i);
      });
      emit();
    },
    /** Xion's help: lifts a low bar to `to`, never to full. */
    assist(i: number, a: CareAction, to: number) {
      const b = beds[i]; if (!b || b[a] >= to) return false;
      b[a] = clamp(to);
      if (a === "sun") b.lightUntil = time + BEDS.lightSeconds;
      if (a === "soil") b.compostAt = time;
      emit(); return true;
    },
    act(i: number, a: CareAction) {
      const b = beds[i]; if (!b) return;
      b[a] = clamp(b[a] + BEDS.boost[a]);
      if (a === "water" && b.water > BEDS.overwater) b.soil = clamp(b.soil - BEDS.overwaterSoilLoss);
      if (a === "sun") b.lightUntil = time + BEDS.lightSeconds;
      if (a === "soil") b.compostAt = time;
      check(i); emit();
    },
  };
}
export type BedCare = ReturnType<typeof createBedCare>;

// Which plant is hovered/selected; shared by the 3D scene and the screen card.
export type PlantPick = { bed: number; kind: BedKind; pos: { x: number; y: number; z: number } };
export type PlantFx = { pos: PlantPick["pos"]; action: CareAction; id: number };
export function createPlantSelection() {
  const state = { hover: null as PlantPick | null, selected: null as PlantPick | null, fx: null as PlantFx | null };
  const subs = new Set<() => void>();
  const emit = () => subs.forEach((f) => f());
  let fxId = 0;
  return {
    state,
    subscribe(f: () => void) { subs.add(f); return () => { subs.delete(f); }; },
    hover(p: PlantPick | null) { state.hover = p; emit(); },
    select(p: PlantPick | null) { state.selected = p; emit(); },
    clear() { if (state.selected || state.hover) { state.selected = null; state.hover = null; emit(); } },
    effectAt(pos: PlantPick["pos"], action: CareAction) { state.fx = { pos, action, id: ++fxId }; emit(); },
    effect(action: CareAction) { if (state.selected) { state.fx = { pos: state.selected.pos, action, id: ++fxId }; emit(); } },
  };
}
export type PlantSelection = ReturnType<typeof createPlantSelection>;
