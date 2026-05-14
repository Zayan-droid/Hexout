import { create } from "zustand";
import type { GameStatus, LevelData, Tile, Hex } from "@/types";
import { buildOccupancy, hasAnyValidMove, resolveMove } from "@/game/engine/movement";
import {
  applyMutationTick,
  initMutationRuntime,
  CRACKED_LOCK,
  type MutationRuntime,
} from "@/game/engine/mutations";
import { AudioManager } from "@/services/audio";
import { useThemeStore } from "@/store/themeStore";
import { getTheme } from "@/themes";
import { DIRECTION_VECTORS } from "@/game/grid/directions";
import { isInsideRadius, hexKey } from "@/game/grid/hex";
import { usePowerUpStore } from "@/store/powerupStore";

function getTilePalette(): string[] {
  return getTheme(useThemeStore.getState().themeId).tiles;
}

// Milliseconds within which back-to-back clears count as a combo.
const COMBO_WINDOW_MS = 1200;

interface UndoSnapshot {
  tiles: Tile[];
  moves: number;
  status: GameStatus;
  comboCount: number;
  lastClearTime: number;
  clearedKeys: Set<string>;
  mutationRuntime: MutationRuntime;
}

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
  /** Key values whose owner tiles have been cleared; gates locked tiles. */
  clearedKeys: Set<string>;
  /** Active mutation state — shifts, shrink, hazard telegraph. */
  mutationRuntime: MutationRuntime;

  /** snapshot before the most recent move — fuel for the Rewind power-up */
  undoBuffer: UndoSnapshot | null;

  loadLevel: (level: LevelData) => void;
  reset: () => void;
  retintTiles: () => void;
  attemptMove: (tileId: string) => { kind: "exits" | "blocked" | "invalid" };
  finishExit: (tileId: string) => void;

  // Power-up surface
  removeTiles: (ids: string[], finishCheck?: boolean) => void;
  swapTiles: (idA: string, idB: string) => void;
  shuffleTiles: () => { before: Tile[]; after: Tile[] };
  undoLast: () => Tile | null;
}

const colorForIndex = (i: number) => {
  const palette = getTilePalette();
  return palette[i % palette.length];
};

function snapshot(s: GameState): UndoSnapshot {
  return {
    tiles: s.tiles.map((t) => ({ ...t })),
    moves: s.moves,
    status: s.status,
    comboCount: s.comboCount,
    lastClearTime: s.lastClearTime,
    clearedKeys: new Set(s.clearedKeys),
    mutationRuntime: {
      ...s.mutationRuntime,
      nextShiftIn: [...s.mutationRuntime.nextShiftIn],
      hazardousHexes: new Set(s.mutationRuntime.hazardousHexes),
    },
  };
}

