import { useMemo } from "react";
import * as THREE from "three";
import { PALETTE } from "../config";

const vert = `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`;
const frag = `uniform vec3 top; uniform vec3 mid; uniform vec3 hor; varying vec3 vP;
void main(){ float h = vP.y; vec3 c = mix(hor, mid, smoothstep(-0.02, 0.18, h)); c = mix(c, top, smoothstep(0.15, 0.6, h)); gl_FragColor = vec4(c,1.); }`;

function seeded(n: number) { let s = n; return () => ((s = (s * 16807) % 2147483647) / 2147483647); }

const CONSTELLATIONS: [number, number][][] = [
  [[0.3, 0.55], [0.36, 0.6], [0.42, 0.58], [0.47, 0.64], [0.52, 0.6]],
  [[-1.1, 0.5], [-1.05, 0.6], [-0.98, 0.55], [-1.02, 0.45], [-1.1, 0.5]],
  [[2.2, 0.42], [2.28, 0.5], [2.36, 0.46], [2.42, 0.55]],
];
const toPos = ([az, el]: [number, number], r = 180) =>
  new THREE.Vector3(Math.sin(az) * Math.cos(el) * r, Math.sin(el) * r, -Math.cos(az) * Math.cos(el) * r);

export function Sky() {
  const uniforms = useMemo(() => ({ top: { value: new THREE.Color(PALETTE.skyTop) }, mid: { value: new THREE.Color(PALETTE.skyMid) }, hor: { value: new THREE.Color(PALETTE.skyHorizon) } }), []);
  const stars = useMemo(() => {
    const r = seeded(7); const pts: number[] = [];
    for (let i = 0; i < 900; i++) { const az = r() * Math.PI * 2; const el = 0.12 + Math.pow(r(), 0.7) * 1.4; const p = toPos([az, el], 190); pts.push(p.x, p.y, p.z); }
    CONSTELLATIONS.flat().forEach((c) => { const p = toPos(c); pts.push(p.x, p.y, p.z); });
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3)); return g;
  }, []);
  const lines = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    CONSTELLATIONS.forEach((c) => { for (let i = 0; i < c.length - 1; i++) pts.push(toPos(c[i], 179), toPos(c[i + 1], 179)); });
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, []);
  const moonPos = toPos([-0.45, 0.32], 160);
  return (
    <group>
      <mesh><sphereGeometry args={[200, 32, 16]} /><shaderMaterial fog={false} side={THREE.BackSide} depthWrite={false} uniforms={uniforms} vertexShader={vert} fragmentShader={frag} /></mesh>
      <points geometry={stars}><pointsMaterial color="#ffffff" size={0.7} sizeAttenuation={false} transparent opacity={0.8} fog={false} /></points>
      <lineSegments geometry={lines}><lineBasicMaterial color={PALETTE.pinkSoft} transparent opacity={0.35} fog={false} /></lineSegments>
      <mesh position={moonPos}><circleGeometry args={[11, 48]} /><meshBasicMaterial color={PALETTE.moon} toneMapped={false} fog={false} /></mesh>
    </group>
  );
}
