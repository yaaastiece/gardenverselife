import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { BACKDROP, CARS, PALETTE } from "../config";

// Hover cars crossing the skyline in straight lanes; each pass picks a new lane height/depth.
const TRAIL = 10;
function trailGeo() {
  const g = new THREE.PlaneGeometry(1, 1, TRAIL, 1);
  const p = g.attributes["position"] as THREE.BufferAttribute; const a = new Float32Array(p.count);
  for (let i = 0; i < p.count; i++) { const x = p.getX(i) + 0.5; a[i] = x; p.setY(i, p.getY(i) * (0.3 + x * 0.7)); }
  g.setAttribute("alpha", new THREE.BufferAttribute(a, 1)); return g;
}
const trailMat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  uniforms: { color: { value: new THREE.Color(PALETTE.pink) } },
  vertexShader: `attribute float alpha; varying float vA; void main(){ vA = alpha; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform vec3 color; varying float vA; void main(){ gl_FragColor = vec4(color * 1.6, vA * vA * 0.85); }`,
});

function Car() {
  return (
    <group>
      <mesh scale={[1.1, 0.2, 0.42]}><sphereGeometry args={[1, 20, 10]} /><meshStandardMaterial color="#c9c6cf" metalness={0.7} roughness={0.25} emissive="#5a5560" emissiveIntensity={0.6} /></mesh>
      <mesh position={[0.15, 0.14, 0]} scale={[0.45, 0.16, 0.3]}><sphereGeometry args={[1, 16, 8]} /><meshStandardMaterial color="#ffc2e0" metalness={0.9} roughness={0.1} emissive={PALETTE.pink} emissiveIntensity={0.5} /></mesh>
      {[-1, 1].map((s) => <mesh key={s} position={[-0.75, 0.08, s * 0.32]} rotation={[s * 0.4, 0, 0.5]}><boxGeometry args={[0.35, 0.03, 0.16]} /><meshStandardMaterial color="#9a96a2" metalness={0.7} emissive="#4a4550" emissiveIntensity={0.5} /></mesh>)}
      <mesh position={[0, -0.17, 0]} rotation-x={Math.PI / 2}><torusGeometry args={[0.32, 0.03, 6, 24]} /><meshBasicMaterial color={PALETTE.pink} toneMapped={false} /></mesh>
      <mesh position={[1.08, 0, 0]}><sphereGeometry args={[0.06, 8, 6]} /><meshBasicMaterial color="#fff6fb" toneMapped={false} /></mesh>
      <mesh geometry={useMemo(trailGeo, [])} material={trailMat} position={[-2.9, 0, 0]} scale={[3.8, 0.22, 1]} />
    </group>
  );
}

type Lane = { y: number; depth: number; dir: number; start: number; dur: number; phase: number };
function newLane(i: number, now: number, r = Math.random): Lane {
  return { y: CARS.minY + r() * (CARS.maxY - CARS.minY), depth: BACKDROP.radius - 3 - r() * 4, dir: r() > 0.5 ? 1 : -1, start: now + i * 0 + r() * CARS.gap, dur: (CARS.minCross + r() * (CARS.maxCross - CARS.minCross)) * 3, phase: r() * Math.PI * 2 };
}

export function FlyingCars() {
  const lanes = useRef<Lane[]>(Array.from({ length: CARS.count }, (_, i) => { const l = newLane(i, 0); l.start = -i * (l.dur / CARS.count) * 1.3; return l; }));
  const refs = useRef<(THREE.Group | null)[]>([]);
  useFrame(({ clock }) => {
    const now = clock.elapsedTime;
    lanes.current.forEach((l, i) => {
      const g = refs.current[i]; if (!g) return;
      let t = (now - l.start) / l.dur;
      if (t > 1) { lanes.current[i] = newLane(i, now); t = 0; }
      g.visible = t >= 0;
      // Fly a full lap around the skyline ring (counter/clockwise per lane).
      const ang = l.phase + Math.max(0, t) * Math.PI * 2 * l.dir;
      g.position.set(Math.sin(ang) * l.depth, l.y + Math.sin(now * 0.8 + i) * 0.12, -Math.cos(ang) * l.depth);
      g.rotation.y = -ang + (l.dir > 0 ? 0 : Math.PI);
    });
  });
  return <group>{Array.from({ length: CARS.count }, (_, i) => <group key={i} ref={(el) => { refs.current[i] = el; }}><Car /></group>)}</group>;
}
