import type { Direction, MutationSpec, Tile } from "@/types";
import { DIRECTION_VECTORS } from "@/game/grid/directions";
import { hexKey, isInsideRadius } from "@/game/grid/hex";

/** Per-session mutation state that lives alongside the tile list in the store. */
export interface MutationRuntime {
  /** Effective playable radius (decreases as shrink ticks fire). */
  currentRadius: number;
  /** Outer-ring hexes telegraphed as the next to be culled. Empty unless a shrink is imminent. */
  hazardousHexes: Set<string>;
  /** Clears remaining until each shift mutation fires, indexed parallel to `shiftSpecs`. */
  nextShiftIn: number[];
  /** Clears remaining until the shrink mutation fires. Infinity if none. */
  nextShrinkIn: number;
  /** The shift mutations for this level, in declaration order. */
  shiftSpecs: ShiftSpec[];
  /** The shrink mutation, if any. */
  shrinkSpec: ShrinkSpec | null;
}

type ShiftSpec = Extract<MutationSpec, { kind: "shift" }>;
type ShrinkSpec = Extract<MutationSpec, { kind: "shrink" }>;

/** Sentinel locked key used for cracked tiles. No key tile ever clears this, so they
 *  remain permanently immovable. */
export const CRACKED_LOCK = "__cracked__";

export function initMutationRuntime(level: {
  gridRadius: number;
  mutations?: MutationSpec[];
}): MutationRuntime {
  const mutations = level.mutations ?? [];
  const shiftSpecs = mutations.filter((m): m is ShiftSpec => m.kind === "shift");
  const shrinkSpec =
    mutations.find((m): m is ShrinkSpec => m.kind === "shrink") ?? null;
  return {
    currentRadius: level.gridRadius,
    hazardousHexes:
      shrinkSpec && shrinkSpec.period === 1
        ? computeRingHexes(level.gridRadius)
        : new Set(),
    nextShiftIn: shiftSpecs.map((s) => s.period),
    nextShrinkIn: shrinkSpec ? shrinkSpec.period : Infinity,
    shiftSpecs,
    shrinkSpec,
  };
}

/** Set of hex keys on the ring at exactly `radius` distance from center. */
export function computeRingHexes(radius: number): Set<string> {
  const out = new Set<string>();
  for (let q = -radius; q <= radius; q++) {
    const rMin = Math.max(-radius, -q - radius);
    const rMax = Math.min(radius, -q + radius);
    for (let r = rMin; r <= rMax; r++) {
      const s = -q - r;
      if (Math.max(Math.abs(q), Math.abs(r), Math.abs(s)) === radius) {
        out.add(hexKey(q, r));
      }
    }
  }
  return out;
}

/** Sort key: tiles with higher rank are "further along" the shift direction and
 *  should be processed first so they vacate room for tiles behind them. */
const SHIFT_RANK_FNS: Record<Direction, (q: number, r: number) => number> = {
  RIGHT: (q, r) => 2 * q + r,
  LEFT: (q, r) => -(2 * q + r),
  TOP_LEFT: (q, r) => -(q + 2 * r),
  TOP_RIGHT: (q, r) => q - r,
  BOTTOM_LEFT: (q, r) => -(q - r),
  BOTTOM_RIGHT: (q, r) => q + 2 * r,
};

export interface TickResult {
  tiles: Tile[];
  runtime: MutationRuntime;
  /** Tiles removed by mutations this tick. Caller may animate or just drop them. */
  removedIds: string[];
}

