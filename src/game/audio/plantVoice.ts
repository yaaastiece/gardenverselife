import { audioContext, getGardenVolume } from "./mixer";
import type { PlantletId } from "../plants/plantlets";

// Cute plantlet noises, synthesized on the device. Rules (gesture + cooldown) are plain and testable.
export type PlantSound = "poke" | "squeeze";
export const SQUEEZE_MS = 250;
export const COOLDOWN_MS = 180;
export const soundForHold = (ms: number): PlantSound => (ms >= SQUEEZE_MS ? "squeeze" : "poke");

export function createCooldown(ms = COOLDOWN_MS) {
  let last = -Infinity;
  return (now: number) => { if (now - last < ms) return false; last = now; return true; };
}

type Note = { f0: number; f1: number; t: number; dur: number; type: OscillatorType; gain: number };
/** Pepper Peony = bright bubbly chirp; Lumibud = soft glassy bloop with a twinkle. */
export function notesFor(id: PlantletId, sound: PlantSound): Note[] {
  if (id === "lumibud") return sound === "poke"
    ? [{ f0: 520, f1: 300, t: 0, dur: 0.16, type: "sine", gain: 0.5 }, { f0: 1760, f1: 1760, t: 0.1, dur: 0.18, type: "triangle", gain: 0.15 }]
    : [{ f0: 320, f1: 620, t: 0, dur: 0.35, type: "sine", gain: 0.5 }, { f0: 1568, f1: 2093, t: 0.25, dur: 0.25, type: "triangle", gain: 0.15 }];
  return sound === "poke"
    ? [{ f0: 900, f1: 1500, t: 0, dur: 0.09, type: "triangle", gain: 0.4 }, { f0: 1200, f1: 1900, t: 0.09, dur: 0.1, type: "triangle", gain: 0.35 }]
    : [{ f0: 700, f1: 1400, t: 0, dur: 0.22, type: "square", gain: 0.12 }, { f0: 1400, f1: 900, t: 0.2, dur: 0.18, type: "triangle", gain: 0.35 }, { f0: 1300, f1: 2000, t: 0.36, dur: 0.12, type: "triangle", gain: 0.3 }];
}

const ready = createCooldown();
export function playPlantSound(id: PlantletId, sound: PlantSound) {
  const vol = getGardenVolume();
  if (vol <= 0 || !ready(performance.now())) return;
  const ctx = audioContext(); if (!ctx) return;
  const now = ctx.currentTime;
  const wobble = 1 + (Math.random() - 0.5) * 0.12;
  for (const n of notesFor(id, sound)) {
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = n.type;
    o.frequency.setValueAtTime(n.f0 * wobble, now + n.t);
    o.frequency.exponentialRampToValueAtTime(n.f1 * wobble, now + n.t + n.dur);
    g.gain.setValueAtTime(0.0001, now + n.t);
    g.gain.exponentialRampToValueAtTime(n.gain * vol * 0.5, now + n.t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, now + n.t + n.dur);
    o.connect(g).connect(ctx.destination); o.start(now + n.t); o.stop(now + n.t + n.dur + 0.02);
  }
}
