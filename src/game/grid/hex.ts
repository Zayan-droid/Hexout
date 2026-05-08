import type { Hex } from "@/types";

export const hexKey = (q: number, r: number): string => `${q},${r}`;
export const tileKey = (h: Hex): string => hexKey(h.q, h.r);

export function hexEquals(a: Hex, b: Hex): boolean {
  return a.q === b.q && a.r === b.r;
}

export function hexAdd(a: Hex, b: Hex): Hex {
  return { q: a.q + b.q, r: a.r + b.r };
}

// Build a hexagonal-shaped board with all cells where max(|q|,|r|,|s|) <= radius.
// s is the implied third axial coordinate (q + r + s = 0).
export function createHexagonBoardCells(radius: number): Hex[] {
  const cells: Hex[] = [];
  for (let q = -radius; q <= radius; q++) {
    const rMin = Math.max(-radius, -q - radius);
    const rMax = Math.min(radius, -q + radius);
    for (let r = rMin; r <= rMax; r++) {
      cells.push({ q, r });
    }
  }
  return cells;
}

export function isInsideRadius(h: Hex, radius: number): boolean {
  const s = -h.q - h.r;
  return (
    Math.abs(h.q) <= radius &&
    Math.abs(h.r) <= radius &&
    Math.abs(s) <= radius
  );
}

// Pointy-top axial -> pixel.
// size is the hex "radius" (center to corner).
export function hexToPixel(h: Hex, size: number): { x: number; y: number } {
  const x = size * (Math.sqrt(3) * h.q + (Math.sqrt(3) / 2) * h.r);
  const y = size * ((3 / 2) * h.r);
  return { x, y };
}

// Pointy-top hex polygon corners, centered at (0,0).
export function hexCornerPoints(size: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    // Pointy-top: first corner at 30deg
    const angle = (Math.PI / 180) * (60 * i - 30);
    pts.push(`${size * Math.cos(angle)},${size * Math.sin(angle)}`);
  }
  return pts.join(" ");
}
