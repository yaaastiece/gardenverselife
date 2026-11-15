import { useMemo, useRef, useState } from "react";
import { useFrame, useLoader, type ThreeEvent } from "@react-three/fiber";
import { Billboard, Sparkles } from "@react-three/drei";
import * as THREE from "three";
import xion from "@/assets/xion_front.png.asset.json";
import seatedFront from "@/assets/xion_seated.png.asset.json";
import seatedBack from "@/assets/xion_seated_back.png.asset.json";
import { PAD_FACING, SEAT_Y, type Meditation } from "../meditation/meditation";
import { PALETTE, XION } from "../config";
import { isDrag, type XionInteraction } from "../interaction";

import { useXR } from "@react-three/xr";
import { VR } from "../xr/rules";

// Xion: fairy-sized billboard sprite that hovers by the seedling and greets the player.
const SEATED_HEIGHT = 0.34;
export function Xion({ interaction, meditation }: { interaction: XionInteraction; meditation?: Meditation }) {
  const inVR = useXR((s) => Boolean(s.session));
  const [hover, setHover] = useState(false);
  const tex = useLoader(THREE.TextureLoader, xion.url);
  tex.colorSpace = THREE.SRGBColorSpace;
  const [front, back] = useLoader(THREE.TextureLoader, [seatedFront.url, seatedBack.url]);
  front.colorSpace = THREE.SRGBColorSpace; back.colorSpace = THREE.SRGBColorSpace;
  const sprite = useRef<THREE.Mesh>(null);
  const seatedRoot = useRef<THREE.Group>(null);
  const seatedMat = useRef<THREE.MeshBasicMaterial>(null);
  const toCam = useMemo(() => new THREE.Vector3(), []);
  const group = useRef<THREE.Group>(null);
  const gesture = useRef<{ id: number; start: { x: number; y: number }; dragged: boolean; offset: THREE.Vector3; spatial: boolean; worldStart: THREE.Vector3 } | null>(null);
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
    plane.constant = -interaction.state.position.y;
    const spatial = inVR && "pointerPosition" in e;
    if (spatial) hit.copy(e.point); else if (!e.ray.intersectPlane(plane, hit)) return;
    interaction.begin();
    gesture.current = { id: e.pointerId, start: { x: e.clientX, y: e.clientY }, dragged: false, spatial, worldStart: hit.clone(), offset: new THREE.Vector3(interaction.state.position.x, interaction.state.position.y, interaction.state.position.z).sub(hit) };
    (e.target as Element | null)?.setPointerCapture(e.pointerId);
  };
  const move = (e: ThreeEvent<PointerEvent>) => {
    const g = gesture.current;
    if (!g || g.id !== e.pointerId) return;
    e.stopPropagation();
    if (g.spatial) {
      hit.copy(e.point);
      g.dragged ||= hit.distanceTo(g.worldStart) >= VR.dragMeters;
      if (g.dragged) { hit.add(g.offset); interaction.move({ x: hit.x, y: hit.y, z: hit.z }); }
    } else {
      g.dragged ||= isDrag(g.start, { x: e.clientX, y: e.clientY });
      if (g.dragged && e.ray.intersectPlane(plane, hit)) { hit.add(g.offset); interaction.move({ x: hit.x, y: hit.y, z: hit.z }); }
    }
  };
  const up = (e: ThreeEvent<PointerEvent>) => {
    const g = gesture.current;
    if (!g || g.id !== e.pointerId) return;
    e.stopPropagation(); gesture.current = null;
    (e.target as Element | null)?.releasePointerCapture(e.pointerId);
    interaction.release(g.dragged);
  };
  const w = useMemo(() => XION.height * (tex.image ? tex.image.width / tex.image.height : 0.4), [tex]);
  useFrame(({ clock, camera }) => {
    const seated = Boolean(meditation?.getSnapshot().seated);
    if (group.current) {
      const p = interaction.state.position;
      group.current.visible = !seated;
      group.current.position.set(p.x, p.y + Math.sin(clock.elapsedTime * XION.bobSpeed) * XION.bobAmount, p.z);
    }
    if (seatedRoot.current && seatedMat.current) {
      seatedRoot.current.visible = seated;
      if (seated) {
        const p = interaction.state.position;
        seatedRoot.current.position.set(p.x, SEAT_Y + SEATED_HEIGHT / 2, p.z);
        // Show her back when the viewer is behind the pad.
        toCam.set(camera.position.x - p.x, 0, camera.position.z - p.z);
        const behind = toCam.x * Math.sin(PAD_FACING) + toCam.z * Math.cos(PAD_FACING) < 0;
        const map = behind ? back : front;
        if (seatedMat.current.map !== map) { seatedMat.current.map = map; seatedMat.current.needsUpdate = true; }
        const img = map.image as { width: number; height: number } | undefined;
        sprite.current?.scale.set(SEATED_HEIGHT * (img ? img.width / img.height : 0.8), SEATED_HEIGHT, 1);
      }
    }
  });
  return (
    <group>
      <group ref={group} position={XION.position}>
        <Billboard>
          <mesh position={[0, 0, -0.015]}><planeGeometry args={[0.6, 0.65]} /><meshBasicMaterial map={halo} transparent opacity={0.3} depthWrite={false} toneMapped={false} /></mesh>
          <mesh><planeGeometry args={[w, XION.height]} /><meshBasicMaterial map={tex} transparent alphaTest={0.05} toneMapped={false} side={THREE.DoubleSide} /></mesh>
          <mesh position={[0, 0, 0.015]} onPointerOver={() => setHover(true)} onPointerOut={() => setHover(false)} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={(e) => { e.stopPropagation(); gesture.current = null; interaction.state.dragging = false; }} onClick={(e) => e.stopPropagation()}>
            <planeGeometry args={[Math.max(w, 0.32), 0.56]} /><meshBasicMaterial transparent opacity={inVR && hover ? 0.12 : 0} color={PALETTE.green} depthWrite={false} side={THREE.DoubleSide} />
          </mesh>
        </Billboard>
        <Sparkles count={inVR ? 4 : 14} scale={[0.25, 0.35, 0.25]} size={1.6} speed={0.4} color={PALETTE.pinkSoft} />
        <pointLight position={[0, 0, 0.15]} color={PALETTE.pink} intensity={0.6} distance={0.8} />
      </group>
      <group ref={seatedRoot} visible={false}>
        <Billboard lockX lockZ>
          <mesh ref={sprite} raycast={() => null}><planeGeometry args={[1, 1]} /><meshBasicMaterial ref={seatedMat} map={front} transparent alphaTest={0.05} toneMapped={false} side={THREE.DoubleSide} /></mesh>
        </Billboard>
        <Sparkles count={inVR ? 4 : 10} scale={[0.35, 0.3, 0.35]} size={1.4} speed={0.25} color={PALETTE.pinkSoft} />
      </group>
    </group>
  );
}
