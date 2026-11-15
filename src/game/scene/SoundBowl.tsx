import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { useFrame } from "@react-three/fiber";
import { Billboard, Outlines } from "@react-three/drei";
import { bowlHint, BOWL_HINT_TEXT } from "../audio/bowlHint";
import * as THREE from "three";
import { PALETTE } from "../config";
import { bowlLight, type Radio } from "../audio/radio";
import type { Meditation } from "../meditation/meditation";

export const BOWL_POS: [number, number, number] = [1.05, 0, -2.35];

// Singing-bowl radio beside the meditation pad: LED ring shifts colors; the little screen shows play state and song.
export function SoundBowl({ radio, meditation, onOpen }: { radio: Radio; meditation: Meditation; onOpen: () => void }) {
  const r = useSyncExternalStore(radio.subscribe, radio.getSnapshot, radio.getSnapshot);
  const ring = useRef<THREE.MeshBasicMaterial>(null);
  const glow = useRef<THREE.MeshBasicMaterial>(null);
  const screen = useMemo(() => {
    const canvas = document.createElement("canvas"); canvas.width = 256; canvas.height = 128;
    const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace; return { canvas, tex };
  }, []);
  useEffect(() => {
    const ctx = screen.canvas.getContext("2d"); if (!ctx) return;
    ctx.fillStyle = PALETTE.ink; ctx.fillRect(0, 0, 256, 128);
    ctx.strokeStyle = PALETTE.pink; ctx.lineWidth = 6; ctx.strokeRect(3, 3, 250, 122);
    ctx.fillStyle = PALETTE.green;
    if (r.playing) { ctx.fillRect(28, 32, 16, 52); ctx.fillRect(54, 32, 16, 52); }
    else { ctx.beginPath(); ctx.moveTo(30, 30); ctx.lineTo(74, 58); ctx.lineTo(30, 86); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = PALETTE.pinkSoft; ctx.font = "bold 22px sans-serif"; ctx.fillText(radio.track?.title ?? "", 92, 52);
    ctx.fillStyle = PALETTE.moon; ctx.font = "16px sans-serif"; ctx.fillText(r.playing ? "Playing" : "Tap to play", 92, 82);
    screen.tex.needsUpdate = true;
  }, [r, radio, screen]);
  useEffect(() => () => screen.tex.dispose(), [screen]);
  useFrame(({ clock }) => {
    const m = meditation.getSnapshot();
    const light = bowlLight(clock.elapsedTime, r.playing, m.active ? meditation.breath.level : null);
    ring.current?.color.set(light.color);
    if (glow.current) { glow.current.color.set(light.color); glow.current.opacity = 0.25 + 0.5 * light.intensity; }
  });
  const open = (e: { stopPropagation: () => void }) => { e.stopPropagation(); bowlHint.markSeen(); onOpen(); };
  const tagMat = useRef<THREE.MeshBasicMaterial>(null);
  const tag = useMemo(() => {
    const canvas = document.createElement("canvas"); canvas.width = 512; canvas.height = 128;
    const c = canvas.getContext("2d");
    if (c) {
      c.fillStyle = "rgba(14,10,18,0.85)"; c.strokeStyle = PALETTE.pink; c.lineWidth = 8;
      c.beginPath(); c.roundRect(6, 6, 500, 116, 58); c.fill(); c.stroke();
      c.fillStyle = PALETTE.pinkSoft; c.font = "bold 50px sans-serif"; c.textAlign = "center"; c.textBaseline = "middle";
      c.fillText(BOWL_HINT_TEXT, 256, 66);
    }
    const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace; return tex;
  }, []);
  useEffect(() => () => tag.dispose(), [tag]);
  useFrame(({ clock }) => { if (tagMat.current) tagMat.current.opacity = meditation.getSnapshot().active ? 0 : bowlHint.opacity(clock.elapsedTime); });
  return (
    <group position={BOWL_POS} rotation-y={0.3}>
      <Billboard position={[0, 0.72, 0]}>
        <mesh onClick={open}><planeGeometry args={[0.44, 0.11]} /><meshBasicMaterial ref={tagMat} map={tag} transparent toneMapped={false} depthWrite={false} /></mesh>
      </Billboard>
      <mesh position={[0, 0.16, 0]} onClick={open}><cylinderGeometry args={[0.07, 0.1, 0.32, 16]} /><meshStandardMaterial color="#2a2530" metalness={0.6} roughness={0.35} /><Outlines thickness={0.01} color={PALETTE.ink} /></mesh>
      <mesh position={[0, 0.39, 0]} rotation-x={Math.PI} onClick={open}><sphereGeometry args={[0.15, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#c9a46a" metalness={0.85} roughness={0.25} side={THREE.DoubleSide} /><Outlines thickness={0.01} color={PALETTE.ink} /></mesh>
      <mesh position={[0, 0.39, 0]} rotation-x={Math.PI / 2}><torusGeometry args={[0.15, 0.012, 8, 48]} /><meshBasicMaterial ref={ring} color={PALETTE.pink} toneMapped={false} /></mesh>
      <mesh position={[0, 0.37, 0]} rotation-x={-Math.PI / 2}><circleGeometry args={[0.13, 32]} /><meshBasicMaterial ref={glow} color={PALETTE.pink} transparent opacity={0.4} toneMapped={false} depthWrite={false} /></mesh>
      <mesh position={[0, 0.2, 0.095]} rotation-x={-0.25} onClick={(e) => { e.stopPropagation(); void radio.toggle(); }}>
        <planeGeometry args={[0.18, 0.09]} /><meshBasicMaterial map={screen.tex} toneMapped={false} />
      </mesh>
    </group>
  );
}
