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
  /** ambient pulse — tile is a valid power-up target */
  isTargetable?: boolean;
  /** glow + lift — tile is the first pick of a swap */
  isPicked?: boolean;
  /** soft danger ring — tile is in current bomb preview */
  isPreviewedDanger?: boolean;
  /** glow tint to use when targetable; falls back to theme primary */
  targetTint?: string;
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
  isTargetable,
  isPicked,
  isPreviewedDanger,
  targetTint,
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
  const tint = targetTint ?? theme.accent.primary;

  return (
    <g
      ref={groupRef}
      style={{ cursor: isAnimating ? "default" : "pointer" }}
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

      <g ref={hexBodyRef}>
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
      </g>
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
