import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { SKY } from "../config";
import { skyShader } from "./skyShader";

// Night sky dome over the whole scene: covers the open top of the painted skyline ring.
const vert = `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`;
const frag = `${skyShader} varying vec3 vDir;
void main(){
  gl_FragColor = vec4(skyColor(vDir), 1.0);
  #include <colorspace_fragment>
}`;
const lin = (hex: string) => new THREE.Color(hex);

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
