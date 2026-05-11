import type { PowerUpId } from "@/types/powerup";

interface Props {
  id: PowerUpId;
  size?: number;
  hue: string;
  hueDeep: string;
  active?: boolean;
}

/**
 * Each power-up has a hand-drawn icon that reads from across the room.
 * Single tint per icon — gradient depth only, no rainbow chaos.
 */
export function PowerUpIcon({ id, size = 28, hue, hueDeep, active }: Props) {
  const stroke = active ? "#ffffff" : hueDeep;
  const fill = active ? "rgba(255,255,255,0.95)" : hue;
  const accent = active ? "rgba(255,255,255,0.75)" : hueDeep;

  switch (id) {
    case "hammer":
      return (
        <svg width={size} height={size} viewBox="-16 -16 32 32">
          {/* handle */}
          <rect
            x={-1.6}
            y={1}
            width={3.2}
            height={13}
            rx={1.4}
            fill={accent}
            transform="rotate(-22)"
          />
          {/* head */}
          <g transform="rotate(-22)">
            <rect x={-9} y={-10} width={18} height={9} rx={2.4} fill={fill} stroke={stroke} strokeWidth={1.2} />
            <rect x={-9} y={-10} width={18} height={3} rx={1.6} fill="rgba(255,255,255,0.35)" />
          </g>
        </svg>
      );

    case "swap":
      return (
        <svg width={size} height={size} viewBox="-16 -16 32 32">
          <g fill="none" stroke={fill} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
            <path d="M -10 -4 H 8 l -3 -3 M -10 -4 l 3 -3" />
            <path d="M 10 4 H -8 l 3 3 M 10 4 l -3 3" />
          </g>
          <circle cx={-10} cy={-4} r={2.4} fill={accent} />
          <circle cx={10} cy={4} r={2.4} fill={accent} />
        </svg>
      );

    case "colorClear":
      return (
        <svg width={size} height={size} viewBox="-16 -16 32 32">
          <circle cx={-6} cy={-5} r={4.2} fill={fill} opacity={0.95} />
          <circle cx={6} cy={-3} r={3.4} fill={hueDeep} opacity={0.85} />
          <circle cx={-2} cy={6} r={4.6} fill={fill} opacity={0.95} />
          <circle cx={7} cy={6} r={2.6} fill={accent} opacity={0.75} />
          {/* sparkle */}
          <path
            d="M 11 -8 L 12 -10 L 13 -8 L 15 -7 L 13 -6 L 12 -4 L 11 -6 L 9 -7 Z"
            fill="rgba(255,255,255,0.9)"
          />
        </svg>
      );

    case "shuffle":
      return (
        <svg width={size} height={size} viewBox="-16 -16 32 32">
          <g fill="none" stroke={fill} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M -11 -6 H -4 a 6 6 0 0 1 6 6 a 6 6 0 0 0 6 6 H 11" />
            <path d="M 9 8 l 3 1 l -1 3" />
            <path d="M -11 6 H -4 a 6 6 0 0 0 6 -6 a 6 6 0 0 1 6 -6 H 11" />
            <path d="M 9 -8 l 3 1 l -1 3" />
          </g>
        </svg>
      );

    case "lineBlast":
      return (
        <svg width={size} height={size} viewBox="-16 -16 32 32">
          <defs>
            <linearGradient id={`lb-${active ? "a" : "n"}`} x1="0" x2="1">
              <stop offset="0%" stopColor={fill} stopOpacity={0} />
              <stop offset="40%" stopColor={fill} stopOpacity={0.9} />
              <stop offset="100%" stopColor={fill} stopOpacity={1} />
            </linearGradient>
          </defs>
          <rect x={-12} y={-2.2} width={20} height={4.4} rx={2.2} fill={`url(#lb-${active ? "a" : "n"})`} />
          <polygon points="8,-6 14,0 8,6" fill={fill} />
          <circle cx={-11} cy={0} r={1.6} fill={accent} />
          <circle cx={-6} cy={0} r={1.1} fill={accent} opacity={0.7} />
        </svg>
      );

    case "undo":
      return (
        <svg width={size} height={size} viewBox="-16 -16 32 32">
          <g fill="none" stroke={fill} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
            <path d="M 10 8 a 9 9 0 1 0 -9 -9" />
            <path d="M -3 -3 L 1 -1 L -1 3" />
          </g>
        </svg>
      );

    case "bomb":
      return (
        <svg width={size} height={size} viewBox="-16 -16 32 32">
          <circle cx={0} cy={3} r={9} fill={fill} stroke={stroke} strokeWidth={1.2} />
          <ellipse cx={-3} cy={-1} rx={2.6} ry={1.4} fill="rgba(255,255,255,0.5)" />
          {/* fuse */}
          <path d="M 3 -6 Q 7 -10 11 -8" fill="none" stroke={accent} strokeWidth={1.6} strokeLinecap="round" />
          {/* spark */}
          <circle cx={11.4} cy={-8.2} r={2.2} fill="#FFE9A8" />
          <circle cx={11.4} cy={-8.2} r={3.4} fill="#FFE9A8" opacity={0.35} />
        </svg>
      );
  }
}
