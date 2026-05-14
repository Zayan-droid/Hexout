import { motion } from "framer-motion";
import { hexCornerPoints, hexToPixel } from "@/game/grid/hex";
import type { Hex } from "@/types";

interface HexCellProps {
  hex: Hex;
  size: number;
  /** Cell sits in the outer ring slated to be culled on the next shrink — telegraph. */
  hazardous?: boolean;
  /** Cell is outside the current play radius — already culled, rendered as a ghost. */
  dead?: boolean;
}

export function HexCell({ hex, size, hazardous, dead }: HexCellProps) {
  const { x, y } = hexToPixel(hex, size);
  const outer = hexCornerPoints(size * 0.94);
  const inner = hexCornerPoints(size * 0.82);

  if (dead) {
    return (
      <g transform={`translate(${x},${y})`} className="theme-fade" opacity={0.18}>
        <polygon
          points={outer}
          fill="none"
          stroke="var(--cell-stroke)"
          strokeWidth={1}
          strokeDasharray="3 4"
          strokeLinejoin="round"
        />
      </g>
    );
  }

  return (
    <g transform={`translate(${x},${y})`} className="theme-fade">
      <polygon
        points={outer}
        fill="var(--cell-fill)"
        stroke="var(--cell-stroke)"
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
      <polygon points={inner} fill="url(#cellWell)" opacity={0.7} />
      {hazardous && (
        <>
          <motion.polygon
            points={outer}
            fill="#FF5577"
            opacity={0}
            animate={{ opacity: [0.16, 0.32, 0.16] }}
            transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.polygon
            points={outer}
            fill="none"
            stroke="#FF5577"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeDasharray="5 4"
            animate={{ opacity: [0.55, 1, 0.55] }}
            transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
            style={{ filter: "drop-shadow(0 0 5px #FF5577)" }}
          />
        </>
      )}
    </g>
  );
}
