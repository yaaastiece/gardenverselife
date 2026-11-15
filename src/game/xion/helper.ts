// Plain TS "Xion helps": reviews garden health and runs a short care trip. Movement goes through the
// shared interaction.move(), so tracked hands or in-scene panels can drive the same flow later.
import type { CareAction } from "../plants/care";
import type { Point3 } from "../interaction";

export const HELP = { target: 60, needBelow: 45, maxPlants: 3, cooldown: 45, speed: 1.2, fixPause: 2.2, readPause: 4.5 };
export const CHECK_INTENT = /\b(check (on )?(my |the )?(garden|plants)|how are (my |the )?plants|how('s| is) (my |the )?garden)\b/i;

export type Patient = { id: string; label: string; stats: { water: number; sun: number; soil: number }; tooWet: boolean; perch: Point3; fx: Point3 };
export type Need = { patient: Patient; stat: CareAction; value: number };

const PROBLEM: Record<CareAction, [string, string]> = { water: ["is thirsty", "are thirsty"], sun: ["wants more light", "want more light"], soil: ["needs richer soil", "need richer soil"] };
const plural = (l: string) => l.endsWith("s");
const DID: Record<CareAction, (l: string) => string> = {
  water: (l) => `I watered the ${l} at the base, not the leaves, so the roots drink and the leaves stay dry.`,
  sun: (l) => `I gave the ${l} a warm grow light. Plants turn light into food, and most veggies want 6 to 8 hours a day.`,
  soil: (l) => `I mixed compost into the ${l}' soil. It feeds the roots slowly and helps the soil hold water.`,
};
export const TIPS = [
  "Tip: water in the morning so leaves dry before night and stay free of mildew.",
  "Tip: a layer of mulch keeps soil moist and roots cool on hot days.",
  "Tip: check under leaves once a week, that's where pests like aphids hide.",
];

/** Neediest first, one entry per plant (its lowest bar). */
export function findNeeds(patients: Patient[]): Need[] {
  return patients.map((p) => {
    const stat = (["water", "sun", "soil"] as const).reduce((a, b) => (p.stats[b] < p.stats[a] ? b : a));
    return { patient: p, stat, value: p.stats[stat] };
  }).filter((n) => n.value < HELP.needBelow).sort((a, b) => a.value - b.value);
}

export function report(patients: Patient[], tipIndex = 0): { text: string; needs: Need[] } {
  const needs = findNeeds(patients);
  const wet = patients.filter((p) => p.tooWet);
  if (!needs.length && !wet.length) return { text: `Everything is thriving! ${TIPS[tipIndex % TIPS.length]}`, needs };
  const parts = needs.slice(0, 3).map((n) => `the ${n.patient.label} ${PROBLEM[n.stat][plural(n.patient.label) ? 1 : 0]}`);
  wet.forEach((p) => parts.push(`the ${p.label} ${p.label.endsWith("s") ? "are" : "is"} too wet, so let the soil dry`));
  const happy = patients.filter((p) => !p.tooWet && !needs.some((n) => n.patient.id === p.id)).map((p) => p.label);
  const list = parts.length > 1 ? `${parts.slice(0, -1).join(", ")} and ${parts.at(-1)}` : parts[0]!;
  const lead = list.charAt(0).toUpperCase() + list.slice(1);
  const ok = happy.length ? ` The ${happy.slice(0, 2).join(" and ")} look happy.` : "";
  return { text: `${lead}.${ok}${needs.length ? " Want me to help?" : ""}`, needs };
}

type Deps = {
  move: (p: Point3) => void; position: () => Point3; say: (t: string) => void;
  fix: (n: Need) => void; onState: () => void;
};
export function createGardenHelper(deps: Deps) {
  const state = { busy: false, readyAt: 0, time: 0, offer: [] as Need[] };
  let queue: Need[] = []; let phase: "fly" | "pause" = "fly"; let wait = 0;
  const finish = () => { state.busy = false; queue = []; deps.onState(); };
  return {
    state,
    cooldownLeft() { return Math.max(0, Math.ceil(state.readyAt - state.time)); },
    setOffer(n: Need[]) { state.offer = n; deps.onState(); },
    /** Accept the offer; returns false while cooling down. */
    start() {
      if (state.busy || !state.offer.length || state.time < state.readyAt) return false;
      queue = state.offer.slice(0, HELP.maxPlants); state.offer = [];
      state.busy = true; state.readyAt = state.time + HELP.cooldown; phase = "fly"; deps.onState(); return true;
    },
    stop() { if (state.busy) finish(); },
    tick(dt: number) {
      const before = this.cooldownLeft();
      state.time += dt;
      if (before !== this.cooldownLeft()) deps.onState();
      if (!state.busy) return;
      const n = queue[0]; if (!n) { finish(); return; }
      if (phase === "fly") {
        const p = deps.position(); const t = n.patient.perch;
        const dx = t.x - p.x, dy = t.y - p.y, dz = t.z - p.z; const d = Math.hypot(dx, dy, dz);
        const step = HELP.speed * dt;
        if (d <= step) { deps.move(t); deps.fix(n); deps.say(DID[n.stat](n.patient.label)); phase = "pause"; wait = HELP.readPause; }
        else deps.move({ x: p.x + dx / d * step, y: p.y + dy / d * step, z: p.z + dz / d * step });
      } else if ((wait -= dt) <= 0) { queue.shift(); phase = "fly"; if (!queue.length) finish(); }
    },
  };
}
export type GardenHelper = ReturnType<typeof createGardenHelper>;
