import { useState, useSyncExternalStore } from "react";
import { ArrowRight, Volume2, VolumeX, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import xion from "@/assets/xion_front.png.asset.json";
import skyline from "@/assets/skyline_wide.jpg.asset.json";
import { PLANTLETS, type PlantletId } from "../plants/plantlets";
import type { StartScreen } from "../start";
import { onXionSpeechPreference, setXionSpeechEnabled, xionSpeechEnabled, speak, stopSpeaking } from "../xion/voice";

// Vite discovers an optional raw video or its CDN pointer, without a missing import.
const pointers = import.meta.glob<{ url: string }>("/src/assets/**/start-loop.mp4.asset.json", { eager: true, import: "default" });
const videos = import.meta.glob<string>("/src/assets/**/start-loop.mp4", { eager: true, query: "?url", import: "default" });
const loop = Object.values(pointers)[0]?.url ?? Object.values(videos)[0];

export function PlantletPicker({ start, onVR, vrError }: { start: StartScreen; onVR?: () => void; vrError: string }) {
  const state = useSyncExternalStore(start.subscribe, start.getSnapshot);
  const voiced = useSyncExternalStore(onXionSpeechPreference, xionSpeechEnabled);
  const [videoFailed, setVideoFailed] = useState(false);
  const waiting = state.phase === "waiting";
  const leaving = state.phase === "leaving";
  return <section className="gv-start" data-leaving={leaving ? "" : undefined} role="dialog" aria-modal="true" aria-labelledby="gv-start-title">
    <img className="gv-start-back" src={skyline.url} alt="" />
    {loop && !videoFailed && <video className="gv-start-back" src={loop} autoPlay muted loop playsInline onError={() => setVideoFailed(true)} />}
    <div className="gv-start-shade" />
    <div className="gv-start-content">
      <div className="gv-start-top"><h1 id="gv-start-title">Gardenverse</h1><div className="gv-start-options">
        {onVR && <Button variant="ghost" onClick={onVR} disabled={leaving}>Enter VR</Button>}
        <Button variant="ghost" aria-pressed={voiced} onClick={() => { setXionSpeechEnabled(!voiced); if (voiced) stopSpeaking(); else if (!waiting) speak(state.text); }} aria-label="Xion speaks">{voiced ? <Volume2 /> : <VolumeX />}<span>Xion speaks</span></Button>
      </div></div>
      <div className="gv-start-welcome">
        <img className="gv-start-xion" src={xion.url} alt="Xion, your fairy garden guide" />
        <div className="gv-start-speech"><b>Xion</b><p aria-label={waiting ? "Tap to begin" : state.text}>{waiting ? "A little moonlight. A seed. A new beginning." : state.visibleText}<span className="gv-start-cursor" aria-hidden="true" /></p>
          {waiting && <Button className="gv-start-begin" onClick={start.begin}><Play />Tap to begin</Button>}
        </div>
      </div>
      <div className="gv-start-choice"><h2>Which seed will you plant?</h2>
        <div className="gv-start-cards">{(Object.keys(PLANTLETS) as PlantletId[]).map((id) => {
          const plant = PLANTLETS[id];
          return <Button variant="ghost" className="gv-start-card" key={id} aria-label={`Choose ${plant.name}`} aria-pressed={state.selected === id} disabled={waiting || leaving} onClick={() => start.select(id)}>
            <img src={plant.sprites[0]} alt="" /><b>{plant.name}</b><span>{plant.tagline}</span>
          </Button>;
        })}</div>
      </div>
      <div className="gv-start-footer"><Button className="gv-start-enter" disabled={!state.selected || waiting || leaving} onClick={start.enter}>Enter the garden<ArrowRight /></Button>{vrError && <p role="status">{vrError}</p>}</div>
    </div>
  </section>;
}
