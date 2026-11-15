import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import { Billboard, Sparkles } from "@react-three/drei";
import * as THREE from "three";
import s1 from "@/assets/companion_1_seedling.png.asset.json";
import s2 from "@/assets/companion_2_sprout.png.asset.json";
import s3 from "@/assets/companion_3_young.png.asset.json";
import s4 from "@/assets/companion_4_queen.png.asset.json";
import { COMPANION, GLOW, SWAY_SPEED, companionLayout } from "../plants/companion";
import { status, type PlantCare } from "../plants/care";
import { PALETTE, WIND } from "../config";

// Camera-facing 4-stage companion; its whole sprite is the watering click target.
export function PlantCompanion({ stage, care, onWater, onHover }: { stage: number; care: PlantCare; onWater: () => void; onHover: (h: boolean) => void }) {
  const texes = useLoader(THREE.TextureLoader, [s1.url, s2.url, s3.url, s4.url]);
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
  useEffect(() => {
    if (stage === shown.current) return;
    setPrev(shown.current); shown.current = stage; fade.current = 0; setBurst((b) => b + 1);
  }, [stage]);
  const glowTex = useMemo(() => {
    const c = document.createElement("canvas"); c.width = c.height = 64;
    const g = c.getContext("2d");
    if (g) { const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, PALETTE.pink); r.addColorStop(1, "transparent"); g.fillStyle = r; g.fillRect(0, 0, 64, 64); }
    return new THREE.CanvasTexture(c);
  }, []);
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
      const drop = cond === "Struggling" ? COMPANION.struggleDrop : 1;
      root.current.scale.set(pop, THREE.MathUtils.lerp(root.current.scale.y / Math.max(pop, 0.01), drop, 0.08) * pop, pop);
    }
    if (glowMat.current) glowMat.current.opacity = THREE.MathUtils.lerp(glowMat.current.opacity, GLOW[cond], 0.05);
  });

  return (
    <group ref={root} position={[0, -COMPANION.sink, 0]}>
      <Billboard lockX lockZ>
        <sprite position={[0, cur.y - cur.h * 0.05 + COMPANION.heights[stage]! * 0.5 - cur.y + 0.02, -0.02]} scale={[COMPANION.heights[stage]! * 1.6, COMPANION.heights[stage]! * 1.6, 1]} renderOrder={-1}>
          <spriteMaterial ref={glowMat} map={glowTex} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
        </sprite>
        {prev !== stage && <mesh position={[old.x, old.y, 0]}><planeGeometry args={[old.w, old.h]} /><meshBasicMaterial ref={prevMat} map={texes[prev]} transparent alphaTest={0.02} depthWrite={false} toneMapped={false} /></mesh>}
        <mesh position={[cur.x, cur.y, 0.001]}
          onClick={(e) => { e.stopPropagation(); onWater(); }}
          onPointerOver={(e) => { e.stopPropagation(); onHover(true); }} onPointerOut={() => onHover(false)}>
          <planeGeometry args={[cur.w, cur.h]} />
          <meshBasicMaterial ref={curMat} map={texes[stage]} transparent alphaTest={0.02} toneMapped={false} />
        </mesh>
      </Billboard>
      {burst > 0 && <PinkBurst key={burst} y={COMPANION.heights[stage]! * 0.5} />}
    </group>
  );
}

function PinkBurst({ y }: { y: number }) {
  const [on, setOn] = useState(true);
  useEffect(() => { const t = setTimeout(() => setOn(false), 1600); return () => clearTimeout(t); }, []);
  return on ? <Sparkles position={[0, y, 0]} count={40} scale={[0.7, 0.8, 0.7]} size={5} speed={1.2} color={PALETTE.pinkSoft} /> : null;
}
