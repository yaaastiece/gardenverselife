import * as THREE from "three";

// Shared leaf geometry/texture for the procedural plants. Leaf points along +Z, base at origin.
function leafShape(w: number, serrate: number) {
  const s = new THREE.Shape(); const N = 14; const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= N; i++) { const t = i / N; const r = Math.sin(Math.PI * Math.pow(t, 0.8)) * w * (1 + (i % 2 ? serrate : 0)); pts.push(new THREE.Vector2(r, t)); }
  s.moveTo(0, 0); pts.forEach((p) => s.lineTo(p.x, p.y)); for (let i = N - 1; i >= 0; i--) s.lineTo(-pts[i]!.x, pts[i]!.y); return s;
}
function makeLeaf(w: number, serrate: number, curl: number, cup: number) {
  const g = new THREE.ShapeGeometry(leafShape(w, serrate), 1);
  const p = g.attributes.position as THREE.BufferAttribute; const uv = g.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i);
    uv.setXY(i, x / (2 * w) + 0.5, y);
    const z = y; const yy = -curl * z * z + cup * (x / w) * (x / w) * 0.15; // arch down along length, cup sides up
    p.setXYZ(i, x, yy, z);
  }
  g.computeVertexNormals(); return g;
}
export const LEAF = {
  basic: makeLeaf(0.38, 0.0, 0.35, 0.6),
  serrated: makeLeaf(0.34, 0.12, 0.3, 0.4),
  round: makeLeaf(0.5, 0.0, 0.25, 1.0),
  ruffle: makeLeaf(0.55, 0.18, -0.15, 1.6),
  petal: makeLeaf(0.6, 0.0, -0.4, 1.4),
};

let tex: THREE.CanvasTexture | null = null;
export function leafTexture() {
  if (tex) return tex;
  const c = document.createElement("canvas"); c.width = 64; c.height = 128; const g = c.getContext("2d")!;
  const grd = g.createLinearGradient(0, 0, 64, 0); grd.addColorStop(0, "#b8b8b8"); grd.addColorStop(0.5, "#ffffff"); grd.addColorStop(1, "#b8b8b8");
  g.fillStyle = grd; g.fillRect(0, 0, 64, 128);
  g.strokeStyle = "rgba(255,255,230,0.9)"; g.lineWidth = 2.5; g.beginPath(); g.moveTo(32, 128); g.lineTo(32, 0); g.stroke();
  g.lineWidth = 1.2; g.strokeStyle = "rgba(255,255,230,0.55)";
  for (let y = 110; y > 10; y -= 14) { g.beginPath(); g.moveTo(32, y); g.quadraticCurveTo(46, y - 6, 62, y - 18); g.moveTo(32, y); g.quadraticCurveTo(18, y - 6, 2, y - 18); g.stroke(); }
  tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; return tex;
}
