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
