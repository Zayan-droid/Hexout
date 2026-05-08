import { create } from "zustand";
import type { GameStatus, LevelData, Tile } from "@/types";
import { buildOccupancy, hasAnyValidMove, resolveMove } from "@/game/engine/movement";
import { AudioManager } from "@/services/audio";

const TILE_PALETTE = [
  "#ffd23f",
  "#ff8a3d",
  "#4ade80",
  "#60a5fa",
  "#c084fc",
  "#f472b6",
  "#22d3ee",
];

// Milliseconds within which back-to-back clears count as a combo.
const COMBO_WINDOW_MS = 1200;

interface GameState {
  level: LevelData | null;
  tiles: Tile[];
  gridRadius: number;
  status: GameStatus;
  moves: number;
  comboCount: number;
  lastClearTime: number;
  animatingId: string | null;
  lastClearedPos: { q: number; r: number } | null;

  loadLevel: (level: LevelData) => void;
  reset: () => void;
  attemptMove: (tileId: string) => { kind: "exits" | "blocked" | "invalid" };
  finishExit: (tileId: string) => void;
}

const colorForIndex = (i: number) => TILE_PALETTE[i % TILE_PALETTE.length];

export const useGameStore = create<GameState>((set, get) => ({
  level: null,
  tiles: [],
  gridRadius: 0,
  status: "playing",
  moves: 0,
  comboCount: 0,
  lastClearTime: 0,
  animatingId: null,
  lastClearedPos: null,

  loadLevel: (level) => {
    const tiles: Tile[] = level.tiles.map((t, i) => ({
      id: `t${i}`,
      type: t.type ?? "NORMAL",
      direction: t.direction,
      color: t.color ?? colorForIndex(i),
      q: t.q,
      r: t.r,
    }));
    set({
      level,
      tiles,
      gridRadius: level.gridRadius,
      status: "playing",
      moves: 0,
      comboCount: 0,
      lastClearTime: 0,
      animatingId: null,
      lastClearedPos: null,
    });
  },

  reset: () => {
    const lvl = get().level;
    if (lvl) get().loadLevel(lvl);
  },

  attemptMove: (tileId) => {
    const { tiles, gridRadius, status, animatingId } = get();
    if (status !== "playing" || animatingId) return { kind: "invalid" };
    const tile = tiles.find((t) => t.id === tileId);
    if (!tile) return { kind: "invalid" };

    const occ = buildOccupancy(tiles);
    const outcome = resolveMove(tile, occ, gridRadius);

    if (outcome.kind === "exits") {
      AudioManager.slide();
      set({ animatingId: tileId, moves: get().moves + 1 });
      return { kind: "exits" };
    }

    AudioManager.blocked();
    set({ moves: get().moves + 1 });
    return { kind: "blocked" };
  },

  finishExit: (tileId) => {
    const { tiles, gridRadius, lastClearTime, comboCount } = get();
    const tile = tiles.find((t) => t.id === tileId);
    const remaining = tiles.filter((t) => t.id !== tileId);

    const now = Date.now();
    const isCombo = now - lastClearTime < COMBO_WINDOW_MS;
    const newCombo = isCombo ? comboCount + 1 : 1;

    if (newCombo >= 2) {
      AudioManager.combo(newCombo);
    } else {
      AudioManager.clear();
    }

    // Haptic: short pulse on clear, double on combo
    if (navigator.vibrate) {
      navigator.vibrate(newCombo >= 2 ? [30, 10, 30] : [20]);
    }

    let nextStatus: GameStatus = "playing";
    if (remaining.length === 0) {
      nextStatus = "won";
      setTimeout(() => AudioManager.win(), 120);
    } else if (!hasAnyValidMove(remaining, gridRadius)) {
      nextStatus = "lost";
      setTimeout(() => AudioManager.lost(), 80);
    }

    set({
      tiles: remaining,
      animatingId: null,
      status: nextStatus,
      comboCount: newCombo,
      lastClearTime: now,
      lastClearedPos: tile ? { q: tile.q, r: tile.r } : null,
    });
  },
}));
