import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { SKY } from "../config";

// Night sky dome over the whole scene: covers the open top of the painted skyline ring.
const vert = `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`;
const frag = `uniform float time; uniform vec3 horizon; uniform vec3 zenith; uniform vec3 haze; varying vec3 vDir;
float hash(vec3 p){ return fract(sin(dot(p, vec3(127.1,311.7,74.7)))*43758.5453); }
float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  float a=hash(vec3(i,0.)), b=hash(vec3(i+vec2(1,0),0.)), c=hash(vec3(i+vec2(0,1),0.)), d=hash(vec3(i+vec2(1,1),0.));
  return mix(mix(a,b,f.x), mix(c,d,f.x), f.y); }
void main(){
  vec3 d = normalize(vDir); float h = clamp(d.y, 0., 1.);
  vec3 c = mix(horizon, zenith, smoothstep(0.0, 0.75, h));
  float az = atan(d.z, d.x);
  float cl = noise(vec2(az*3.0 + time*0.01, h*9.0)) * noise(vec2(az*7.0 - time*0.015, h*14.0));
  c = mix(c, haze, smoothstep(0.25, 0.6, cl) * smoothstep(0.55, 0.35, h) * smoothstep(0.15, 0.3, h) * 0.5);
  vec3 cell = floor(d * 260.0); float s = hash(cell);
  if (s > 0.985) { float tw = 0.5 + 0.5*sin(time*(0.7+hash(cell+1.)*1.8) + s*40.); c += vec3(0.9,0.88,1.0) * tw * smoothstep(0.2, 0.5, h) * (s-0.985)*60.; }
  gl_FragColor = vec4(c, 1.0);
  #include <colorspace_fragment>
}`;
const lin = (hex: string) => new THREE.Color(hex).convertSRGBToLinear();

export function SkyDome() {
  const uniforms = useMemo(() => ({ time: { value: 0 }, horizon: { value: lin(SKY.horizon) }, zenith: { value: lin(SKY.zenith) }, haze: { value: lin(SKY.haze) } }), []);
  useFrame(({ clock }) => { uniforms.time.value = clock.elapsedTime; });
  return (
    <mesh renderOrder={-2}>
      <sphereGeometry args={[60, 48, 24]} />
      <shaderMaterial vertexShader={vert} fragmentShader={frag} uniforms={uniforms} side={THREE.BackSide} depthWrite={false} toneMapped={false} />
    </mesh>
  );
}
