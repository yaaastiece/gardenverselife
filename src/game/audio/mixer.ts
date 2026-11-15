// Volume controls for music and Xion's voice. Real <audio> elements go through a Web Audio gain
// node (phones like iPhone ignore element.volume); anything else falls back to .volume.
type Volumed = { volume: number };
let ctx: AudioContext | null = null;
const gains = new WeakMap<object, GainNode>();

function gainFor(el: Volumed): GainNode | null {
  if (typeof window === "undefined" || typeof HTMLMediaElement === "undefined" || !(el instanceof HTMLMediaElement)) return null;
  const existing = gains.get(el); if (existing) return existing;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  try {
    ctx ??= new AC();
    const g = ctx.createGain(); ctx.createMediaElementSource(el).connect(g).connect(ctx.destination);
    gains.set(el, g); el.volume = 1; return g;
  } catch { return null; }
}
/** Apply a 0..1 volume to a player; call inside a tap so the sound system can wake up. */
export function applyVolume(el: Volumed, volume: number) {
  const g = gainFor(el);
  if (g && ctx) { if (ctx.state === "suspended") void ctx.resume(); g.gain.setTargetAtTime(volume, ctx.currentTime, 0.05); }
  else el.volume = volume;
}
export const clampVolume = (v: number) => (Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0.7);
export function loadVolume(key: string, fallback: number) {
  try { const raw = localStorage.getItem(key); return raw === null ? fallback : clampVolume(Number(raw)); } catch { return fallback; }
}
export function saveVolume(key: string, v: number) { try { localStorage.setItem(key, String(v)); } catch { /* private mode */ } }

/** Shared sound context (created lazily inside a tap). */
export function audioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  ctx ??= new AC(); if (ctx.state === "suspended") void ctx.resume(); return ctx;
}
export const GARDEN_VOLUME_KEY = "gv-garden-volume";
let gardenVolume = typeof window === "undefined" ? 0.8 : loadVolume(GARDEN_VOLUME_KEY, 0.8);
const gardenSubs = new Set<() => void>();
/** Garden sounds (city hum, wind, plantlet noises) 0..1, saved per device. */
export function getGardenVolume() { return gardenVolume; }
export function setGardenVolume(v: number) { gardenVolume = clampVolume(v); saveVolume(GARDEN_VOLUME_KEY, gardenVolume); gardenSubs.forEach((f) => f()); }
export function onGardenVolume(f: () => void) { gardenSubs.add(f); return () => { gardenSubs.delete(f); }; }
