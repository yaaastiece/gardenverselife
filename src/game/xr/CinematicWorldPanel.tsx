import { useEffect, useMemo, useSyncExternalStore } from "react";
import * as THREE from "three";
import type { CinematicSession } from "../cinematic/session";
import { stageNarration } from "../cinematic/prompts";
import { speak, stopSpeaking, xionSpeechEnabled } from "../xion/voice";
import { WorldPanel } from "./WorldPanel";
import { HeadAnchored } from "./HeadAnchored";

const WIDTH = 4.6;
// A cinema screen just beyond the balcony rail, so the whole video can be taken in from the deck.
const SCREEN: [number, number, number] = [0, 2.35, -4.7];

// The Orbis video, shown as a big screen floating in the garden while you stay in VR.
export function CinematicWorldPanel({ session, narrate = true, frame = true }: { session: CinematicSession; narrate?: boolean; frame?: boolean }) {
  const state = useSyncExternalStore(session.subscribe, session.getSnapshot, session.getSnapshot);
  const video = useMemo(() => {
    const element = document.createElement("video");
    element.muted = true; element.playsInline = true; element.autoplay = true; element.crossOrigin = "anonymous";
    return element;
  }, []);
  const texture = useMemo(() => { const t = new THREE.VideoTexture(video); t.colorSpace = THREE.SRGBColorSpace; return t; }, [video]);
  useEffect(() => () => { texture.dispose(); video.srcObject = null; }, [texture, video]);

  // Narration, same as the screen version.
  useEffect(() => {
    if (!state.open || !narrate) return;
    if (xionSpeechEnabled()) speak(stageNarration(state.stage));
    return () => stopSpeaking();
  }, [state.open, state.stage, narrate]);

  useEffect(() => {
    if (!state.stream) return;
    video.srcObject = null; video.srcObject = state.stream;
    const play = () => void video.play().catch((error: unknown) => {
      if (error instanceof DOMException && error.name === "AbortError") return;
      session.playbackFailed();
    });
    const arrived = () => { if (video.readyState >= 2 && video.videoWidth > 0) session.framesArrived(); };
    const tracks = state.stream.getTracks();
    tracks.forEach((track) => track.addEventListener("unmute", play));
    video.addEventListener("loadeddata", arrived); video.addEventListener("playing", arrived);
    play();
    return () => { tracks.forEach((track) => track.removeEventListener("unmute", play)); video.removeEventListener("loadeddata", arrived); video.removeEventListener("playing", arrived); video.pause(); video.srcObject = null; };
  }, [state.stream, video, session]);

  useEffect(() => {
    if (!state.open || state.phase !== "loading") return;
    const timeout = setTimeout(() => session.playbackFailed(), 90000);
    return () => clearTimeout(timeout);
  }, [session, state.open, state.phase]);

  const playing = state.phase === "playing";
  // The screen always has a face: faint glass with a label, so you can see where Orbis plays and how to start it.
  const label = state.open ? (state.phase === "error" ? (state.error ?? "This cinematic couldn’t play.") : "Orbis is dreaming…") : "Press B or Y → Orbis videos to play";
  const face = useMemo(() => {
    const c = document.createElement("canvas"); c.width = 1024; c.height = 576; const x = c.getContext("2d");
    if (x) {
      x.fillStyle = "rgba(255,95,192,0.07)"; x.fillRect(0, 0, 1024, 576);
      x.textAlign = "center"; x.fillStyle = "#ffb3e0"; x.font = "bold 84px sans-serif"; x.fillText("ORBIS", 512, 270);
      x.font = "36px sans-serif"; x.fillStyle = "#ffd9f0"; x.fillText(label, 512, 340);
    }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }, [label]);
  useEffect(() => () => face.dispose(), [face]);
  const H = WIDTH * 9 / 16; const T = 0.05;
  return <>
    <group position={SCREEN} visible={frame}>
      {/* A framed screen: dark back plate, glowing pink bezel, and two slim posts down to the ground. */}
      <mesh position={[0, 0, -0.01]} visible={!playing} raycast={() => {}}><planeGeometry args={[WIDTH, H]} /><meshBasicMaterial map={face} transparent depthWrite={false} toneMapped={false} side={THREE.DoubleSide} /></mesh>
      {([[0, H / 2 + T / 2, WIDTH + T * 2, T], [0, -H / 2 - T / 2, WIDTH + T * 2, T], [-WIDTH / 2 - T / 2, 0, T, H], [WIDTH / 2 + T / 2, 0, T, H]] as const).map(([x, y, w, h], i) =>
        <mesh key={i} position={[x, y, 0.0]} raycast={() => {}}><boxGeometry args={[w, h, 0.05]} /><meshBasicMaterial color="#ff5fc0" transparent opacity={0.4} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} /></mesh>)}
      {[-WIDTH / 2 + 0.3, WIDTH / 2 - 0.3].map((x) => <mesh key={x} position={[x, -(SCREEN[1] - (SCREEN[1] - H / 2) / 2), -0.08]} raycast={() => {}}><boxGeometry args={[0.1, SCREEN[1] - H / 2, 0.1]} /><meshBasicMaterial color="#ff5fc0" transparent opacity={0.18} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} /></mesh>)}
    </group>
    <group position={SCREEN} visible={state.open && playing}>
      <mesh raycast={() => {}}><planeGeometry args={[WIDTH, WIDTH * 9 / 16]} /><meshBasicMaterial map={texture} toneMapped={false} side={THREE.DoubleSide} /></mesh>
    </group>
    <HeadAnchored active={state.open && !playing} distance={1} drop={0.6}>
      <WorldPanel width={0.7}
        title={state.phase === "error" ? "Xion" : "Orbis cinematic"}
        lines={state.phase === "error" ? [state.error ?? "This cinematic couldn’t play."] : ["Xion is weaving the garden into a moving dream…"]}
        buttons={[{ label: state.phase === "error" ? "Back to the garden" : "Skip", action: () => void session.close() }]} />
    </HeadAnchored>
  </>;
}
