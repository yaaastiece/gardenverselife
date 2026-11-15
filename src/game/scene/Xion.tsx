import { useMemo, useRef } from "react";
import { useFrame, useLoader, type ThreeEvent } from "@react-three/fiber";
import { Billboard, Sparkles } from "@react-three/drei";
import * as THREE from "three";
import xion from "@/assets/xion_front.png.asset.json";
import { PALETTE, XION } from "../config";
import { isDrag, type XionInteraction } from "../interaction";

// Xion: fairy-sized billboard sprite that hovers by the seedling and greets the player.
export function Xion({ interaction }: { interaction: XionInteraction }) {
  const tex = useLoader(THREE.TextureLoader, xion.url);
  tex.colorSpace = THREE.SRGBColorSpace;
  const group = useRef<THREE.Group>(null);
  const gesture = useRef<{ id: number; start: { x: number; y: number }; dragged: boolean; offset: THREE.Vector3 } | null>(null);
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), -XION.hover), []);
  const hit = useMemo(() => new THREE.Vector3(), []);
  const halo = useMemo(() => {
    const canvas = document.createElement("canvas"); canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext("2d");
    if (ctx) { const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32); gradient.addColorStop(0, PALETTE.pinkSoft); gradient.addColorStop(1, "transparent"); ctx.fillStyle = gradient; ctx.fillRect(0, 0, 64, 64); }
    return new THREE.CanvasTexture(canvas);
  }, []);
  const down = (e: ThreeEvent<PointerEvent>) => {
    if (gesture.current) return;
    e.stopPropagation();
    interaction.begin();
    plane.constant = -interaction.state.position.y;
    e.ray.intersectPlane(plane, hit);
    gesture.current = { id: e.pointerId, start: { x: e.clientX, y: e.clientY }, dragged: false, offset: new THREE.Vector3(interaction.state.position.x, interaction.state.position.y, interaction.state.position.z).sub(hit) };
    e.target.setPointerCapture(e.pointerId);
  };
  const move = (e: ThreeEvent<PointerEvent>) => {
    const g = gesture.current;
    if (!g || g.id !== e.pointerId) return;
    e.stopPropagation();
    g.dragged ||= isDrag(g.start, { x: e.clientX, y: e.clientY });
    if (g.dragged && e.ray.intersectPlane(plane, hit)) { hit.add(g.offset); interaction.move({ x: hit.x, y: hit.y, z: hit.z }); }
  };
  const up = (e: ThreeEvent<PointerEvent>) => {
    const g = gesture.current;
    if (!g || g.id !== e.pointerId) return;
    e.stopPropagation(); gesture.current = null;
    e.target.releasePointerCapture(e.pointerId);
    interaction.release(g.dragged);
  };
  const w = useMemo(() => XION.height * (tex.image ? tex.image.width / tex.image.height : 0.4), [tex]);
  useFrame(({ clock }) => {
    if (group.current) {
      const p = interaction.state.position;
      group.current.position.set(p.x, p.y + Math.sin(clock.elapsedTime * XION.bobSpeed) * XION.bobAmount, p.z);
    }
  });
  return (
    <group>
      <group ref={group} position={XION.position}>
        <Billboard>
          <mesh position={[0, 0, -0.015]}><planeGeometry args={[0.6, 0.65]} /><meshBasicMaterial map={halo} transparent opacity={0.3} depthWrite={false} toneMapped={false} /></mesh>
          <mesh><planeGeometry args={[w, XION.height]} /><meshBasicMaterial map={tex} transparent alphaTest={0.05} toneMapped={false} side={THREE.DoubleSide} /></mesh>
          <mesh position={[0, 0, 0.015]} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={(e) => { e.stopPropagation(); gesture.current = null; interaction.state.dragging = false; }} onClick={(e) => e.stopPropagation()}>
            <planeGeometry args={[Math.max(w, 0.32), 0.56]} /><meshBasicMaterial transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
          </mesh>
        </Billboard>
        <Sparkles count={14} scale={[0.25, 0.35, 0.25]} size={1.6} speed={0.4} color={PALETTE.pinkSoft} />
        <pointLight position={[0, 0, 0.15]} color={PALETTE.pink} intensity={0.6} distance={0.8} />
      </group>
    </group>
  );
}
