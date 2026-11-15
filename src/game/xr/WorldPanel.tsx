import { useEffect, useMemo, useState } from "react";
import { Billboard } from "@react-three/drei";
import * as THREE from "three";
import { PALETTE } from "../config";
import { VR } from "./rules";

export type PanelButton = {
  label: string;
  action?: () => void;
  press?: () => void;
  release?: () => void;
  disabled?: boolean;
  active?: boolean;
};
export type PanelBar = { label: string; value: number };

function buttonRows(label: string) {
  const words = label.split(" ");
  const rows: string[] = [];
  let row = "";
  words.forEach((word) => {
    if ((row + " " + word).trim().length > 38 && row) { rows.push(row); row = word; }
    else row += (row ? " " : "") + word;
  });
  if (row) rows.push(row);
  return rows.slice(0, 2);
}

export function WorldPanel({ title, lines = [], bars = [], buttons = [], position, width = 0.62, opacity = 1 }: {
  title: string; lines?: string[]; bars?: PanelBar[]; buttons?: PanelButton[];
  position?: [number, number, number]; width?: number; opacity?: number;
}) {
  const [hover, setHover] = useState(-1);
  const lineRows = useMemo(() => lines.flatMap((line) => {
    const words = line.split(" "); const rows: string[] = []; let row = "";
    words.forEach((word) => { if ((row + " " + word).length > 39 && row) { rows.push(row); row = word; } else row += (row ? " " : "") + word; });
    if (row) rows.push(row); return rows;
  }), [lines.join("\n")]);
  const bodyHeight = 0.12 + bars.length * 0.07 + lineRows.length * 0.033;
  const height = bodyHeight + buttons.length * (VR.buttonHeight + 0.012) + 0.035;
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas"); canvas.width = 1536; canvas.height = Math.ceil(1536 * height / width);
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const k = canvas.width / width;
      ctx.fillStyle = PALETTE.ink; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = PALETTE.pink; ctx.lineWidth = 0.003 * k; ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
      ctx.textBaseline = "middle"; ctx.fillStyle = PALETTE.pinkSoft;
      ctx.font = `bold ${0.031 * k}px sans-serif`; ctx.fillText(title, 0.025 * k, 0.047 * k);
      let y = 0.1;
      bars.forEach((bar) => {
        ctx.font = `${0.022 * k}px sans-serif`; ctx.fillStyle = PALETTE.moon; ctx.fillText(`${bar.label}   ${Math.round(bar.value)}%`, 0.025 * k, y * k);
        ctx.fillStyle = PALETTE.wallDark; ctx.fillRect(0.025 * k, (y + 0.021) * k, (width - 0.05) * k, 0.009 * k);
        ctx.fillStyle = bar.value < 30 ? PALETTE.pink : PALETTE.green; ctx.fillRect(0.025 * k, (y + 0.021) * k, (width - 0.05) * k * Math.max(0, Math.min(100, bar.value)) / 100, 0.009 * k);
        y += 0.07;
      });
      lineRows.forEach((line) => { ctx.fillStyle = PALETTE.moon; ctx.font = `${0.022 * k}px sans-serif`; ctx.fillText(line, 0.025 * k, y * k); y += 0.033; });
      buttons.forEach((button, i) => {
        const top = bodyHeight + i * (VR.buttonHeight + 0.012);
        ctx.fillStyle = button.active ? PALETTE.green : i === hover && !button.disabled ? PALETTE.wallDark : PALETTE.wallMid;
        if (button.active) ctx.fillStyle = PALETTE.pinkSoft;
        ctx.fillRect(0.02 * k, top * k, (width - 0.04) * k, VR.buttonHeight * k);
        ctx.strokeStyle = button.active || i === hover ? PALETTE.green : PALETTE.pink;
        ctx.strokeRect(0.02 * k, top * k, (width - 0.04) * k, VR.buttonHeight * k);
        ctx.fillStyle = button.disabled ? PALETTE.wallLight : PALETTE.ink;
        ctx.font = `bold ${0.021 * k}px sans-serif`; ctx.textAlign = "center";
        const rows = buttonRows(button.label);
        rows.forEach((row, rowIndex) => ctx.fillText(row, width * k / 2, (top + VR.buttonHeight / 2 + (rowIndex - (rows.length - 1) / 2) * 0.025) * k));
        ctx.textAlign = "left";
      });
    }
    const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 4; return map;
  }, [title, lineRows, bars.map((b) => `${b.label}:${Math.round(b.value)}`).join(), buttons.map((b) => `${b.label}:${b.disabled}:${b.active}`).join(), hover, height, width]);
  useEffect(() => () => texture.dispose(), [texture]);
  return <Billboard position={position ?? [0, 0, 0]}>
    <mesh onClick={(e) => e.stopPropagation()}><planeGeometry args={[width, height]} /><meshBasicMaterial map={texture} transparent opacity={opacity} toneMapped={false} /></mesh>
    {buttons.map((button, i) => <mesh key={`${button.label}-${i}`} position={[0, height / 2 - bodyHeight - i * (VR.buttonHeight + 0.012) - VR.buttonHeight / 2, 0.002]}
      onPointerOver={(e) => { e.stopPropagation(); if (!button.disabled) setHover(i); }} onPointerOut={(e) => { e.stopPropagation(); setHover(-1); if (!button.disabled) button.release?.(); }}
      onPointerDown={(e) => { e.stopPropagation(); if (!button.disabled) button.press?.(); }}
      onPointerUp={(e) => { e.stopPropagation(); if (!button.disabled) button.release?.(); }}
      onPointerCancel={(e) => { e.stopPropagation(); if (!button.disabled) button.release?.(); }}
      onClick={(e) => { e.stopPropagation(); if (!button.disabled) button.action?.(); }}>
      <planeGeometry args={[width - 0.04, Math.max(VR.minTarget, VR.buttonHeight)]} /><meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>)}
  </Billboard>;
}
