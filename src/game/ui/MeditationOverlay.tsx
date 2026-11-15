import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Square } from "lucide-react";
import type { Meditation } from "../meditation/meditation";
import type { CinematicSession } from "../cinematic/session";
import type { Radio } from "../audio/radio";
import { VolumeSliders } from "./VolumeSliders";

// Captions, breathing guide and optional Orbis visuals for the guided meditation.
export function MeditationOverlay({ meditation, visuals, radio }: { meditation: Meditation; visuals: CinematicSession; radio: Radio }) {
  const m = useSyncExternalStore(meditation.subscribe, meditation.getSnapshot, meditation.getSnapshot);
  const v = useSyncExternalStore(visuals.subscribe, visuals.getSnapshot, visuals.getSnapshot);
  const [breath, setBreath] = useState(meditation.breath);
  const video = useRef<HTMLVideoElement>(null);
  useEffect(() => { if (!m.active) return; const id = window.setInterval(() => setBreath(meditation.breath), 100); return () => window.clearInterval(id); }, [m.active, meditation]);
  useEffect(() => { if (video.current && video.current.srcObject !== v.stream) video.current.srcObject = v.stream; }, [v.stream]);
  if (!m.active) return null;
  return (
    <div className="gv-meditate" role="region" aria-label="Guided meditation">
      {v.open && <div className="gv-meditate-visuals">
        <video ref={video} autoPlay muted playsInline onPlaying={() => visuals.framesArrived()} onLoadedData={() => visuals.framesArrived()} />
        {v.phase === "loading" && <p className="gv-meditate-status">Loading visuals…</p>}
        {v.phase === "error" && <p className="gv-meditate-status">Visuals aren't available right now. The meditation continues.</p>}
      </div>}
      <div className="gv-breath" style={{ transform: `scale(${0.7 + 0.3 * breath.level})` }} aria-hidden="true" />
      <p className="gv-breath-label">{breath.label}</p>
      <div className="gv-meditate-caption"><b>Xion</b><span>{meditation.caption}</span></div>
      <div className="gv-meditate-vol"><VolumeSliders radio={radio} /></div>
      <button type="button" className="gv-meditate-stop" onClick={() => meditation.stop()}><Square size={12} /> End meditation</button>
    </div>
  );
}
