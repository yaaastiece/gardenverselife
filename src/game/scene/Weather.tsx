import { useMemo, useRef, useSyncExternalStore } from "react";
import { useFrame } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import { useXR } from "@react-three/xr";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { WEATHER_FADE, type Weather as WeatherState } from "../weather/weather";

const AREA = { x: 9, z: 9, top: 6, cx: 0, cz: -1.2 };
// Presents the weather state only: rain streaks, low drifting mist and fireflies.
export function Weather({ weather }: { weather: WeatherState }) {
  const mode = useSyncExternalStore(weather.subscribe, weather.getSnapshot, weather.getSnapshot);
  const inVR = useXR((s) => Boolean(s.session));
  const amt = useRef({ rain: 0, fog: 0, fireflies: 0 });
  const rainRef = useRef<THREE.LineSegments>(null);
  const fogRef = useRef<THREE.Group>(null);
  const flyRef = useRef<THREE.Group>(null);
  const count = inVR ? 500 : 1100;
  const rain = useMemo(() => {
    const pos = new Float32Array(count * 6); const speed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const x = AREA.cx + (Math.random() - 0.5) * AREA.x, z = AREA.cz + (Math.random() - 0.5) * AREA.z, y = Math.random() * AREA.top;
      pos.set([x, y, z, x - 0.02, y + 0.32, z], i * 6); speed[i] = 7 + Math.random() * 3;
    }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return { g, speed };
  }, [count]);
  // One-pixel lines vanish in a headset, so VR gets real streaks: two crossed thin quads per drop.
  const vrDrops = useMemo(() => {
    const n = 700; const x = new Float32Array(n), y = new Float32Array(n), z = new Float32Array(n), speed = new Float32Array(n);
    for (let i = 0; i < n; i++) { x[i] = AREA.cx + (Math.random() - 0.5) * AREA.x; z[i] = AREA.cz + (Math.random() - 0.5) * AREA.z; y[i] = Math.random() * AREA.top; speed[i] = 7 + Math.random() * 3; }
    const a = new THREE.PlaneGeometry(0.012, 0.45); const b = new THREE.PlaneGeometry(0.012, 0.45); b.rotateY(Math.PI / 2);
    return { n, x, y, z, speed, geometry: mergeGeometries([a, b]), dummy: new THREE.Object3D() };
  }, []);
  const rainVR = useRef<THREE.InstancedMesh>(null);
  const mistTex = useMemo(() => {
    const c = document.createElement("canvas"); c.width = c.height = 128; const x = c.getContext("2d");
    if (x) { const r = x.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, "rgba(240,232,245,0.8)"); r.addColorStop(1, "rgba(235,225,240,0)"); x.fillStyle = r; x.fillRect(0, 0, 128, 128); }
    return new THREE.CanvasTexture(c);
  }, []);
  const puffs = useMemo(() => Array.from({ length: 26 }, (_, i) => ({ x: AREA.cx + (Math.random() - 0.5) * 8, z: AREA.cz + (Math.random() - 0.5) * 6, y: 0.3 + Math.random() * 1.1, s: 2.2 + Math.random() * 2, p: i })), []);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05); const a = amt.current; const k = dt / WEATHER_FADE;
    for (const key of ["rain", "fog", "fireflies"] as const) a[key] = THREE.MathUtils.clamp(a[key] + (mode === key ? k : -k), 0, 1);
    if (rainRef.current) {
      rainRef.current.visible = !inVR && a.rain > 0.01;
      (rainRef.current.material as THREE.LineBasicMaterial).opacity = 0.85 * a.rain;
      if (rainRef.current.visible) {
        const p = rain.g.getAttribute("position") as THREE.BufferAttribute; const arr = p.array as Float32Array;
        for (let i = 0; i < count; i++) {
          const o = i * 6; const dy = rain.speed[i]! * dt;
          arr[o + 1]! -= dy; arr[o + 4]! -= dy;
          if (arr[o + 1]! < 0) { arr[o + 1] = AREA.top; arr[o + 4] = AREA.top + 0.32; }
        }
        p.needsUpdate = true;
      }
    }
    if (rainVR.current) {
      rainVR.current.visible = inVR && a.rain > 0.01;
      (rainVR.current.material as THREE.MeshBasicMaterial).opacity = 0.7 * a.rain;
      if (rainVR.current.visible) {
        const d = vrDrops;
        for (let i = 0; i < d.n; i++) {
          d.y[i]! -= d.speed[i]! * dt; if (d.y[i]! < 0) d.y[i] = AREA.top;
          d.dummy.position.set(d.x[i]!, d.y[i]!, d.z[i]!); d.dummy.updateMatrix(); rainVR.current.setMatrixAt(i, d.dummy.matrix);
        }
        rainVR.current.instanceMatrix.needsUpdate = true;
      }
    }
    if (fogRef.current) {
      fogRef.current.visible = a.fog > 0.01;
      const t = state.clock.elapsedTime;
      fogRef.current.children.forEach((c, i) => {
        const pf = puffs[i]!; c.position.x = pf.x + Math.sin(t * 0.08 + pf.p) * 0.8;
        ((c as THREE.Sprite).material as THREE.SpriteMaterial).opacity = 0.95 * a.fog;
      });
    }
    if (flyRef.current) { flyRef.current.visible = a.fireflies > 0.01; flyRef.current.scale.setScalar(Math.max(0.001, a.fireflies)); }
  });

  return <group>
    <instancedMesh ref={rainVR} args={[vrDrops.geometry, undefined, vrDrops.n]} raycast={() => {}} frustumCulled={false} visible={false}>
      <meshBasicMaterial color="#e8ecf8" transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
    </instancedMesh>
    <lineSegments ref={rainRef} geometry={rain.g} raycast={() => {}} frustumCulled={false} visible={!inVR}>
      <lineBasicMaterial color="#e8ecf8" transparent opacity={0} depthWrite={false} />
    </lineSegments>
    <group ref={fogRef}>
      {puffs.map((pf) => <sprite key={pf.p} raycast={() => {}} position={[pf.x, pf.y, pf.z]} scale={[pf.s * 1.8, pf.s * 0.6, 1]}>
        <spriteMaterial map={mistTex} transparent opacity={0} depthWrite={false} />
      </sprite>)}
    </group>
    <group ref={flyRef} position={[AREA.cx, 1.1, AREA.cz]}>
      <Sparkles count={inVR ? 30 : 60} scale={[6, 1.6, 5]} size={6} speed={0.35} color="#9dff7a" noise={1} />
      <Sparkles count={inVR ? 12 : 24} scale={[6, 1.6, 5]} size={5} speed={0.3} color="#ff8fd0" noise={1} />
    </group>
  </group>;
}
