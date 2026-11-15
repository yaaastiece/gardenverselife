import neon from "@/assets/song_neon_botanica.mp3.asset.json";
import night from "@/assets/song_night_garden.mp3.asset.json";
import planting from "@/assets/song_planting.mp3.asset.json";

import { applyVolume, clampVolume, loadVolume, saveVolume } from "./mixer";

export const MUSIC_VOLUME_KEY = "gv-music-volume";
export type Track = { title: string; url: string };
export const TRACKS: Track[] = [
  { title: "Neon Botanica", url: neon.url },
  { title: "Night Garden", url: night.url },
  { title: "Planting", url: planting.url },
];
/** LED colors the sound bowl cycles through. */
export const BOWL_COLORS = ["#ff5fb8", "#5dff8f", "#b47cff"] as const;
export const BOWL_CYCLE_SECONDS = 12;

export type RadioPlayer = { src: string; volume: number; play(): Promise<void>; pause(): void; onended: (() => void) | null };
export type RadioState = { playing: boolean; index: number; error: string | null; volume: number };

/** Playlist radio for the sound bowl: plays in order and loops; screen and XR panels only subscribe. */
export function createRadio(tracks: Track[] = TRACKS, makePlayer: () => RadioPlayer = () => new Audio() as unknown as RadioPlayer) {
  let state: RadioState = { playing: false, index: 0, error: null, volume: loadVolume(MUSIC_VOLUME_KEY, 0.7) };
  let player: RadioPlayer | null = null;
  const subs = new Set<() => void>();
  const set = (patch: Partial<RadioState>) => { state = { ...state, ...patch }; subs.forEach((f) => f()); };
  const ensure = () => {
    if (!player) { player = makePlayer(); applyVolume(player, state.volume); player.onended = () => { void radio.next(); }; }
    const want = tracks[state.index]?.url ?? "";
    if (!player.src.endsWith(want)) player.src = want;
    return player;
  };
  const radio = {
    getSnapshot: () => state,
    subscribe(f: () => void) { subs.add(f); return () => { subs.delete(f); }; },
    get track() { return tracks[state.index]; },
    async play() {
      const p = ensure();
      applyVolume(p, state.volume);
      set({ playing: true, error: null });
      try { await p.play(); } catch { set({ playing: false, error: "Tap play to start the music." }); }
    },
    /** Music volume 0..1, applied right away. */
    setVolume(v: number) { const volume = clampVolume(v); if (player) applyVolume(player, volume); saveVolume(MUSIC_VOLUME_KEY, volume); set({ volume }); },
    pause() { player?.pause(); set({ playing: false }); },
    toggle() { return state.playing ? (radio.pause(), Promise.resolve()) : radio.play(); },
    async next() {
      const wasPlaying = state.playing || !player;
      set({ index: (state.index + 1) % tracks.length });
      if (wasPlaying || state.playing) await radio.play(); else ensure();
    },
    dispose() { player?.pause(); player = null; subs.clear(); },
  };
  return radio;
}
export type Radio = ReturnType<typeof createRadio>;

function mix(a: string, b: string, t: number) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return "#" + pa.map((v, i) => Math.round(v + ((pb[i] ?? v) - v) * t).toString(16).padStart(2, "0")).join("");
}
/** The bowl's LED color and brightness at time t (seconds); breath (0..1) slows it to a soft pulse during meditation. */
export function bowlLight(t: number, playing: boolean, breath: number | null = null) {
  const pos = ((t / BOWL_CYCLE_SECONDS) % 1) * BOWL_COLORS.length;
  const i = Math.floor(pos);
  const color = mix(BOWL_COLORS[i % 3] ?? BOWL_COLORS[0], BOWL_COLORS[(i + 1) % 3] ?? BOWL_COLORS[0], pos - i);
  const intensity = breath !== null ? 0.35 + 0.65 * breath : playing ? 0.75 + 0.25 * Math.sin(t * 2) : 0.3;
  return { color, intensity };
}
