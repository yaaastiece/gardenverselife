import { useSyncExternalStore } from "react";
import { Pause, Play, SkipForward, Sparkles, X } from "lucide-react";
import type { Radio } from "../audio/radio";
import { TRACKS } from "../audio/radio";
import { VolumeSliders } from "./VolumeSliders";

// Screen controls for the sound bowl; VR shows the same actions on a floating panel.
export function SoundBowlCard({ radio, onMeditate, visuals, setVisuals, onClose }: {
  radio: Radio; onMeditate: () => void; visuals: boolean; setVisuals: (v: boolean) => void; onClose: () => void;
}) {
  const r = useSyncExternalStore(radio.subscribe, radio.getSnapshot, radio.getSnapshot);
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
      <div className="gv-bowl-songs" role="list" aria-label="Songs">
        {TRACKS.map((t, i) => <button type="button" role="listitem" key={t.url} aria-current={i === r.index} onClick={() => void radio.select(i)}>{i === r.index && r.playing ? "♪ " : ""}{t.title}</button>)}
      </div>
      {r.error && <p className="gv-bowl-note">{r.error}</p>}
      <VolumeSliders radio={radio} />
    </aside>
  );
}
