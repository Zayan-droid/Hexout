import { useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import type { Tile } from "@/types";
import { hexCornerPoints, hexToPixel } from "@/game/grid/hex";
import { DIRECTION_ANGLE_DEG, DIRECTION_VECTORS } from "@/game/grid/directions";
import { useTheme } from "./ThemeProvider";

interface TileViewProps {
  tile: Tile;
  size: number;
  gridRadius: number;
  isAnimating: boolean;
  isShaking: boolean;
  isLocked?: boolean;
  /** True if this tile is a key (its `key` field is set and not yet cleared). */
  isKey?: boolean;
  /** Color shared by this tile's key↔lock pair, when applicable. */
  pairTint?: string;
  /** Highlight this tile because the player is hovering its partner. */
  isPairHighlighted?: boolean;
  /** ambient pulse — tile is a valid power-up target */
  isTargetable?: boolean;
  /** glow + lift — tile is the first pick of a swap */
  isPicked?: boolean;
  /** soft danger ring — tile is in current bomb preview */
  isPreviewedDanger?: boolean;
  /** glow tint to use when targetable; falls back to theme primary */
  targetTint?: string;
  /** Tile has an active crack timer counting down. Show progressive cracks. */
  isCracking?: boolean;
  /** Tile is fully cracked — permanently immovable, render as broken. */
  isCracked?: boolean;
  onClick: () => void;
  onExitComplete: () => void;
}

const EXIT_OVERSHOOT_HEXES = 2.4;

export function TileView({
  tile,
  size,
  gridRadius,
  isAnimating,
  isShaking,
  isLocked,
  isKey,
  pairTint,
  isPairHighlighted,
  isTargetable,
  isPicked,
  isPreviewedDanger,
  targetTint,
  isCracking,
  isCracked,
  onClick,
  onExitComplete,
}: TileViewProps) {
  const theme = useTheme();
  const groupRef = useRef<SVGGElement>(null);
  const hexBodyRef = useRef<SVGGElement>(null);
  const planeRef = useRef<SVGGElement>(null);
  const hasExited = useRef(false);
  const isFirstPosition = useRef(true);
  const startPx = hexToPixel({ q: tile.q, r: tile.r }, size);
  const dirVec = DIRECTION_VECTORS[tile.direction];
  const arrowAngle = DIRECTION_ANGLE_DEG[tile.direction];

  // Stable per-tile animation offset so pulses don't sync.
  const wobble = useMemo(() => {
    let h = 0;
    for (let i = 0; i < tile.id.length; i++) h = (h * 31 + tile.id.charCodeAt(i)) | 0;
    return Math.abs(h % 1000) / 1000;
  }, [tile.id]);

  const stepsToExit = 2 * gridRadius + EXIT_OVERSHOOT_HEXES;
  const exitPx = hexToPixel(
    {
      q: tile.q + dirVec.q * stepsToExit,
      r: tile.r + dirVec.r * stepsToExit,
    },
    size
  );

  useEffect(() => {
    if (!groupRef.current || !hexBodyRef.current || !planeRef.current) return;
    // First mount: snap. Subsequent position changes (swap, shuffle): tween.
    if (isFirstPosition.current) {
      gsap.set(groupRef.current, { x: startPx.x, y: startPx.y });
      gsap.set(hexBodyRef.current, { opacity: 1, scale: 1, transformOrigin: "0 0" });
      gsap.set(planeRef.current, { opacity: 0, scale: 0, rotation: 0, transformOrigin: "0 0" });
      isFirstPosition.current = false;
    } else {
      // Lift-and-glide for shuffle/swap — elastic and tactile.
      gsap.killTweensOf(groupRef.current);
      const tl = gsap.timeline();
      tl.to(groupRef.current, {
        scale: 1.06,
        duration: 0.16,
        ease: "power2.out",
        transformOrigin: "50% 50%",
      });
      tl.to(
        groupRef.current,
        {
          x: startPx.x,
          y: startPx.y,
          duration: 0.62,
          ease: "elastic.out(1, 0.6)",
        },
        0
      );
      tl.to(groupRef.current, { scale: 1, duration: 0.28, ease: "power2.inOut" }, 0.34);
    }
    hasExited.current = false;
  }, [tile.q, tile.r, startPx.x, startPx.y]);

  useEffect(() => {
    if (!isAnimating || !groupRef.current || hasExited.current) return;
    if (!hexBodyRef.current || !planeRef.current) return;
    hasExited.current = true;

    const tl = gsap.timeline({ onComplete: onExitComplete });

    // Marshmallow squish before drift
    tl.to(hexBodyRef.current, { scale: 1.14, duration: 0.10, ease: "power1.out" }, 0)
      .to(hexBodyRef.current, { scale: 0.25, opacity: 0, duration: 0.18, ease: "power2.in" }, 0.10);

    tl.fromTo(
      planeRef.current,
      { opacity: 0, scale: 0.2, rotation: -12 },
      { opacity: 1, scale: 1, rotation: 0, duration: 0.22, ease: "back.out(2)" },
      0.08
    );

    tl.to(groupRef.current, { x: exitPx.x, y: exitPx.y, duration: 0.72, ease: "power3.in" }, 0.14);

    tl.to(planeRef.current, { rotation: 6, duration: 0.14, ease: "sine.inOut" }, 0.30).to(
      planeRef.current,
      { rotation: -3, duration: 0.14, ease: "sine.inOut" },
      0.44
    );

    tl.to(planeRef.current, { opacity: 0, scale: 0.45, duration: 0.22, ease: "power2.in" }, 0.62);
  }, [isAnimating, exitPx.x, exitPx.y, onExitComplete]);

  useEffect(() => {
    if (!isShaking || !groupRef.current) return;
    gsap.to(groupRef.current, {
      keyframes: [
        { x: startPx.x - 5, duration: 0.05 },
        { x: startPx.x + 5, duration: 0.06 },
        { x: startPx.x - 4, duration: 0.06 },
        { x: startPx.x + 3, duration: 0.06 },
        { x: startPx.x, duration: 0.05 },
      ],
    });
  }, [isShaking, startPx.x, startPx.y]);

  const points = hexCornerPoints(size * 0.92);
  const targetRing = hexCornerPoints(size * 1.06);
  const pairRing = hexCornerPoints(size * 0.99);
  const tint = targetTint ?? theme.accent.primary;
  const showPairRing = !!pairTint && (isLocked || isKey);

  return (
    <g
      ref={groupRef}
      style={{ cursor: isAnimating || isLocked ? "default" : "pointer" }}
      onClick={(e) => {
        e.stopPropagation();
        if (!isAnimating) onClick();
      }}
    >
      {/* Targetable ring — breathing glow while a power-up is armed */}
      {isTargetable && (
        <motion.polygon
          points={targetRing}
          fill="none"
          stroke={tint}
          strokeWidth={2.4}
          strokeLinejoin="round"
          animate={{ opacity: [0.4, 0.95, 0.4], scale: [1.0, 1.04, 1.0] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          style={{ filter: `drop-shadow(0 0 6px ${tint})` }}
        />
      )}

      {/* "Picked" lift glow — first swap selection */}
      {isPicked && (
        <>
          <polygon
            points={hexCornerPoints(size * 1.15)}
            fill={tint}
            opacity={0.22}
            style={{ filter: `blur(${size * 0.4}px)` }}
          />
          <motion.polygon
            points={hexCornerPoints(size * 1.0)}
            fill="none"
            stroke="white"
            strokeWidth={2}
            strokeLinejoin="round"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.0, repeat: Infinity }}
          />
        </>
      )}

      {/* Danger preview — bomb radius */}
      {isPreviewedDanger && (
        <motion.polygon
          points={hexCornerPoints(size * 1.04)}
          fill="none"
          stroke="#FF8FA8"
          strokeDasharray="4 4"
          strokeWidth={1.6}
          strokeLinejoin="round"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.0, repeat: Infinity }}
        />
      )}

      <g
        ref={hexBodyRef}
        opacity={isCracked ? 0.55 : isLocked ? 0.45 : 1}
        style={{ filter: isCracked ? "saturate(0.45)" : undefined }}
      >
        <TileBody
          points={points}
          color={tile.color}
          arrowAngle={arrowAngle}
          size={size}
          shakeFlash={isShaking}
          wobble={wobble}
          arrowColor={theme.tile.arrowColor}
          arrowHl={theme.tile.arrowHighlight}
          borderColor={theme.tile.borderColor}
          innerHl={theme.tile.innerHighlight}
          shadowColor={theme.tile.shadowColor}
          bloomOpacity={theme.tile.bloomOpacity}
          glossOpacity={theme.tile.glossOpacity}
          dangerColor={theme.accent.danger}
        />
        {(isCracking || isCracked) && (
          <CrackOverlay
            size={size}
            severity={
              isCracked ? 1 : crackSeverity(tile.crackAfter ?? 0)
            }
          />
        )}
      </g>
      {showPairRing && (
        <PairRing
          points={pairRing}
          color={pairTint!}
          highlighted={!!isPairHighlighted}
        />
      )}
      {isLocked && !isCracked && <LockIcon size={size} tint={pairTint} />}
      {isKey && !isLocked && !isCracked && <KeyBadge size={size} tint={pairTint} />}
      {isCracking && tile.crackAfter !== undefined && (
        <CrackBadge size={size} count={tile.crackAfter} />
      )}
      <g transform={`rotate(${arrowAngle})`}>
        <g ref={planeRef}>
          <PaperPlane size={size} color={tile.color} stroke={theme.tile.borderColor} />
        </g>
      </g>
    </g>
  );
}

