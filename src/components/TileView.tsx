import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import type { Tile } from "@/types";
import { hexCornerPoints, hexToPixel } from "@/game/grid/hex";
import { DIRECTION_ANGLE_DEG, DIRECTION_VECTORS } from "@/game/grid/directions";

interface TileViewProps {
  tile: Tile;
  size: number;
  gridRadius: number;
  isAnimating: boolean;
  isShaking: boolean;
  onClick: () => void;
  onExitComplete: () => void;
}

const EXIT_OVERSHOOT_HEXES = 1.8;

export function TileView({
  tile,
  size,
  gridRadius,
  isAnimating,
  isShaking,
  onClick,
  onExitComplete,
}: TileViewProps) {
  const groupRef = useRef<SVGGElement>(null);
  const hasExited = useRef(false);
  const startPx = hexToPixel({ q: tile.q, r: tile.r }, size);
  const dirVec = DIRECTION_VECTORS[tile.direction];

  const stepsToExit = 2 * gridRadius + EXIT_OVERSHOOT_HEXES;
  const exitPx = hexToPixel(
    {
      q: tile.q + dirVec.q * stepsToExit,
      r: tile.r + dirVec.r * stepsToExit,
    },
    size
  );

  // Set initial position on mount / tile change.
  useEffect(() => {
    if (!groupRef.current) return;
    gsap.set(groupRef.current, {
      x: startPx.x,
      y: startPx.y,
      scale: 1,
      opacity: 1,
    });
    hasExited.current = false;
  }, [tile.q, tile.r, startPx.x, startPx.y]);

  // Trigger GSAP exit animation when isAnimating becomes true.
  useEffect(() => {
    if (!isAnimating || !groupRef.current || hasExited.current) return;
    hasExited.current = true;

    gsap.to(groupRef.current, {
      x: exitPx.x,
      y: exitPx.y,
      scale: 0.55,
      opacity: 0,
      duration: 0.42,
      ease: "power3.in",
      onComplete: onExitComplete,
    });
  }, [isAnimating, exitPx.x, exitPx.y, onExitComplete]);

  // GSAP shake on blocked move.
  useEffect(() => {
    if (!isShaking || !groupRef.current) return;
    gsap.to(groupRef.current, {
      keyframes: [
        { x: startPx.x - 6, duration: 0.04 },
        { x: startPx.x + 6, duration: 0.07 },
        { x: startPx.x - 5, duration: 0.06 },
        { x: startPx.x + 4, duration: 0.06 },
        { x: startPx.x, duration: 0.05 },
      ],
    });
  }, [isShaking, startPx.x, startPx.y]);

  const points = hexCornerPoints(size * 0.92);
  const arrowAngle = DIRECTION_ANGLE_DEG[tile.direction];

  return (
    <g
      ref={groupRef}
      style={{ cursor: isAnimating ? "default" : "pointer" }}
      onClick={(e) => {
        e.stopPropagation();
        if (!isAnimating) onClick();
      }}
    >
      <TileBody
        points={points}
        color={tile.color}
        arrowAngle={arrowAngle}
        size={size}
        shakeFlash={isShaking}
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
}: {
  points: string;
  color: string;
  arrowAngle: number;
  size: number;
  shakeFlash: boolean;
}) {
  const arrowLen = size * 0.52;
  // Inner glow animation via framer-motion on the glow polygon.
  return (
    <g>
      {/* Outer ambient glow — pulsing */}
      <motion.polygon
        points={points}
        fill={color}
        opacity={0}
        style={{ filter: `blur(${size * 0.28}px)` }}
        animate={{ opacity: [0.22, 0.38, 0.22] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Main body */}
      <polygon points={points} fill={color} />
      {/* Gloss sheen */}
      <polygon points={points} fill="url(#tileSheen)" opacity={0.4} />
      {/* Animated border — brightens on shake */}
      <motion.polygon
        points={points}
        fill="none"
        stroke={shakeFlash ? "#ff4d6d" : "rgba(255,255,255,0.6)"}
        strokeWidth={shakeFlash ? 3 : 1.5}
        animate={
          shakeFlash
            ? { opacity: [1, 0.4, 1] }
            : { opacity: [0.5, 1, 0.5] }
        }
        transition={
          shakeFlash
            ? { duration: 0.2, repeat: 1 }
            : { duration: 2.8, repeat: Infinity, ease: "easeInOut" }
        }
      />
      {/* Direction arrow */}
      <g transform={`rotate(${arrowAngle})`}>
        <line
          x1={-arrowLen / 2}
          y1={0}
          x2={arrowLen / 2 - 6}
          y2={0}
          stroke="rgba(20,12,4,0.9)"
          strokeWidth={3.5}
          strokeLinecap="round"
        />
        <polygon
          points={`${arrowLen / 2},0 ${arrowLen / 2 - 10},-7 ${arrowLen / 2 - 10},7`}
          fill="rgba(20,12,4,0.9)"
        />
      </g>
    </g>
  );
}
