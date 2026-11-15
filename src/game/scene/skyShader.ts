// Shared world-direction gradient keeps the panel fade identical to the surrounding dome.
export const skyShader = `
uniform float time;
uniform vec3 horizon;
uniform vec3 zenith;
float hash(vec3 p){ return fract(sin(dot(p, vec3(127.1,311.7,74.7)))*43758.5453); }
vec3 skyColor(vec3 direction){
  vec3 d = normalize(direction);
  float h = clamp(d.y, 0.0, 1.0);
  vec3 c = mix(horizon, zenith, smoothstep(0.0, 0.78, h));
  vec3 cell = floor(d * 260.0);
  float s = hash(cell);
  if(s > 0.995){
    float tw = 0.65 + 0.35*sin(time*(0.7+hash(cell+1.0)*1.8) + s*40.0);
    c += vec3(0.32) * tw * smoothstep(0.15, 0.5, h) * (s-0.995)*200.0;
  }
  return c;
}`;