function PaperPlane({ size, color, stroke }: { size: number; color: string; stroke: string }) {
  const S = size;
  const tip = `${S * 0.62},0`;
  const topBack = `${-S * 0.5},${-S * 0.42}`;
  const bottomBack = `${-S * 0.5},${S * 0.42}`;
  const tailNotch = `${-S * 0.18},0`;

  return (
    <g>
      <polygon
        points={`${tip} ${topBack} ${tailNotch} ${bottomBack}`}
        fill="rgba(0,0,0,0.30)"
        transform={`translate(${S * 0.05}, ${S * 0.1})`}
        style={{ filter: `blur(${S * 0.08}px)` }}
      />
      <polygon
        points={`${tip} ${topBack} ${tailNotch}`}
        fill={color}
        stroke={stroke}
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
      <polygon
        points={`${tip} ${bottomBack} ${tailNotch}`}
        fill={color}
        stroke={stroke}
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
      <polygon points={`${tip} ${bottomBack} ${tailNotch}`} fill="rgba(0,0,0,0.20)" />
      <line
        x1={S * 0.62} y1={0} x2={-S * 0.5} y2={0}
        stroke="rgba(255,255,255,0.7)" strokeWidth={1.2} strokeLinecap="round"
      />
    </g>
  );
}

function LockIcon({ size, tint }: { size: number; tint?: string }) {
  // Small padlock sigil drawn in the upper-right corner of the hex,
  // mirroring KeyBadge so a key/lock pair reads as a matched set.
  const cx = size * 0.42;
  const cy = -size * 0.42;
  const s = size * 0.30;
  const stroke = tint ?? "#FFFFFF";
  const bw = s * 0.95;
  const bh = s * 0.78;
  const rx = s * 0.18;
  const bodyY = s * 0.02;
  const shackleW = s * 0.55;
  const shackleH = s * 0.50;
  const shackleY = -s * 0.46;
  return (
    <g transform={`translate(${cx}, ${cy})`}>
      <circle r={s * 0.95} fill="rgba(0,0,0,0.62)" />
      <circle r={s * 0.95} fill="none" stroke={stroke} strokeWidth={1.4} />
      <path
        d={`M ${-shackleW / 2},${shackleY + shackleH} L ${-shackleW / 2},${shackleY} A ${shackleW / 2},${shackleH} 0 0 1 ${shackleW / 2},${shackleY} L ${shackleW / 2},${shackleY + shackleH}`}
        fill="none"
        stroke={stroke}
        strokeWidth={s * 0.18}
        strokeLinecap="round"
      />
      <rect
        x={-bw / 2}
        y={bodyY}
        width={bw}
        height={bh}
        rx={rx}
        ry={rx}
        fill={stroke}
        opacity={0.92}
      />
      <circle cx={0} cy={bodyY + bh * 0.42} r={s * 0.12} fill="rgba(0,0,0,0.55)" />
    </g>
  );
}

