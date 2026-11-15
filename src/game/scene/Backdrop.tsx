import { useMemo } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import skyline from "@/assets/skyline_360.jpg.asset.json";
import { BACKDROP, SKY } from "../config";

// Painted skyline wrapped as a full 360 ring. Edges are cross-faded so the seam never shows;
// the top fades into the sky dome color.
const vert = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`;
const frag = `uniform sampler2D map; uniform float time; uniform float vMin; uniform float seam; uniform vec3 fill; varying vec2 vUv;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
void main(){
  float s = 1.0 - vUv.x; float v = mix(vMin, 1.0, vUv.y);
  vec3 a = texture2D(map, vec2(seam + s*(1.0-seam), v)).rgb;
  vec3 b = texture2D(map, vec2(seam + (s-1.0)*(1.0-seam), v)).rgb;
  vec3 c = mix(a, b, smoothstep(1.0 - seam, 1.0, s));
  float lum = dot(c, vec3(0.299,0.587,0.114));
  float sky = smoothstep(0.62, 0.75, v);
  vec2 cell = floor(vec2(s, v) * vec2(960.0, 480.0));
  float tw = 0.5 + 0.5*sin(time*(0.8 + hash(cell)*1.6) + hash(cell+3.1)*6.283);
  c *= 1.0 + sky * smoothstep(0.55, 0.85, lum) * (tw - 0.45) * 0.9;
  c = mix(c, fill, smoothstep(0.88, 1.0, vUv.y));
  gl_FragColor = vec4(c, 1.0);
  #include <colorspace_fragment>
}`;

export function Backdrop() {
  const tex = useLoader(THREE.TextureLoader, skyline.url);
  tex.colorSpace = THREE.SRGBColorSpace;
  const uniforms = useMemo(() => ({ map: { value: tex }, time: { value: 0 }, vMin: { value: BACKDROP.vMin }, seam: { value: BACKDROP.seam }, fill: { value: new THREE.Color(SKY.zenith).convertSRGBToLinear() } }), [tex]);
  useFrame(({ clock }) => { uniforms.time.value = clock.elapsedTime; });
  const { radius: R, aspect, bottom, vMin } = BACKDROP;
  const h = (R * Math.PI * 2) / aspect * (1 - vMin);
  return (
    <mesh position={[0, bottom + h / 2, 0]} renderOrder={-1}>
      <cylinderGeometry args={[R, R, h, 128, 1, true, 0, Math.PI * 2]} />
      <shaderMaterial vertexShader={vert} fragmentShader={frag} uniforms={uniforms} side={THREE.BackSide} depthWrite={false} toneMapped={false} />
    </mesh>
  );
}
