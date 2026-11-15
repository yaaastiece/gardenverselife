import { useSyncExternalStore } from "react";
import { Pause, Play, SkipForward, Sparkles, X } from "lucide-react";
import type { Radio } from "../audio/radio";

// Screen controls for the sound bowl; VR shows the same actions on a floating panel.
export function SoundBowlCard({ radio, onMeditate, visuals, setVisuals, onClose }: {
  radio: Radio; onMeditate: () => void; visuals: boolean; setVisuals: (v: boolean) => void; onClose: () => void;
}) {
  const r = useSyncExternalStore(radio.subscribe, radio.getSnapshot, radio.getSnapshot);
  return (
    <aside className="gv-bowl" aria-label="Sound bowl radio">
      <div className="gv-bowl-head"><span>Sound bowl</span><button type="button" aria-label="Close sound bowl" onClick={onClose}><X size={14} /></button></div>
      <p className="gv-bowl-track">{radio.track?.title}</p>
      <div className="gv-bowl-row">
        <button type="button" aria-label={r.playing ? "Pause music" : "Play music"} onClick={() => void radio.toggle()}>{r.playing ? <Pause size={16} /> : <Play size={16} />}</button>
        <button type="button" aria-label="Next song" onClick={() => void radio.next()}><SkipForward size={16} /></button>
      </div>
      <label className="gv-bowl-volume">
        <span>Volume</span>
        <input type="range" min={0} max={100} step={1} value={Math.round(r.volume * 100)} aria-label="Music volume" onChange={(e) => radio.setVolume(Number(e.target.value) / 100)} />
        <span>{Math.round(r.volume * 100)}</span>
      </label>
      {r.error && <p className="gv-bowl-note">{r.error}</p>}
      <button type="button" className="gv-bowl-meditate" onClick={onMeditate}><Sparkles size={14} /> Meditate with Xion</button>
      <label className="gv-bowl-check"><input type="checkbox" checked={visuals} onChange={(e) => setVisuals(e.target.checked)} /> Show Orbis visuals</label>
    </aside>
  );
}
