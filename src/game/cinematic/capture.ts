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