import { hexCornerPoints, hexToPixel } from "@/game/grid/hex";
import type { Hex } from "@/types";

interface HexCellProps {
  hex: Hex;
  size: number;
}

export function HexCell({ hex, size }: HexCellProps) {
  const { x, y } = hexToPixel(hex, size);
  return (
    <g transform={`translate(${x},${y})`}>
      <polygon
        points={hexCornerPoints(size * 0.96)}
        fill="rgba(255,255,255,0.025)"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={1}
      />
    </g>
  );
}
