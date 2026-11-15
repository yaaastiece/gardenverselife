import * as THREE from "three";
/** Center-crop the live drawing buffer, never stretch a portrait garden frame. */
export function captureGardenFrame(canvas: HTMLCanvasElement): Promise<File> {
  const frame = document.createElement("canvas");
  frame.width = 1920;
  frame.height = 1080;
  const ctx = frame.getContext("2d");
  if (!ctx || !canvas.width || !canvas.height) return Promise.reject(new Error("Garden frame unavailable"));
  const width = Math.min(canvas.width, canvas.height * 16 / 9);
  const height = width * 9 / 16;
  ctx.drawImage(canvas, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height, 0, 0, 1920, 1080);
  return new Promise((resolve, reject) => frame.toBlob((blob) => {
    if (!blob) { reject(new Error("Garden frame unavailable")); return; }
    resolve(new File([blob], "garden-frame.jpg", { type: "image/jpeg" }));
  }, "image/jpeg", 0.9));
}
/** Render the garden from a fixed viewpoint into an offscreen target (used while the headset owns the screen). */
export function captureGardenOffscreen(gl: THREE.WebGLRenderer, scene: THREE.Scene, eye: [number, number, number], target: [number, number, number], fov: number): Promise<File> {
  const width = 1280, height = 720;
  const rt = new THREE.WebGLRenderTarget(width, height, { colorSpace: THREE.SRGBColorSpace });
  const camera = new THREE.PerspectiveCamera(fov, width / height, 0.05, 500);
  camera.position.set(...eye); camera.lookAt(...target); camera.updateMatrixWorld();
  const hidden: THREE.Object3D[] = [];
  scene.traverse((o) => { if ((o.userData?.["gvPanel"] || o.renderOrder >= 999) && o.visible) { o.visible = false; hidden.push(o); } });
  const xr = gl.xr.enabled, previous = gl.getRenderTarget();
  const pixels = new Uint8Array(width * height * 4);
  try {
    gl.xr.enabled = false; gl.setRenderTarget(rt); gl.render(scene, camera); gl.readRenderTargetPixels(rt, 0, 0, width, height, pixels);
  } finally { gl.setRenderTarget(previous); gl.xr.enabled = xr; hidden.forEach((o) => { o.visible = true; }); rt.dispose(); }
  const frame = document.createElement("canvas"); frame.width = 1920; frame.height = 1080;
  const ctx = frame.getContext("2d"); const small = document.createElement("canvas"); small.width = width; small.height = height;
  const sctx = small.getContext("2d");
  if (!ctx || !sctx) return Promise.reject(new Error("Garden frame unavailable"));
  const image = sctx.createImageData(width, height);
  for (let y = 0; y < height; y++) image.data.set(pixels.subarray((height - 1 - y) * width * 4, (height - y) * width * 4), y * width * 4);
  sctx.putImageData(image, 0, 0); ctx.drawImage(small, 0, 0, 1920, 1080);
  return new Promise((resolve, reject) => frame.toBlob((blob) => blob ? resolve(new File([blob], "garden-frame.jpg", { type: "image/jpeg" })) : reject(new Error("Garden frame unavailable")), "image/jpeg", 0.9));
}