function KeyBadge({ size, tint }: { size: number; tint?: string }) {
  // Small key sigil drawn in the upper-right corner of the hex.
  // Sits over the tile body without obscuring the direction arrow.
  const cx = size * 0.42;
  const cy = -size * 0.42;
  const s = size * 0.30;
  const fill = tint ?? "#FFD56B";
  return (
    <g transform={`translate(${cx}, ${cy})`}>
      <circle r={s * 0.95} fill="rgba(0,0,0,0.55)" />
      <circle r={s * 0.95} fill="none" stroke={fill} strokeWidth={1.4} />
      <g>
        {/* bow (round head) */}
        <circle cx={-s * 0.32} cy={0} r={s * 0.32} fill="none" stroke={fill} strokeWidth={s * 0.16} />
        {/* shaft */}
        <line
          x1={-s * 0.04}
          y1={0}
          x2={s * 0.56}
          y2={0}
          stroke={fill}
          strokeWidth={s * 0.16}
          strokeLinecap="round"
        />
        {/* teeth */}
        <line
          x1={s * 0.30}
          y1={0}
          x2={s * 0.30}
          y2={s * 0.24}
          stroke={fill}
          strokeWidth={s * 0.14}
          strokeLinecap="round"
        />
        <line
          x1={s * 0.50}
          y1={0}
          x2={s * 0.50}
          y2={s * 0.18}
          stroke={fill}
          strokeWidth={s * 0.14}
          strokeLinecap="round"
        />
      </g>
    </g>
  );
}

