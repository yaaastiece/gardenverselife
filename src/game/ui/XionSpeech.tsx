import { useEffect, useState, type RefObject } from "react";
import { FADE_MS, SPEECH_MS, type Speech, type XionInteraction } from "../interaction";

// Screen presentation only; an XR panel can subscribe to the same speech events.
export function XionSpeech({ interaction, bubbleRef }: { interaction: XionInteraction; bubbleRef: RefObject<HTMLDivElement | null> }) {
  const [speech, setSpeech] = useState<Speech | null>(interaction.state.speech);
  const [phase, setPhase] = useState("show");
  useEffect(() => interaction.subscribe(setSpeech), [interaction]);
  useEffect(() => {
    setPhase("show");
    if (!speech) return;
    const fade = setTimeout(() => setPhase("fade"), SPEECH_MS);
    const hide = setTimeout(() => setPhase("gone"), SPEECH_MS + FADE_MS);
    return () => { clearTimeout(fade); clearTimeout(hide); };
  }, [speech]);
  if (!speech || phase === "gone") return null;
  return <div ref={bubbleRef} className={`gv-bubble${phase === "fade" ? " gv-bubble--fade" : ""}`} role="status" aria-live="polite"><span className="gv-bubble-name">Xion</span>{speech.text}</div>;
}