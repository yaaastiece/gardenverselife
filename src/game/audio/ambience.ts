// Synthesized city hum + wind (no external files).
export function createAmbience() {
  const ctx = new AudioContext();
  const master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);
  const len = ctx.sampleRate * 4;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.5; }
  const mkNoise = () => { const s = ctx.createBufferSource(); s.buffer = buf; s.loop = true; s.start(); return s; };
  // hum
  const hum = mkNoise(); const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 180;
  const humG = ctx.createGain(); humG.gain.value = 0.5; hum.connect(lp).connect(humG).connect(master);
  const osc = ctx.createOscillator(); osc.frequency.value = 55; const oG = ctx.createGain(); oG.gain.value = 0.03; osc.connect(oG).connect(master); osc.start();
  // wind
  const wind = mkNoise(); const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 600; bp.Q.value = 0.7;
  const wG = ctx.createGain(); wG.gain.value = 0.25; wind.connect(bp).connect(wG).connect(master);
  const lfo = ctx.createOscillator(); lfo.frequency.value = 0.12; const lfoG = ctx.createGain(); lfoG.gain.value = 0.18;
  lfo.connect(lfoG).connect(wG.gain); lfo.start();
  let on = false; let ducked = false;
  const apply = () => master.gain.setTargetAtTime(on ? (ducked ? 0.15 : 0.6) : 0, ctx.currentTime, 0.4);
  return {
    async setPlaying(next: boolean) {
      if (ctx.state === "suspended") await ctx.resume();
      on = next; apply();
    },
    /** Fade the city sound down while the sound bowl plays music. */
    duck(next: boolean) { ducked = next; apply(); },
    dispose() { void ctx.close(); },
  };
}
