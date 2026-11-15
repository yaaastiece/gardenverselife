import { useMemo } from "react";
import { useFrame, useLoader, useThree } from "@react-three/fiber";
import * as THREE from "three";
import skyline from "@/assets/skyline_original.jpg.asset.json";
import { BACKDROP, SKY, backdropHeight } from "../config";
import { skyShader } from "./skyShader";

// Arc length / full image aspect preserves scale on both axes; sample every column once.
const vert = `varying vec2 vUv; varying vec3 vDir; void main(){ vUv = uv; vDir = (modelMatrix*vec4(position,1.)).xyz; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`;
const frag = `${skyShader} uniform sampler2D map; uniform float vMin; uniform float edgeFade; varying vec2 vUv; varying vec3 vDir;
void main(){
  float s = 1.0 - vUv.x; float v = mix(vMin, 1.0, vUv.y);
  vec3 c = texture2D(map, vec2(s, v)).rgb;
  float lum = dot(c, vec3(0.299,0.587,0.114));
  float sky = smoothstep(0.62, 0.75, v);
  vec2 cell = floor(vec2(s, v) * vec2(960.0, 480.0));
  float tw = 0.5 + 0.5*sin(time*(0.8 + hash(vec3(cell,0.0))*1.6) + hash(vec3(cell+3.1,0.0))*6.283);
  c *= 1.0 + sky * smoothstep(0.55, 0.85, lum) * (tw - 0.45) * 0.9;
  float edge = smoothstep(0.0, edgeFade, min(s, 1.0-s));
  float top = 1.0-smoothstep(0.9, 1.0, vUv.y);
  c = mix(skyColor(vDir), c, edge * top);
  gl_FragColor = vec4(c, 1.0);
  #include <colorspace_fragment>
}`;

export function Backdrop() {
  const gl = useThree((state) => state.gl);
  const tex = useLoader(THREE.TextureLoader, skyline.url);
  useMemo(() => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.anisotropy = gl.capabilities.getMaxAnisotropy();
    tex.needsUpdate = true;
  }, [tex, gl]);
  const uniforms = useMemo(() => ({ map: { value: tex }, time: { value: 0 }, vMin: { value: BACKDROP.vMin }, edgeFade: { value: BACKDROP.edgeFade }, horizon: { value: new THREE.Color(SKY.horizon) }, zenith: { value: new THREE.Color(SKY.zenith) } }), [tex]);
  useFrame(({ clock }) => { uniforms.time.value = clock.elapsedTime; });
  const { radius: R, arc, bottom } = BACKDROP;
  const h = backdropHeight();
  return (
    <mesh position={[0, bottom + h / 2, 0]} renderOrder={-1}>
      <cylinderGeometry args={[R, R, h, 96, 1, true, Math.PI - arc / 2, arc]} />
      <shaderMaterial vertexShader={vert} fragmentShader={frag} uniforms={uniforms} side={THREE.BackSide} depthWrite={false} toneMapped={false} />
    </mesh>
  );
}
