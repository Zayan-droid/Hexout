import { useMemo, useRef, useState } from "react";
import { useGameStore, tilesInBombRadius } from "@/store/gameStore";
import { usePowerUpStore } from "@/store/powerupStore";
import { createHexagonBoardCells, hexKey, hexToPixel, isInsideRadius } from "@/game/grid/hex";
import { HexCell } from "./HexCell";
import { TileView } from "./TileView";
import { ParticleCanvas, type ParticleCanvasHandle } from "./ParticleCanvas";
import { PowerUpEffects } from "./powerups/PowerUpEffects";
import { useTheme } from "./ThemeProvider";
import { POWER_UPS } from "@/types/powerup";
import { routeTileClick } from "@/game/powerups/controller";
import { getPairTints } from "@/game/lockColors";

interface GameBoardProps {
  width: number;
  height: number;
}

const SHAKE_MS = 400;

export function GameBoard({ width, height }: GameBoardProps) {
  const theme = useTheme();
  const tiles = useGameStore((s) => s.tiles);
  const level = useGameStore((s) => s.level);
  const gridRadius = useGameStore((s) => s.gridRadius);
  const currentRadius = useGameStore((s) => s.mutationRuntime.currentRadius);
  const hazardousHexes = useGameStore((s) => s.mutationRuntime.hazardousHexes);
  const animatingId = useGameStore((s) => s.animatingId);
  const clearedKeys = useGameStore((s) => s.clearedKeys);
  const attemptMove = useGameStore((s) => s.attemptMove);
  const finishExit = useGameStore((s) => s.finishExit);

  const activePowerUp = usePowerUpStore((s) => s.active);
  const picks = usePowerUpStore((s) => s.picks);

  const [shakingId, setShakingId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const particleRef = useRef<ParticleCanvasHandle>(null);

  const size = useMemo(() => {
    const horizSpan = Math.sqrt(3) * (2 * gridRadius + 1);
    const vertSpan = 1.5 * (2 * gridRadius + 1) + 0.5;
    const sx = width / horizSpan;
    const sy = height / vertSpan;
    return Math.floor(Math.min(sx, sy) * 0.90);
  }, [width, height, gridRadius]);

  const cells = useMemo(() => createHexagonBoardCells(gridRadius), [gridRadius]);

  const { offsetX, offsetY, boardW, boardH, minX, minY } = useMemo(() => {
    if (cells.length === 0)
      return { offsetX: 0, offsetY: 0, boardW: 0, boardH: 0, minX: 0, minY: 0 };
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const c of cells) {
      const { x, y } = hexToPixel(c, size);
      if (x - size < minX) minX = x - size;
      if (y - size < minY) minY = y - size;
      if (x + size > maxX) maxX = x + size;
      if (y + size > maxY) maxY = y + size;
    }
    const boardW = maxX - minX;
    const boardH = maxY - minY;
    return {
      offsetX: -minX + (width - boardW) / 2,
      offsetY: -minY + (height - boardH) / 2,
      boardW,
      boardH,
      minX,
      minY,
    };
  }, [cells, size, width, height]);

  // For bomb preview when hovered while armed
  const bombHoverTargets = useMemo(() => {
    if (activePowerUp !== "bomb" || !hoverId) return new Set<string>();
    const tile = tiles.find((t) => t.id === hoverId);
    if (!tile) return new Set<string>();
    return new Set(tilesInBombRadius(tile).map((t) => t.id));
  }, [activePowerUp, hoverId, tiles]);

  // Color preview for colorClear
  const colorClearMatchIds = useMemo(() => {
    if (activePowerUp !== "colorClear" || !hoverId) return new Set<string>();
    const tile = tiles.find((t) => t.id === hoverId);
    if (!tile) return new Set<string>();
    return new Set(tiles.filter((t) => t.color === tile.color).map((t) => t.id));
  }, [activePowerUp, hoverId, tiles]);

  // Stable key→tint mapping derived from the *original* level data so colors
  // don't shift as tiles clear.
  const pairTints = useMemo(
    () => (level ? getPairTints(level.tiles) : new Map<string, string>()),
    [level]
  );

  // Hovering a key or locked tile highlights every tile that shares its pair id.
  const highlightedPairIds = useMemo(() => {
    if (!hoverId || activePowerUp) return new Set<string>();
    const tile = tiles.find((t) => t.id === hoverId);
    const pairId = tile?.key ?? tile?.locked;
    if (!pairId) return new Set<string>();
    return new Set(
      tiles.filter((t) => t.key === pairId || t.locked === pairId).map((t) => t.id)
    );
  }, [hoverId, tiles, activePowerUp]);

  const handleTileClick = (tileId: string) => {
    if (animatingId) return;
    // Power-up routes first
    if (activePowerUp && routeTileClick(tileId)) return;

    const result = attemptMove(tileId);
    if (result.kind === "blocked") {
      setShakingId(tileId);
      setTimeout(() => setShakingId((c) => (c === tileId ? null : c)), SHAKE_MS);
    }
  };

  const handleExitComplete = (tileId: string) => {
    const tile = tiles.find((t) => t.id === tileId);
    if (tile && particleRef.current) {
      const { x, y } = hexToPixel({ q: tile.q, r: tile.r }, size);
      particleRef.current.burst(offsetX + x, offsetY + y, tile.color, 16);
    }
    finishExit(tileId);
  };

  // Board frame around the playable hex area
  const framePad = Math.max(18, size * 0.55);
  const frameX = offsetX + minX - framePad;
  const frameY = offsetY + minY - framePad;
  const frameW = boardW + framePad * 2;
  const frameH = boardH + framePad * 2;

  const cellWellTop = theme.board.cellInner;

  // Active power-up tint for target highlights
  const armedTint = activePowerUp ? POWER_UPS[activePowerUp].hue : theme.accent.primary;

  return (
    <div
      style={{
        position: "relative",
        width,
        height,
        transform: "translate(var(--gb-shake-x, 0), var(--gb-shake-y, 0))",
        willChange: "transform",
      }}
    >
      {/* Cozy board surface */}
      <div
        className="theme-fade"
        style={{
          position: "absolute",
          left: frameX,
          top: frameY,
          width: frameW,
          height: frameH,
          borderRadius: 32,
          background: "var(--board-fill)",
          border: "1px solid var(--board-stroke)",
          boxShadow: "var(--board-outer-shadow), var(--board-inner-shadow)",
          pointerEvents: "none",
        }}
      >
        {/* Soft decorative dot pattern, very subtle */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 32,
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.30) 1px, transparent 1.5px)",
            backgroundSize: "22px 22px",
            opacity: 0.35,
            mixBlendMode: "soft-light",
            pointerEvents: "none",
          }}
        />

        {/* Soft armed-state colored vignette — barely there, gives the board a hum */}
        {activePowerUp && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 32,
              boxShadow: `inset 0 0 32px color-mix(in srgb, ${armedTint} 32%, transparent)`,
              pointerEvents: "none",
              transition: "box-shadow 0.4s ease",
            }}
          />
        )}
      </div>

      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ display: "block", position: "absolute", inset: 0 }}
      >
        <defs>
          {/* Top-bright depth gradient on tiles (soft, paper-light) */}
          <radialGradient id="tileDepth" cx="32%" cy="22%" r="85%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.45)" />
            <stop offset="40%" stopColor="rgba(255,255,255,0.05)" />
            <stop offset="75%" stopColor="rgba(0,0,0,0.04)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.18)" />
          </radialGradient>

          {/* Top specular highlight */}
          <radialGradient id="tileSpecular" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.92)" />
            <stop offset="55%" stopColor="rgba(255,255,255,0.18)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>

          <linearGradient id="tileShine" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0)" />
            <stop offset="45%" stopColor="rgba(255,255,255,0)" />
            <stop offset="55%" stopColor="rgba(255,255,255,0.55)" />
            <stop offset="65%" stopColor="rgba(255,255,255,0)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>

          {/* Empty-cell soft well — uses theme inner color */}
          <radialGradient id="cellWell" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={cellWellTop} />
            <stop offset="60%" stopColor={cellWellTop} stopOpacity="0.20" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.08)" />
          </radialGradient>
        </defs>

        <g transform={`translate(${offsetX},${offsetY})`}>
          {cells.map((c) => {
            const dead = !isInsideRadius(c, currentRadius);
            const hazardous = !dead && hazardousHexes.has(hexKey(c.q, c.r));
            return (
              <HexCell
                key={`c-${c.q}-${c.r}`}
                hex={c}
                size={size}
                hazardous={hazardous}
                dead={dead}
              />
            );
          })}

          {tiles.map((tile) => {
            const isPicked = picks.includes(tile.id);
            const isCracked = !!tile.cracked;
            const isCracking = !isCracked && tile.crackAfter !== undefined && tile.crackAfter > 0;
            const isLocked =
              !isCracked && !!tile.locked && !clearedKeys.has(tile.locked);
            const isKey = !!tile.key;
            const pairId = tile.key ?? tile.locked;
            const pairTint = pairId ? pairTints.get(pairId) : undefined;
            const isPairHighlighted = highlightedPairIds.has(tile.id);
            const isTargetable =
              !!activePowerUp &&
              !isPicked &&
              (activePowerUp === "colorClear" && colorClearMatchIds.size > 0 && hoverId
                ? colorClearMatchIds.has(tile.id)
                : true);
            const isPreviewedDanger = bombHoverTargets.has(tile.id);

            return (
              <g
                key={tile.id}
                onMouseEnter={() => setHoverId(tile.id)}
                onMouseLeave={() => setHoverId((h) => (h === tile.id ? null : h))}
                onTouchStart={() => setHoverId(tile.id)}
                onTouchEnd={() => setHoverId((h) => (h === tile.id ? null : h))}
                onTouchCancel={() => setHoverId((h) => (h === tile.id ? null : h))}
              >
                <TileView
                  tile={tile}
                  size={size}
                  gridRadius={gridRadius}
                  isAnimating={animatingId === tile.id}
                  isShaking={shakingId === tile.id}
                  isLocked={isLocked}
                  isCracking={isCracking}
                  isCracked={isCracked}
                  isKey={isKey}
                  pairTint={pairTint}
                  isPairHighlighted={isPairHighlighted}
                  isTargetable={isTargetable}
                  isPicked={isPicked}
                  isPreviewedDanger={isPreviewedDanger}
                  targetTint={armedTint}
                  onClick={() => handleTileClick(tile.id)}
                  onExitComplete={() => handleExitComplete(tile.id)}
                />
              </g>
            );
          })}
        </g>
      </svg>

      <ParticleCanvas
        ref={particleRef}
        width={width}
        height={height}
        shape={theme.particle.shape}
        accents={theme.particle.accents}
      />

      <PowerUpEffects
        width={width}
        height={height}
        size={size}
        offsetX={offsetX}
        offsetY={offsetY}
      />
    </div>
  );
}
