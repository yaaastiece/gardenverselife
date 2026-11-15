import { useSyncExternalStore } from "react";
import { Leaf, Mic, Music } from "lucide-react";
import type { Radio } from "../audio/radio";
import { getGardenVolume, onGardenVolume, setGardenVolume } from "../audio/mixer";
import { getVoiceVolume, onVoiceVolume, setVoiceVolume } from "../xion/voice";

function VolumeRow({ label, icon, value, onChange }: { label: string; icon: React.ReactNode; value: number; onChange: (v: number) => void }) {
  const pct = Math.round(value * 100);
  return (
    <label className="gv-bowl-volume">
      {icon}<span className="gv-bowl-volume-name">{label}</span>
      <input type="range" min={0} max={100} step={1} value={pct} aria-label={`${label} volume`}
        onPointerDown={(e) => e.stopPropagation()} onInput={(e) => onChange(Number((e.target as HTMLInputElement).value) / 100)} onChange={(e) => onChange(Number(e.target.value) / 100)} />
      <span className="gv-bowl-volume-num">{pct}</span>
    </label>
  );
}

/** Shared Garden / Music / Voice sliders; values live in mixer.ts, radio.ts and voice.ts. */
export function VolumeSliders({ radio, garden = false }: { radio: Radio; garden?: boolean }) {
  const r = useSyncExternalStore(radio.subscribe, radio.getSnapshot, radio.getSnapshot);
  const voice = useSyncExternalStore(onVoiceVolume, getVoiceVolume, getVoiceVolume);
  const g = useSyncExternalStore(onGardenVolume, getGardenVolume, getGardenVolume);
  return <>
    {garden && <VolumeRow label="Garden" icon={<Leaf size={13} />} value={g} onChange={setGardenVolume} />}
    <VolumeRow label="Music" icon={<Music size={13} />} value={r.volume} onChange={(v) => radio.setVolume(v)} />
    <VolumeRow label="Voice" icon={<Mic size={13} />} value={voice} onChange={setVoiceVolume} />
  </>;
}
