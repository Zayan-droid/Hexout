import { useMemo, useRef, useState } from "react";
import { useGameStore } from "@/store/gameStore";
import { createHexagonBoardCells, hexToPixel } from "@/game/grid/hex";
import { HexCell } from "./HexCell";
import { TileView } from "./TileView";
import { ParticleCanvas, type ParticleCanvasHandle } from "./ParticleCanvas";

interface GameBoardProps {
  width: number;
  height: number;
}

const SHAKE_MS = 400;

export function GameBoard({ width, height }: GameBoardProps) {
  const tiles = useGameStore((s) => s.tiles);
  const gridRadius = useGameStore((s) => s.gridRadius);
  const animatingId = useGameStore((s) => s.animatingId);
  const attemptMove = useGameStore((s) => s.attemptMove);
  const finishExit = useGameStore((s) => s.finishExit);

  const [shakingId, setShakingId] = useState<string | null>(null);
  const particleRef = useRef<ParticleCanvasHandle>(null);

  const size = useMemo(() => {
    const horizSpan = Math.sqrt(3) * (2 * gridRadius + 1);
    const vertSpan = 1.5 * (2 * gridRadius + 1) + 0.5;
    const sx = width / horizSpan;
    const sy = height / vertSpan;
    return Math.floor(Math.min(sx, sy) * 0.92);
  }, [width, height, gridRadius]);

  const cells = useMemo(() => createHexagonBoardCells(gridRadius), [gridRadius]);

  const { offsetX, offsetY } = useMemo(() => {
    if (cells.length === 0) return { offsetX: 0, offsetY: 0 };
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
    };
  }, [cells, size, width, height]);

  const handleTileClick = (tileId: string) => {
    if (animatingId) return;
    const result = attemptMove(tileId);
    if (result.kind === "blocked") {
      setShakingId(tileId);
      setTimeout(() => setShakingId((c) => (c === tileId ? null : c)), SHAKE_MS);
    }
  };

  const handleExitComplete = (tileId: string) => {
    // Fire particle burst at the tile's board position before removing it.
    const tile = tiles.find((t) => t.id === tileId);
    if (tile && particleRef.current) {
      const { x, y } = hexToPixel({ q: tile.q, r: tile.r }, size);
      particleRef.current.burst(offsetX + x, offsetY + y, tile.color, 16);
    }
    finishExit(tileId);
  };

  return (
    <div style={{ position: "relative", width, height }}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ display: "block", position: "absolute", inset: 0 }}
      >
        <defs>
          <linearGradient id="tileSheen" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.55)" />
            <stop offset="55%" stopColor="rgba(255,255,255,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.25)" />
          </linearGradient>
        </defs>

        <g transform={`translate(${offsetX},${offsetY})`}>
          {cells.map((c) => (
            <HexCell key={`c-${c.q}-${c.r}`} hex={c} size={size} />
          ))}

          {tiles.map((tile) => (
            <TileView
              key={tile.id}
              tile={tile}
              size={size}
              gridRadius={gridRadius}
              isAnimating={animatingId === tile.id}
              isShaking={shakingId === tile.id}
              onClick={() => handleTileClick(tile.id)}
              onExitComplete={() => handleExitComplete(tile.id)}
            />
          ))}
        </g>
      </svg>

      <ParticleCanvas ref={particleRef} width={width} height={height} />
    </div>
  );
}
