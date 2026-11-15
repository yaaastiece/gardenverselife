import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Volume2, VolumeX, LoaderCircle, Mic, Send, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { CinematicSession } from "../cinematic/session";
import { stageNarration } from "../cinematic/prompts";
import { STEERING_LIMIT, type CinematicSteering } from "../cinematic/steering";
import { speak, stopSpeaking, xionSpeechEnabled } from "../xion/voice";

function CinematicSteeringPanel({ session, steering, stage, ready }: { session: CinematicSession; steering: CinematicSteering; stage: number; ready: boolean }) {
  const steeringState = useSyncExternalStore(steering.subscribe, steering.getSnapshot, steering.getSnapshot);
  const [, setClock] = useState(0);
  useEffect(() => {
    steering.setStage(stage);
    return () => steering.stopVoice();
  }, [steering, stage]);
  useEffect(() => {
    const timer = window.setInterval(() => { steering.tick(); setClock((value) => value + 1); }, 250);
    return () => window.clearInterval(timer);
  }, [steering]);

  const remaining = steering.remaining();
  const blocked = !ready || steeringState.sending || remaining > 0;
  const submit = async (text: string) => {
    if (blocked) return;
    session.resetCountdown();
    await steering.submitCurrent(text);
  };
  const toggleDictation = () => {
    session.resetCountdown();
    if (steeringState.listening) steering.stopVoice(); else steering.startVoice();
  };

  return <div className="gv-cinematic-steering" aria-label="Steer the cinematic">
    <div className="gv-cinematic-chips" aria-label={`${stage + 1} stage suggestions`}>
      {steering.chips().map((suggestion, index) => <button key={`${index}-${suggestion}`} type="button" disabled={blocked}
        aria-label={index >= 2 ? `Xion suggests: ${suggestion}` : suggestion} onClick={() => void submit(suggestion)}>
        <span>{suggestion}</span>{index >= 2 && <small>Xion suggests</small>}
      </button>)}
    </div>
    <form className="gv-cinematic-prompt" onSubmit={(event) => { event.preventDefault(); void submit(steeringState.draft); }}>
      <input value={steeringState.draft} maxLength={STEERING_LIMIT} disabled={!ready} aria-label="What should happen next?" placeholder="What should happen next?"
        onChange={(event) => steering.edit(event.target.value)} />
      <button type="button" className="gv-cinematic-icon" data-on={steeringState.listening ? "" : undefined} disabled={!ready || steeringState.sending}
        aria-label={steeringState.listening ? "Stop dictation" : "Dictate a scene change"} title={steeringState.listening ? "Stop dictation" : "Dictate a scene change"} onClick={toggleDictation}>
        {steeringState.listening ? <Square size={17} /> : <Mic size={18} />}
      </button>
      <button type="submit" className="gv-cinematic-send" disabled={blocked || !steeringState.draft.trim()}
        aria-label={remaining > 0 ? `Send, available in ${remaining} seconds` : "Send scene change"}>
        <Send size={16} />{steeringState.sending ? "Sending" : remaining > 0 ? `${remaining}s` : "Send"}
      </button>
    </form>
    <div className="gv-cinematic-steering-status" aria-live="polite">
      {steeringState.listening && <span>Listening… {steeringState.draft || "speak now"}</span>}
      {!steeringState.listening && (steeringState.voiceMessage ?? steeringState.message) && <span role="status">{steeringState.voiceMessage ?? steeringState.message}</span>}
      {!steeringState.listening && !steeringState.voiceMessage && !steeringState.message && steeringState.sent && <span>Sent</span>}
    </div>
  </div>;
}

export function CinematicOverlay({ session, steering }: { session: CinematicSession; steering: CinematicSteering }) {
  const state = useSyncExternalStore(session.subscribe, session.getSnapshot, session.getSnapshot);
  const countdown = useSyncExternalStore(session.timer.subscribe, session.timer.getSnapshot, session.timer.getSnapshot);
  const video = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  useEffect(() => { if (!state.open) setMuted(true); }, [state.open]);
  useEffect(() => {
    if (!state.open) return;
    if (xionSpeechEnabled()) speak(stageNarration(state.stage));
    return () => stopSpeaking();
  }, [state.open, state.stage]);
  useEffect(() => {
    const element = video.current;
    if (!element || !state.stream) return;
    element.srcObject = null;
    element.srcObject = state.stream;
    const play = () => void element.play().catch((error: unknown) => {
      if (error instanceof DOMException && error.name === "AbortError") return;
      session.playbackFailed();
    });
    const tracks = state.stream.getTracks();
    tracks.forEach((track) => track.addEventListener("unmute", play));
    play();
    return () => { tracks.forEach((track) => track.removeEventListener("unmute", play)); element.pause(); element.srcObject = null; };
  }, [state.stream, state.open, session]);
  useEffect(() => {
    if (!state.open || state.phase !== "loading") return;
    const timeout = setTimeout(() => session.playbackFailed(), 90000);
    return () => clearTimeout(timeout);
  }, [session, state.open, state.phase]);

  return <Dialog open={state.open} onOpenChange={(open) => { if (!open) void session.close(); }}>
    <DialogContent className="gv-cinematic" data-ending={countdown.fading ? "" : undefined} aria-describedby={undefined}>
      <DialogTitle className="sr-only">Gardenverse cinematic</DialogTitle>
      {countdown.running && <progress className="gv-cinematic-progress" max={1} value={countdown.progress} aria-label="Cinematic time remaining" />}
      <video ref={video} className="gv-cinematic-video" autoPlay playsInline muted={muted}
        onLoadedData={() => session.framesArrived()} onPlaying={() => {
          if (video.current && video.current.readyState >= 2 && video.current.videoWidth > 0) session.framesArrived();
        }} />
      {state.phase === "loading" && <div className="gv-cinematic-message" role="status"><LoaderCircle className="gv-cinematic-spinner" aria-hidden />Loading the cinematic</div>}
      {state.phase === "error" && <div className="gv-cinematic-message" role="alert"><p>{state.error}</p><Button className="gv-sound" onClick={() => void session.close()}>Skip</Button></div>}
      <div className="gv-cinematic-controls">
        <Button variant="ghost" className="gv-sound" disabled={!state.stream || state.phase === "error"} aria-label={muted ? "Unmute cinematic" : "Mute cinematic"} onClick={() => setMuted((value) => !value)}>{muted ? <VolumeX /> : <Volume2 />}{muted ? "Unmute" : "Mute"}</Button>
      </div>
      <div className="gv-cinematic-story" data-stage={state.stage}>
        <CinematicSteeringPanel key={`${state.open}-${state.stage}`} session={session} steering={steering} stage={state.stage} ready={state.phase === "playing"} />
        <div className="gv-cinematic-caption" aria-live="polite"><b>Xion</b><p>{stageNarration(state.stage)}</p></div>
      </div>
    </DialogContent>
  </Dialog>;
}
