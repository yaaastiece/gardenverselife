import night from "@/assets/song_night_garden.mp3.asset.json";
import { applyVolume } from "./mixer";
import type { Radio } from "./radio";

/** Orbis videos are silent: this plays the ethereal "Night Garden" softly underneath, pausing the bowl radio meanwhile. */
export const CINEMATIC_TRACK = night.url;
export const CINEMATIC_MUSIC_LEVEL = 0.6; // relative to the player's music volume
export function createCinematicMusic(radio: Radio, makePlayer: () => HTMLAudioElement = () => new Audio()) {
  let player: HTMLAudioElement | null = null;
  let resumeRadio = false;
  let on = false;
  return {
    get playing() { return on; },
    start() {
      if (on) return; on = true;
      resumeRadio = radio.getSnapshot().playing; if (resumeRadio) radio.pause();
      player ??= makePlayer(); player.loop = true; player.src = CINEMATIC_TRACK;
      applyVolume(player, radio.getSnapshot().volume * CINEMATIC_MUSIC_LEVEL);
      void player.play().catch(() => undefined);
    },
    stop() {
      if (!on) return; on = false;
      player?.pause();
      if (resumeRadio) void radio.play();
      resumeRadio = false;
    },
  };
}
