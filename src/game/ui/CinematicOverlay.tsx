import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Volume2, VolumeX, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { CinematicSession } from "../cinematic/session";

export function CinematicOverlay({ session }: { session: CinematicSession }) {
  const state = useSyncExternalStore(session.subscribe, session.getSnapshot, session.getSnapshot);
  const video = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  useEffect(() => { if (!state.open) setMuted(true); }, [state.open]);
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
    <DialogContent className="gv-cinematic" aria-describedby={undefined}>
      <DialogTitle className="sr-only">Gardenverse cinematic</DialogTitle>
      <video ref={video} className="gv-cinematic-video" autoPlay playsInline muted={muted}
        onLoadedData={() => session.framesArrived()} onPlaying={() => {
          if (video.current && video.current.readyState >= 2 && video.current.videoWidth > 0) session.framesArrived();
        }} />
      {state.phase === "loading" && <div className="gv-cinematic-message" role="status"><LoaderCircle className="gv-cinematic-spinner" aria-hidden />Loading the cinematic</div>}
      {state.phase === "error" && <div className="gv-cinematic-message" role="alert"><p>{state.error}</p><Button className="gv-sound" onClick={() => void session.close()}>Skip</Button></div>}
      <div className="gv-cinematic-controls">
        <Button variant="ghost" className="gv-sound" disabled={!state.stream || state.phase === "error"} aria-label={muted ? "Unmute cinematic" : "Mute cinematic"} onClick={() => setMuted((value) => !value)}>{muted ? <VolumeX /> : <Volume2 />}{muted ? "Unmute" : "Mute"}</Button>
      </div>
    </DialogContent>
  </Dialog>;
}