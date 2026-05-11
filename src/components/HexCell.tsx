import { hexCornerPoints, hexToPixel } from "@/game/grid/hex";
import type { Hex } from "@/types";

interface HexCellProps {
  hex: Hex;
  size: number;
}

export function HexCell({ hex, size }: HexCellProps) {
  const { x, y } = hexToPixel(hex, size);
  const outer = hexCornerPoints(size * 0.94);
  const inner = hexCornerPoints(size * 0.82);
  return (
    <g transform={`translate(${x},${y})`} className="theme-fade">
      <polygon
        points={outer}
        fill="var(--cell-fill)"
        stroke="var(--cell-stroke)"
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
      <polygon
        points={inner}
        fill="url(#cellWell)"
        opacity={0.7}
      />
    </g>
  );
}
