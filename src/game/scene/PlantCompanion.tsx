import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import { Billboard, Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { currentPlantlet } from "../plants/plantlets";
import { playPlantSound, soundForHold } from "../audio/plantVoice";
import { COMPANION, GLOW, SWAY_SPEED, companionLayout } from "../plants/companion";
import { status, type PlantCare } from "../plants/care";
import { useXR } from "@react-three/xr";
import { PALETTE, WIND } from "../config";

// Camera-facing 4-stage companion; its whole sprite is the watering click target.
export function PlantCompanion({ stage, care, onWater, onHover }: { stage: number; care: PlantCare; onWater: () => void; onHover: (h: boolean) => void }) {
  const inVR = useXR((s) => Boolean(s.session));
  const [hovered, setHovered] = useState(false);
  const plantlet = currentPlantlet();
  const texes = useLoader(THREE.TextureLoader, [...plantlet.sprites]);
  const H = plantlet.heights;
  texes.forEach((t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; });
  const [prev, setPrev] = useState(stage);
  const [burst, setBurst] = useState(0);
  const fade = useRef(1);
  const shown = useRef(stage);
  const root = useRef<THREE.Group>(null);
  const curMat = useRef<THREE.MeshBasicMaterial>(null);
  const prevMat = useRef<THREE.MeshBasicMaterial>(null);
  const glowMat = useRef<THREE.SpriteMaterial>(null);
  const sway = useRef(0);
  const drop = useRef(1);
  const pressAt = useRef<number | null>(null);
  useEffect(() => {
    if (stage === shown.current) return;
    setPrev(shown.current); shown.current = stage; fade.current = 0; setBurst((b) => b + 1);
  }, [stage]);
  const glowTex = useMemo(() => {
    const c = document.createElement("canvas"); c.width = c.height = 64;
    const g = c.getContext("2d");
    if (g) { const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, plantlet.glowColor); r.addColorStop(1, "transparent"); g.fillStyle = r; g.fillRect(0, 0, 64, 64); }
    return new THREE.CanvasTexture(c);
  }, [plantlet.glowColor]);
  const cur = companionLayout(stage), old = companionLayout(prev);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const cond = status(care.state);
    fade.current = Math.min(1, fade.current + dt / COMPANION.fadeSec);
    const e = 1 - Math.pow(1 - fade.current, 3);
    if (curMat.current) curMat.current.opacity = e;
    if (prevMat.current) prevMat.current.opacity = 1 - e;
    sway.current += dt * WIND.speed * SWAY_SPEED[cond];
    if (root.current) {
      root.current.rotation.z = Math.sin(sway.current) * WIND.strength * 0.5;
      const pop = THREE.MathUtils.lerp(0.9, 1, e);
      drop.current = THREE.MathUtils.lerp(drop.current, cond === "Struggling" ? COMPANION.struggleDrop : 1, 0.08);
      root.current.scale.set(pop, pop * drop.current, pop);
    }
    if (glowMat.current) glowMat.current.opacity = THREE.MathUtils.lerp(glowMat.current.opacity, GLOW[cond] * (stage === 3 ? plantlet.queenGlow : 1), 0.05);
  });

  return (
    <group ref={root} position={[0, -COMPANION.sink, 0]}>
      <Billboard lockX lockZ>
        <sprite raycast={() => {}} position={[0, H[stage]! * 0.5, -0.02]} scale={[H[stage]! * 1.6, H[stage]! * 1.6, 1]} renderOrder={-1}>
          <spriteMaterial ref={glowMat} map={glowTex} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
        </sprite>
        {prev !== stage && <mesh position={[old.x, old.y, 0]}><planeGeometry args={[old.w, old.h]} /><meshBasicMaterial ref={prevMat} map={texes[prev] ?? null} transparent alphaTest={0.02} depthWrite={false} toneMapped={false} /></mesh>}
        <mesh position={[cur.x, cur.y, 0.001]}>
          <planeGeometry args={[cur.w, cur.h]} />
          <meshBasicMaterial ref={curMat} map={texes[stage] ?? null} transparent alphaTest={0.02} toneMapped={false} />
        </mesh>
        <mesh position={[0, H[stage]! * 0.5, 0.01]}
          onClick={(e) => { e.stopPropagation(); onWater(); }}
          onPointerDown={() => { pressAt.current = performance.now(); }}
          onPointerUp={() => { if (pressAt.current === null) return; playPlantSound(plantlet.id, soundForHold(performance.now() - pressAt.current)); pressAt.current = null; }}
          onPointerOver={(e) => { e.stopPropagation(); setHovered(true); onHover(true); }} onPointerOut={() => { setHovered(false); onHover(false); }}>
          <planeGeometry args={[H[stage]! * 0.62, H[stage]!]} />
          <meshBasicMaterial transparent opacity={inVR && hovered ? 0.12 : 0} color={PALETTE.green} depthWrite={false} />
        </mesh>
      </Billboard>
      {burst > 0 && <CompanionBurst key={burst} y={H[stage]! * 0.5} color={plantlet.burstColor} />}
    </group>
  );
}

function CompanionBurst({ y, color }: { y: number; color: string }) {
  const inVR = useXR((s) => Boolean(s.session));
  const [on, setOn] = useState(true);
  useEffect(() => { const t = setTimeout(() => setOn(false), 1600); return () => clearTimeout(t); }, []);
  return on ? <Sparkles position={[0, y, 0]} count={inVR ? 8 : 40} scale={[0.7, 0.8, 0.7]} size={5} speed={1.2} color={color} /> : null;
}