function PairRing({
  points,
  color,
  highlighted,
}: {
  points: string;
  color: string;
  highlighted: boolean;
}) {
  return (
    <g style={{ pointerEvents: "none" }}>
      {highlighted && (
        <motion.polygon
          points={points}
          fill="none"
          stroke={color}
          strokeWidth={5}
          strokeLinejoin="round"
          style={{ filter: `drop-shadow(0 0 8px ${color})` }}
          animate={{ opacity: [0.55, 1, 0.55] }}
          transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      <polygon
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={highlighted ? 3.2 : 2.4}
        strokeLinejoin="round"
        opacity={highlighted ? 1 : 0.9}
        style={{ filter: `drop-shadow(0 0 4px ${color})` }}
      />
    </g>
  );
}

/** 0..1: how fractured the tile is. We use crackAfter (counts down to 0) so
 *  a higher number = closer to breaking = more visible cracks. */
function crackSeverity(crackAfter: number): number {
  if (crackAfter <= 0) return 1;
  if (crackAfter === 1) return 0.78;
  if (crackAfter === 2) return 0.56;
  if (crackAfter === 3) return 0.40;
  return 0.28;
}

function CrackOverlay({ size, severity }: { size: number; severity: number }) {
  // A few hand-tuned crack polylines on the tile body. We reveal more lines
  // as severity rises; existing lines stay (cracks propagate, never heal).
  const S = size;
  const lines: string[] = [
    `M ${-S * 0.55},${-S * 0.10} L ${-S * 0.18},${-S * 0.02} L ${S * 0.08},${S * 0.18} L ${S * 0.46},${S * 0.12}`,
    `M ${-S * 0.18},${-S * 0.02} L ${-S * 0.04},${-S * 0.42}`,
    `M ${S * 0.08},${S * 0.18} L ${-S * 0.10},${S * 0.50}`,
    `M ${S * 0.08},${S * 0.18} L ${S * 0.34},${S * 0.50}`,
  ];
  const visible =
    severity >= 1 ? lines.length :
    severity >= 0.7 ? 4 :
    severity >= 0.5 ? 3 :
    severity >= 0.35 ? 2 :
    1;
  const stroke = severity >= 1 ? "rgba(35,15,25,0.85)" : "rgba(35,15,25,0.62)";
  return (
    <g style={{ pointerEvents: "none" }}>
      {lines.slice(0, visible).map((d, i) => (
        <g key={i}>
          {/* soft white halo so cracks read on dark or bright tiles alike */}
          <path
            d={d}
            stroke="rgba(255,255,255,0.55)"
            strokeWidth={1.8 + severity * 0.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <path
            d={d}
            stroke={stroke}
            strokeWidth={1.0 + severity * 1.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </g>
      ))}
    </g>
  );
}

function CrackBadge({ size, count }: { size: number; count: number }) {
  // Small numeric badge top-right showing clears remaining before the tile breaks.
  const cx = size * 0.42;
  const cy = -size * 0.42;
  const r = size * 0.30;
  const urgent = count <= 2;
  return (
    <g transform={`translate(${cx}, ${cy})`} style={{ pointerEvents: "none" }}>
      <motion.circle
        r={r}
        fill={urgent ? "#FF5577" : "rgba(20,20,30,0.78)"}
        stroke="rgba(255,255,255,0.9)"
        strokeWidth={1.4}
        animate={urgent ? { scale: [1, 1.15, 1] } : { scale: 1 }}
        transition={{ duration: 0.9, repeat: urgent ? Infinity : 0, ease: "easeInOut" }}
        style={{ transformOrigin: "0 0", filter: urgent ? "drop-shadow(0 0 5px #FF5577)" : undefined }}
      />
      <text
        textAnchor="middle"
        dominantBaseline="central"
        fill="#FFFFFF"
        style={{
          fontFamily: "var(--font-display), system-ui, sans-serif",
          fontWeight: 800,
          fontSize: r * 1.15,
          userSelect: "none",
        }}
      >
        {count}
      </text>
    </g>
  );
}

export function TileBody({
  points,
  color,
  arrowAngle,
  size,
  shakeFlash,
  wobble = 0,
  arrowColor,
  arrowHl,
  borderColor,
  innerHl,
  shadowColor,
  bloomOpacity,
  glossOpacity,
  dangerColor,
}: {
  points: string;
  color: string;
  arrowAngle: number;
  size: number;
  shakeFlash: boolean;
  wobble?: number;
  arrowColor: string;
  arrowHl: string;
  borderColor: string;
  innerHl: string;
  shadowColor: string;
  bloomOpacity: number;
  glossOpacity: number;
  dangerColor: string;
}) {
  const arrowLen = size * 0.50;
  const innerPoints = hexCornerPoints(size * 0.78);

  return (
    <g>
      {/* Soft outer bloom — slow ambient pulse */}
      <motion.polygon
        points={points}
        fill={color}
        opacity={0}
        style={{ filter: `blur(${size * 0.32}px)` }}
        animate={{ opacity: [bloomOpacity * 0.6, bloomOpacity, bloomOpacity * 0.6] }}
        transition={{
          duration: 3.6,
          repeat: Infinity,
          ease: "easeInOut",
          delay: wobble * 1.6,
        }}
      />

      {/* Drop shadow — colored for cozy feel */}
      <polygon
        points={points}
        fill={shadowColor}
        transform={`translate(0, ${size * 0.12})`}
        style={{ filter: `blur(${size * 0.12}px)` }}
        opacity={0.85}
      />

      {/* Main body */}
      <polygon points={points} fill={color} />

      {/* Depth gradient — top-left bright, bottom-right shadowed */}
      <polygon points={points} fill="url(#tileDepth)" />

      {/* Inner subtle ring */}
      <polygon
        points={innerPoints}
        fill="none"
        stroke={innerHl}
        strokeWidth={1}
      />

      {/* Specular top highlight — wider, marshmallow-soft */}
      <ellipse
        cx={0}
        cy={-size * 0.45}
        rx={size * 0.55}
        ry={size * 0.16}
        fill="url(#tileSpecular)"
        opacity={glossOpacity}
      />

      {/* Slow shine sweep */}
      <motion.polygon
        points={points}
        fill="url(#tileShine)"
        animate={{ opacity: [0, 0.30, 0] }}
        transition={{
          duration: 4.8,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2 + wobble * 4,
        }}
      />

      {/* Outer border — softer, theme-driven */}
      <motion.polygon
        points={points}
        fill="none"
        stroke={shakeFlash ? dangerColor : borderColor}
        strokeWidth={shakeFlash ? 2.6 : 1.4}
        strokeLinejoin="round"
        animate={
          shakeFlash
            ? { opacity: [1, 0.4, 1] }
            : { opacity: [0.6, 0.95, 0.6] }
        }
        transition={
          shakeFlash
            ? { duration: 0.22, repeat: 1 }
            : { duration: 3.4, repeat: Infinity, ease: "easeInOut", delay: wobble * 2 }
        }
      />

      {/* Direction arrow — theme-driven color */}
      <g transform={`rotate(${arrowAngle})`}>
        <line
          x1={-arrowLen / 2 + 1}
          y1={1.5}
          x2={arrowLen / 2 - 5}
          y2={1.5}
          stroke="rgba(0,0,0,0.18)"
          strokeWidth={4}
          strokeLinecap="round"
        />
        <line
          x1={-arrowLen / 2}
          y1={0}
          x2={arrowLen / 2 - 6}
          y2={0}
          stroke={arrowColor}
          strokeWidth={3.2}
          strokeLinecap="round"
        />
        <polygon
          points={`${arrowLen / 2},0 ${arrowLen / 2 - 10},-7 ${arrowLen / 2 - 10},7`}
          fill={arrowColor}
        />
        <line
          x1={-arrowLen / 2 + 2}
          y1={-1.2}
          x2={arrowLen / 2 - 9}
          y2={-1.2}
          stroke={arrowHl}
          strokeWidth={0.9}
          strokeLinecap="round"
        />
      </g>
    </g>
  );
}
