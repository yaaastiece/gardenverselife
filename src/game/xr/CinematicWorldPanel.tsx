import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { CinematicSession } from "../cinematic/session";
import { stageNarration } from "../cinematic/prompts";
import { speak, stopSpeaking, xionSpeechEnabled } from "../xion/voice";
import { WorldPanel } from "./WorldPanel";

const WIDTH = 2.2;

// The Orbis video, shown as a big screen floating in the garden while you stay in VR.
export function CinematicWorldPanel({ session, narrate = true }: { session: CinematicSession; narrate?: boolean }) {
  const state = useSyncExternalStore(session.subscribe, session.getSnapshot, session.getSnapshot);
  const anchor = useRef<THREE.Group>(null);
  const placed = useRef(false);
  const { gl } = useThree();
  const pose = useMemo(() => ({ position: new THREE.Vector3(), direction: new THREE.Vector3() }), []);
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

  useEffect(() => { if (!state.open) placed.current = false; }, [state.open]);
  useFrame(() => {
    const group = anchor.current; if (!group) return;
    group.visible = state.open;
    if (!state.open || placed.current) return;
    const camera = gl.xr.getCamera(); camera.getWorldPosition(pose.position); camera.getWorldDirection(pose.direction);
    pose.direction.y = 0; pose.direction.normalize();
    if (pose.position.y < 0.3) return;
    // Float it in front of you, a little above eye height so the garden stays visible below.
    group.position.copy(pose.position).addScaledVector(pose.direction, 2.4); group.position.y = pose.position.y + 0.25;
    group.rotation.y = Math.atan2(-pose.direction.x, -pose.direction.z);
    placed.current = true;
  });

  const playing = state.phase === "playing";
  return <group ref={anchor} visible={false}>
    {playing && <mesh raycast={() => {}}><planeGeometry args={[WIDTH, WIDTH * 9 / 16]} /><meshBasicMaterial map={texture} toneMapped={false} side={THREE.DoubleSide} /></mesh>}
    <WorldPanel position={[0, playing ? -WIDTH * 9 / 32 - 0.16 : 0, 0.02]} width={0.7}
      title={state.phase === "error" ? "Xion" : "Orbis cinematic"}
      lines={state.phase === "error" ? [state.error ?? "This cinematic couldn’t play."] : playing ? [] : ["Xion is weaving the garden into a moving dream…"]}
      buttons={[{ label: state.phase === "error" ? "Back to the garden" : "Skip", action: () => void session.close() }]} />
  </group>;
}
