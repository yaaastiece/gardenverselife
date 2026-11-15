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
   // Project onto a cube face: unlike a 3D voxel grid, every sky pixel
   // samples a complete 2D star field, including directly overhead.
   vec3 a = abs(d);
   vec2 uv;
   float face;
   if(a.y >= a.x && a.y >= a.z){ uv = d.xz/a.y; face = d.y > 0.0 ? 0.0 : 1.0; }
   else if(a.x >= a.z){ uv = d.yz/a.x; face = d.x > 0.0 ? 2.0 : 3.0; }
   else { uv = d.xy/a.z; face = d.z > 0.0 ? 4.0 : 5.0; }
   vec2 grid = (uv * 0.5 + 0.5) * 110.0;
   vec2 cell = floor(grid);
   float s = hash(vec3(cell, face));
   vec2 center = vec2(0.2) + vec2(hash(vec3(cell, face+7.0)), hash(vec3(cell, face+13.0))) * 0.6;
   float dist = length(fract(grid)-center);
   float radius = mix(0.065, 0.13, hash(vec3(cell, face+19.0)));
   float aa = max(fwidth(dist), 0.015);
   float point = 1.0-smoothstep(radius-aa, radius+aa, dist);
   float halo = (1.0-smoothstep(radius, radius*3.0, dist))*0.12;
   float tw = 0.72 + 0.28*sin(time*(0.7+hash(vec3(cell, face+1.0))*1.1) + s*40.0);
   c += vec3(1.15) * (point+halo) * step(0.965, s) * tw * smoothstep(0.05, 0.3, h);
  return c;
}`;