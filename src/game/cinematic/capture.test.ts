import { expect, it, vi } from "vitest";
import { captureGardenFrame } from "./capture";

it("captures a 1920 by 1080 JPEG and center crops a portrait garden without stretching", async () => {
  const drawImage = vi.fn();
  const getContext = vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({ drawImage } as unknown as CanvasRenderingContext2D);
  const toBlob = vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(function (this: HTMLCanvasElement, callback) {
    expect(this.width).toBe(1920); expect(this.height).toBe(1080);
    callback(new Blob(["fixture-frame"], { type: "image/jpeg" }));
  });
  const canvas = document.createElement("canvas"); canvas.width = 390; canvas.height = 844;
  const file = await captureGardenFrame(canvas);
  expect(file.type).toBe("image/jpeg");
  expect(drawImage).toHaveBeenCalledWith(canvas, 0, (844 - 219.375) / 2, 390, 219.375, 0, 0, 1920, 1080);
  getContext.mockRestore(); toBlob.mockRestore();
});