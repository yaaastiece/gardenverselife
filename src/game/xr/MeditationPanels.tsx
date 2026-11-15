import { useEffect, useState, useSyncExternalStore } from "react";
import type { Radio } from "../audio/radio";
import type { Meditation } from "../meditation/meditation";
import { BOWL_POS } from "../scene/SoundBowl";
import { WorldPanel } from "./WorldPanel";

// VR presentation of the sound bowl and meditation; rules stay in radio.ts and meditation.ts.
export function BowlWorldPanel({ radio, onMeditate, onClose }: { radio: Radio; onMeditate: () => void; onClose: () => void }) {
  const r = useSyncExternalStore(radio.subscribe, radio.getSnapshot, radio.getSnapshot);
  return <WorldPanel position={[BOWL_POS[0], 1.2, BOWL_POS[2] + 0.3]} width={0.5} title="Sound bowl" lines={[radio.track?.title ?? ""]}
    buttons={[{ label: r.playing ? "Pause" : "Play", action: () => void radio.toggle() }, { label: "Next song", action: () => void radio.next() }, { label: "Meditate with Xion", action: onMeditate }, { label: "Close", action: onClose }]} />;
}
export function MeditationWorldPanel({ meditation }: { meditation: Meditation }) {
  const m = useSyncExternalStore(meditation.subscribe, meditation.getSnapshot, meditation.getSnapshot);
  const [label, setLabel] = useState(meditation.breath.label);
  useEffect(() => { const id = window.setInterval(() => setLabel(meditation.breath.label), 250); return () => window.clearInterval(id); }, [meditation]);
  if (!m.active) return null;
  return <WorldPanel position={[1.55, 1.15, -1.55]} width={0.6} title={`Xion · ${label}`} lines={[meditation.caption]} buttons={[{ label: "End meditation", action: () => meditation.stop() }]} />;
}
