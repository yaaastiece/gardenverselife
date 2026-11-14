import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import { Billboard, Html, Sparkles } from "@react-three/drei";
import * as THREE from "three";
import xion from "@/assets/xion_front.png.asset.json";
import { PALETTE, XION } from "../config";

// Xion: fairy-sized billboard sprite that hovers by the seedling and greets the player.
export function Xion() {
  const tex = useLoader(THREE.TextureLoader, xion.url);
  tex.colorSpace = THREE.SRGBColorSpace;
  const group = useRef<THREE.Group>(null);
  const [bubble, setBubble] = useState<"show" | "fade" | "gone">("show");
  useEffect(() => {
    const a = setTimeout(() => setBubble("fade"), XION.bubbleMs);
    const b = setTimeout(() => setBubble("gone"), XION.bubbleMs + XION.fadeMs);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, []);
  const w = useMemo(() => XION.height * (tex.image ? tex.image.width / tex.image.height : 0.4), [tex]);
  useFrame(({ clock }) => {
    if (group.current) group.current.position.y = XION.hover + Math.sin(clock.elapsedTime * XION.bobSpeed) * XION.bobAmount;
  });
  return (
    <group position={XION.position}>
      <group ref={group}>
        <Billboard lockX lockZ>
          <mesh><planeGeometry args={[w, XION.height]} /><meshBasicMaterial map={tex} transparent alphaTest={0.05} toneMapped={false} side={THREE.DoubleSide} /></mesh>
        </Billboard>
        <Sparkles count={14} scale={[0.25, 0.35, 0.25]} size={1.6} speed={0.4} color={PALETTE.pinkSoft} />
        <pointLight position={[0, 0, 0.15]} color={PALETTE.pink} intensity={0.6} distance={0.8} />
        {bubble !== "gone" && (
          <Html position={[0, XION.height / 2 + 0.06, 0]} center style={{ pointerEvents: "none" }}>
            <div className={`gv-bubble${bubble === "fade" ? " gv-bubble--fade" : ""}`} role="status">{XION.welcome}</div>
          </Html>
        )}
      </group>
    </group>
  );
}
