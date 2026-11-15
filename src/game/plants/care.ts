// Plain TS plant-condition + growth rules; screen panels or WebXR panels subscribe to the same state.
import { SEEDLING_STAGES } from "./growth";

export type CareAction = "water" | "sun" | "soil";
export type AlertKey = "water" | "sun" | "soil" | "tooWet";
export const CARE = {
  start: 70,
  drift: { water: 0.5, sun: 0.3, soil: 0.15 }, // points per second
  boost: { water: 25, sun: 30, soil: 25 },
  overwater: 90, overwaterSoilLoss: 5,
  low: 30, growMin: 40, bonusMin: 60,
  pointsPerAction: 1, bonusPoints: 1.5, pointsPerStage: 3,
  alertCooldown: 30, lightSeconds: 5, sampleEvery: 5, historyLen: 36,
};
export const ALERTS: Record<AlertKey, string> = {
  water: "Your plant is thirsty. Water when the top inch of soil feels dry.",
  sun: "Your plant needs more light. Most herbs and veggies want 6 or more hours of sun.",
  soil: "The soil is tired. Mix in compost to bring nutrients back.",
  tooWet: "Too much water can rot roots. Let the soil dry a little before watering again.",
};
export const STAGE_NOTES = ["", "Your sprout is growing strong", "Your young plant is thriving", "Your plant is a Queen now!"];

export type CareState = { water: number; sun: number; soil: number; points: number; stage: number; time: number; history: number[]; lightUntil: number; compostAt: number; note: string | null; noteAt: number };
const clamp = (v: number) => Math.max(0, Math.min(100, v));
export const health = (s: Pick<CareState, "water" | "sun" | "soil">) => {
  const wet = s.water > CARE.overwater ? (s.water - CARE.overwater) * 2 : 0;
  return clamp((s.water + s.sun + s.soil) / 3 - wet);
};
export function status(s: CareState): "Thriving" | "Okay" | "Struggling" {
  const min = Math.min(s.water, s.sun, s.soil);
  if (min < CARE.low || s.water > CARE.overwater) return "Struggling";
  return min > CARE.bonusMin ? "Thriving" : "Okay";
}

export function createPlantCare() {
  const state: CareState = { water: CARE.start, sun: CARE.start, soil: CARE.start, points: 0, stage: 0, time: 0, history: [CARE.start], lightUntil: -1, compostAt: -1, note: null, noteAt: -1 };
  const lastAlert: Partial<Record<AlertKey, number>> = {};
  const subs = new Set<(s: CareState) => void>();
  const alertSubs = new Set<(k: AlertKey) => void>();
  let sampleT = 0;
  const emit = () => subs.forEach((f) => f(state));
  const alert = (k: AlertKey) => {
    const last = lastAlert[k];
    if (last !== undefined && state.time - last < CARE.alertCooldown) return;
    lastAlert[k] = state.time; alertSubs.forEach((f) => f(k));
  };
  const checkAlerts = () => {
    if (state.water > CARE.overwater) alert("tooWet");
    (["water", "sun", "soil"] as const).forEach((k) => { if (state[k] < CARE.low) alert(k); });
  };
  return {
    state,
    subscribe(f: (s: CareState) => void) { subs.add(f); return () => { subs.delete(f); }; },
    onAlert(f: (k: AlertKey) => void) { alertSubs.add(f); return () => { alertSubs.delete(f); }; },
    tick(dt: number) {
      state.time += dt;
      state.water = clamp(state.water - CARE.drift.water * dt);
      state.sun = clamp(state.sun - CARE.drift.sun * dt);
      state.soil = clamp(state.soil - CARE.drift.soil * dt);
      sampleT += dt;
      if (sampleT >= CARE.sampleEvery) { sampleT = 0; state.history = [...state.history, health(state)].slice(-CARE.historyLen); }
      checkAlerts(); emit();
    },
    /** Returns true when the plant advanced a stage. */
    act(a: CareAction) {
      const healthy = state.water > CARE.growMin && state.sun > CARE.growMin && state.soil > CARE.growMin;
      const bonus = state.water > CARE.bonusMin && state.sun > CARE.bonusMin && state.soil > CARE.bonusMin;
      state[a] = clamp(state[a] + CARE.boost[a]);
      if (a === "water" && state.water > CARE.overwater) state.soil = clamp(state.soil - CARE.overwaterSoilLoss);
      if (a === "sun") state.lightUntil = state.time + CARE.lightSeconds;
      if (a === "soil") state.compostAt = state.time;
      let advanced = false;
      const last = SEEDLING_STAGES.length - 1;
      if (healthy && state.stage < last) {
        state.points += bonus ? CARE.bonusPoints : CARE.pointsPerAction;
        if (state.points >= CARE.pointsPerStage) { state.points = 0; state.stage++; advanced = true; state.note = STAGE_NOTES[state.stage] ?? null; state.noteAt = state.time; }
      }
      checkAlerts(); emit();
      return advanced;
    },
  };
}
export type PlantCare = ReturnType<typeof createPlantCare>;