/** Apply one mutation tick. Call after each successful tile clear. */
export function applyMutationTick(
  tiles: Tile[],
  runtime: MutationRuntime
): TickResult {
  let working = tiles;
  const removedIds: string[] = [];

  // 1) Crack tick — uniform decrement on all crack-counting tiles.
  working = working.map((t) => {
    if (t.cracked || t.crackAfter === undefined || t.crackAfter <= 0) return t;
    const next = t.crackAfter - 1;
    if (next <= 0) {
      return { ...t, crackAfter: 0, cracked: true, locked: CRACKED_LOCK };
    }
    return { ...t, crackAfter: next };
  });

  // 2) Shift ticks
  const nextShiftIn = [...runtime.nextShiftIn];
  for (let i = 0; i < runtime.shiftSpecs.length; i++) {
    nextShiftIn[i] -= 1;
    if (nextShiftIn[i] <= 0) {
      const result = applyShift(
        working,
        runtime.shiftSpecs[i].direction,
        runtime.currentRadius
      );
      working = result.tiles;
      removedIds.push(...result.removedIds);
      nextShiftIn[i] = runtime.shiftSpecs[i].period;
    }
  }

  // 3) Shrink tick
  let { currentRadius, nextShrinkIn } = runtime;
  if (runtime.shrinkSpec) {
    nextShrinkIn -= 1;
    if (nextShrinkIn <= 0) {
      const minR = runtime.shrinkSpec.minRadius ?? 1;
      const newRadius = Math.max(minR, currentRadius - 1);
      if (newRadius < currentRadius) {
        // Crack outer-ring tiles instead of removing them — they become permanent blockers.
        working = working.map((t) => {
          if (!t.cracked && !isInsideRadius({ q: t.q, r: t.r }, newRadius)) {
            return { ...t, cracked: true, locked: CRACKED_LOCK };
          }
          return t;
        });
        currentRadius = newRadius;
      }
      nextShrinkIn = runtime.shrinkSpec.period;
    }
  }

  // Telegraph: highlight the current outer ring when shrink is one tick away.
  const hazardousHexes =
    runtime.shrinkSpec &&
    nextShrinkIn === 1 &&
    currentRadius > (runtime.shrinkSpec.minRadius ?? 1)
      ? computeRingHexes(currentRadius)
      : new Set<string>();

  return {
    tiles: working,
    runtime: {
      ...runtime,
      currentRadius,
      nextShiftIn,
      nextShrinkIn,
      hazardousHexes,
    },
    removedIds,
  };
}

/**
 * Shift every tile one hex along `direction`. Tiles whose target is off-board
 * get cracked in place (permanent blockers). Tiles whose target is occupied by
 * another tile that won't move stay put.
 *
 * We process tiles "furthest along" the shift direction first so they make
 * room for tiles behind them — that converts a snake of three tiles into a
 * clean slide rather than a pile-up.
 */
export function applyShift(
  tiles: Tile[],
  direction: Direction,
  currentRadius: number
): { tiles: Tile[]; removedIds: string[] } {
  const vec = DIRECTION_VECTORS[direction];
  const rankFn = SHIFT_RANK_FNS[direction];
  const order = [...tiles].sort((a, b) => rankFn(b.q, b.r) - rankFn(a.q, a.r));

  const occ = new Map<string, Tile>();
  for (const t of tiles) occ.set(hexKey(t.q, t.r), t);

  const removedIds: string[] = [];
  const decided = new Map<string, Tile | null>();

  for (const t of order) {
    // Already cracked — keep in place, stay in occ as a blocker.
    if (t.cracked) {
      decided.set(t.id, t);
      continue;
    }
    const next = { q: t.q + vec.q, r: t.r + vec.r };
    if (!isInsideRadius(next, currentRadius)) {
      // Tile hits the boundary — freeze it in place as a permanent cracked blocker.
      const frozen = { ...t, cracked: true, locked: CRACKED_LOCK };
      decided.set(t.id, frozen);
      occ.set(hexKey(t.q, t.r), frozen);
      continue;
    }
    const blockerKey = hexKey(next.q, next.r);
    const blocker = occ.get(blockerKey);
    if (blocker && blocker.id !== t.id) {
      decided.set(t.id, t);
      continue;
    }
    occ.delete(hexKey(t.q, t.r));
    const moved = { ...t, q: next.q, r: next.r };
    occ.set(blockerKey, moved);
    decided.set(t.id, moved);
  }

  const result: Tile[] = [];
  for (const t of tiles) {
    const d = decided.get(t.id);
    if (d === null) continue;
    result.push(d ?? t);
  }
  return { tiles: result, removedIds };
}
