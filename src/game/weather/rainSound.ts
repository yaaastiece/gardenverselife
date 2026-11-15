import { audioContext, getGardenVolume, onGardenVolume } from "../audio/mixer";
// Soft synthesized rain under the garden volume; fades in/out with the weather.
let gain: GainNode | null = null; let on = false;
function build() {
  const ctx = audioContext(); if (!ctx) return null;
  const len = ctx.sampleRate * 3; const buf = ctx.createBuffer(1, len, ctx.sampleRate); const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (Math.random() < 0.002 ? 1 : 0.35);
  const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
  const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 900;
  const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 6000;
  const g = ctx.createGain(); g.gain.value = 0;
  src.connect(hp).connect(lp).connect(g).connect(ctx.destination); src.start();
  onGardenVolume(apply);
  return g;
}
function apply() { const ctx = audioContext(); if (gain && ctx) gain.gain.setTargetAtTime(on ? 0.18 * getGardenVolume() : 0, ctx.currentTime, 0.8); }
/** Call from a tap (or after the sound system is awake). */
export function setRain(next: boolean) { on = next; if (next && !gain) gain = build(); apply(); }