const EMPTY_RUNTIME: MutationRuntime = {
  currentRadius: 0,
  hazardousHexes: new Set(),
  nextShiftIn: [],
  nextShrinkIn: Infinity,
  shiftSpecs: [],
  shrinkSpec: null,
};

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
  clearedKeys: new Set(),
  mutationRuntime: EMPTY_RUNTIME,
  undoBuffer: null,

  loadLevel: (level) => {
    const tiles: Tile[] = level.tiles.map((t, i) => ({
      id: `t${i}`,
      type: t.type ?? "NORMAL",
      direction: t.direction,
      color: colorForIndex(i),
      q: t.q,
      r: t.r,
      locked: t.locked,
      key: t.key,
      crackAfter: t.crackAfter,
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
      clearedKeys: new Set(),
      mutationRuntime: initMutationRuntime(level),
      undoBuffer: null,
    });
    usePowerUpStore.getState().resetForLevel();
  },

  reset: () => {
    const lvl = get().level;
    if (lvl) get().loadLevel(lvl);
  },

  attemptMove: (tileId) => {
    const state = get();
    const { tiles, mutationRuntime, status, animatingId } = state;
    if (status !== "playing" || animatingId) return { kind: "invalid" };
    const tile = tiles.find((t) => t.id === tileId);
    if (!tile) return { kind: "invalid" };

    if (tile.locked && !state.clearedKeys.has(tile.locked)) {
      return { kind: "invalid" };
    }

    const occ = buildOccupancy(tiles);
    const outcome = resolveMove(tile, occ, mutationRuntime.currentRadius);

    if (outcome.kind === "exits") {
      AudioManager.slide();
      set({
        animatingId: tileId,
        moves: state.moves + 1,
        undoBuffer: snapshot(state),
      });
      return { kind: "exits" };
    }

    AudioManager.blocked();
    set({ moves: state.moves + 1 });
    return { kind: "blocked" };
  },

  retintTiles: () => {
    const palette = getTilePalette();
    set((s) => ({
      tiles: s.tiles.map((t, i) => ({ ...t, color: palette[i % palette.length] })),
    }));
  },

  finishExit: (tileId) => {
    const { tiles, mutationRuntime, lastClearTime, comboCount, clearedKeys } = get();
    const tile = tiles.find((t) => t.id === tileId);
    const afterClear = tiles.filter((t) => t.id !== tileId);

    const nextClearedKeys = tile?.key
      ? new Set([...clearedKeys, tile.key])
      : clearedKeys;

    // Apply mutation tick (crack → shift → shrink) on the post-clear board.
    const ticked = applyMutationTick(afterClear, mutationRuntime);
    const remaining = ticked.tiles;

    const now = Date.now();
    const isCombo = now - lastClearTime < COMBO_WINDOW_MS;
    const newCombo = isCombo ? comboCount + 1 : 1;

    if (newCombo >= 2) {
      AudioManager.combo(newCombo);
    } else {
      AudioManager.clear();
    }

    if (navigator.vibrate) {
      navigator.vibrate(newCombo >= 2 ? [30, 10, 30] : [20]);
    }

    // Cracked tiles are permanent obstacles — win when all non-cracked tiles are gone.
    const playable = remaining.filter((t) => t.locked !== CRACKED_LOCK);
    let nextStatus: GameStatus = "playing";
    if (playable.length === 0) {
      nextStatus = "won";
      setTimeout(() => AudioManager.win(), 120);
    } else if (
      !hasAnyValidMove(remaining, ticked.runtime.currentRadius, nextClearedKeys)
    ) {
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
      clearedKeys: nextClearedKeys,
      mutationRuntime: ticked.runtime,
    });
  },

  removeTiles: (ids, finishCheck = true) => {
    const state = get();
    set({ undoBuffer: snapshot(state) });
    const removeSet = new Set(ids);
    const remaining = state.tiles.filter((t) => !removeSet.has(t.id));

    let nextStatus: GameStatus = state.status;
    if (finishCheck) {
      const playable = remaining.filter((t) => t.locked !== CRACKED_LOCK);
      if (playable.length === 0) {
        nextStatus = "won";
        setTimeout(() => AudioManager.win(), 120);
      } else if (
        !hasAnyValidMove(remaining, state.mutationRuntime.currentRadius, state.clearedKeys)
      ) {
        nextStatus = "lost";
        setTimeout(() => AudioManager.lost(), 80);
      }
    }

    set({ tiles: remaining, status: nextStatus });
  },

  swapTiles: (idA, idB) => {
    const state = get();
    set({ undoBuffer: snapshot(state) });
    const tiles = state.tiles.map((t) => {
      if (t.id === idA) {
        const b = state.tiles.find((x) => x.id === idB);
        if (!b) return t;
        return { ...t, q: b.q, r: b.r };
      }
      if (t.id === idB) {
        const a = state.tiles.find((x) => x.id === idA);
        if (!a) return t;
        return { ...t, q: a.q, r: a.r };
      }
      return t;
    });
    set({ tiles });
  },

  shuffleTiles: () => {
    const state = get();
    set({ undoBuffer: snapshot(state) });
    const before = state.tiles.map((t) => ({ ...t }));
    const positions: Hex[] = state.tiles.map((t) => ({ q: t.q, r: t.r }));

    // Fisher-Yates shuffle of positions
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }
    const after = state.tiles.map((t, i) => ({ ...t, q: positions[i].q, r: positions[i].r }));
    set({ tiles: after });
    return { before, after };
  },

  undoLast: () => {
    const state = get();
    if (!state.undoBuffer) return null;
    const restored = state.undoBuffer.tiles.find(
      (t) => !state.tiles.some((cur) => cur.id === t.id)
    );
    set({
      tiles: state.undoBuffer.tiles,
      moves: state.undoBuffer.moves,
      status: state.undoBuffer.status,
      comboCount: state.undoBuffer.comboCount,
      lastClearTime: state.undoBuffer.lastClearTime,
      clearedKeys: state.undoBuffer.clearedKeys,
      mutationRuntime: state.undoBuffer.mutationRuntime,
      undoBuffer: null,
      animatingId: null,
    });
    return restored ?? null;
  },
}));

// Recolor live tiles when the player swaps themes mid-session.
useThemeStore.subscribe((s, prev) => {
  if (s.themeId !== prev.themeId) {
    useGameStore.getState().retintTiles();
  }
});

/* ------------------------- Helpers for power-ups ------------------------- */

/**
 * Trace the would-be exit path for a tile, including the off-board overshoot.
 * Used by Line Blast to sweep its beam in the tile's arrow direction.
 */
export function tileLinePath(
  tile: Tile,
  gridRadius: number
): { path: Hex[]; clearedAlong: string[] } {
  const vec = DIRECTION_VECTORS[tile.direction];
  const path: Hex[] = [];
  const clearedAlong: string[] = [tile.id];
  const tiles = useGameStore.getState().tiles;
  const occ = buildOccupancy(tiles);

  let cursor: Hex = { q: tile.q, r: tile.r };
  for (let i = 0; i < gridRadius * 4 + 4; i++) {
    cursor = { q: cursor.q + vec.q, r: cursor.r + vec.r };
    path.push({ ...cursor });
    if (!isInsideRadius(cursor, gridRadius)) break;
    const hit = occ.get(hexKey(cursor.q, cursor.r));
    if (hit && hit.id !== tile.id) clearedAlong.push(hit.id);
  }
  return { path, clearedAlong };
}

/** Six neighbors of a hex — bomb radius. */
export function neighborsOf(tile: Tile): Hex[] {
  return Object.values(DIRECTION_VECTORS).map((v) => ({ q: tile.q + v.q, r: tile.r + v.r }));
}

export function tilesInBombRadius(tile: Tile): Tile[] {
  const ns = neighborsOf(tile);
  const tiles = useGameStore.getState().tiles;
  return tiles.filter(
    (t) => t.id !== tile.id && ns.some((n) => n.q === t.q && n.r === t.r)
  );
}
