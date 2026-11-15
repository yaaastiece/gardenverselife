import { useSyncExternalStore } from "react";
import { Mic, Music, Pause, Play, SkipForward, Sparkles, X } from "lucide-react";
import type { Radio } from "../audio/radio";
import { getVoiceVolume, onVoiceVolume, setVoiceVolume } from "../xion/voice";

// Screen controls for the sound bowl; VR shows the same actions on a floating panel.
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

export function SoundBowlCard({ radio, onMeditate, visuals, setVisuals, onClose }: {
  radio: Radio; onMeditate: () => void; visuals: boolean; setVisuals: (v: boolean) => void; onClose: () => void;
}) {
  const r = useSyncExternalStore(radio.subscribe, radio.getSnapshot, radio.getSnapshot);
  const voice = useSyncExternalStore(onVoiceVolume, getVoiceVolume, getVoiceVolume);
  return (
    <aside className="gv-bowl" aria-label="Sound bowl radio">
      <div className="gv-bowl-head"><span>Sound bowl</span><button type="button" aria-label="Close sound bowl" onClick={onClose}><X size={14} /></button></div>
      <button type="button" className="gv-bowl-meditate" onClick={onMeditate}><Sparkles size={16} /> Meditate with Xion</button>
      <p className="gv-bowl-sub">2-minute breathing with Xion</p>
      <label className="gv-bowl-check"><input type="checkbox" checked={visuals} onChange={(e) => setVisuals(e.target.checked)} /> Show Orbis visuals</label>
      <p className="gv-bowl-track">{radio.track?.title}</p>
      <div className="gv-bowl-row">
        <button type="button" aria-label={r.playing ? "Pause music" : "Play music"} onClick={() => void radio.toggle()}>{r.playing ? <Pause size={16} /> : <Play size={16} />}</button>
        <button type="button" aria-label="Next song" onClick={() => void radio.next()}><SkipForward size={16} /></button>
      </div>
      {r.error && <p className="gv-bowl-note">{r.error}</p>}
      <VolumeRow label="Music" icon={<Music size={13} />} value={r.volume} onChange={(v) => radio.setVolume(v)} />
      <VolumeRow label="Voice" icon={<Mic size={13} />} value={voice} onChange={setVoiceVolume} />
    </aside>
  );
}
