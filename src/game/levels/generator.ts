import type { Direction, Difficulty, LevelData } from "@/types";
import { ALL_DIRECTIONS, DIRECTION_VECTORS } from "@/game/grid/directions";
import { createHexagonBoardCells, hexAdd, hexKey, isInsideRadius } from "@/game/grid/hex";

// ── Seeded PRNG (mulberry32) ──────────────────────────────────────────────────
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randChoice<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

// ── Solvability: topological sort on blocking dependency graph ─────────────────
// Tile A "blocks" tile B if A sits somewhere along B's exit ray.
// Level is solvable iff dependency DAG has no cycles.

interface TileSpec {
  q: number;
  r: number;
  direction: Direction;
}

function getExitRayCells(t: TileSpec, radius: number): Array<{ q: number; r: number }> {
  const vec = DIRECTION_VECTORS[t.direction];
  const cells: Array<{ q: number; r: number }> = [];
  let cur = { q: t.q, r: t.r };
  const maxSteps = radius * 4 + 4;
  for (let i = 0; i < maxSteps; i++) {
    cur = hexAdd(cur, vec);
    if (!isInsideRadius(cur, radius)) break;
    cells.push({ ...cur });
  }
  return cells;
}

function isSolvable(tiles: TileSpec[], radius: number): boolean {
  const n = tiles.length;
  if (n === 0) return true;

  // inDegree[i] = number of tiles that must be cleared before tile i can move
  const inDegree = new Array(n).fill(0);
  // adj[i] = tiles that become unblocked when tile i is cleared
  const adj: number[][] = Array.from({ length: n }, () => []);

  for (let i = 0; i < n; i++) {
    const ray = getExitRayCells(tiles[i], radius);
    const rayCellSet = new Set(ray.map((c) => hexKey(c.q, c.r)));
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      // Does tile j sit in tile i's exit ray? → j blocks i → i depends on j
      if (rayCellSet.has(hexKey(tiles[j].q, tiles[j].r))) {
        adj[j].push(i); // clearing j unblocks i
        inDegree[i]++;
      }
    }
  }

  // Kahn's algorithm
  const queue: number[] = [];
  for (let i = 0; i < n; i++) if (inDegree[i] === 0) queue.push(i);
  let cleared = 0;
  while (queue.length > 0) {
    const u = queue.shift()!;
    cleared++;
    for (const v of adj[u]) {
      inDegree[v]--;
      if (inDegree[v] === 0) queue.push(v);
    }
  }
  return cleared === n;
}

// ── Difficulty params ─────────────────────────────────────────────────────────
interface DifficultyParams {
  radius: number;
  minTiles: number;
  maxTiles: number;
}

const DIFF_PARAMS: Record<Difficulty, DifficultyParams> = {
  beginner: { radius: 2, minTiles: 3, maxTiles: 5 },
  easy: { radius: 2, minTiles: 5, maxTiles: 8 },
  medium: { radius: 3, minTiles: 7, maxTiles: 12 },
  hard: { radius: 3, minTiles: 10, maxTiles: 16 },
  expert: { radius: 4, minTiles: 14, maxTiles: 22 },
};

// ── Generator ─────────────────────────────────────────────────────────────────
export function generateLevel(
  id: number,
  seed: number,
  difficulty: Difficulty
): LevelData {
  const rng = mulberry32(seed);
  const { radius, minTiles, maxTiles } = DIFF_PARAMS[difficulty];
  const targetTiles = minTiles + Math.floor(rng() * (maxTiles - minTiles + 1));
  const allCells = createHexagonBoardCells(radius);

  const placed: TileSpec[] = [];
  const usedKeys = new Set<string>();
  let attempts = 0;
  const maxAttempts = 2000;

  while (placed.length < targetTiles && attempts < maxAttempts) {
    attempts++;
    const cell = randChoice(rng, allCells);
    const key = hexKey(cell.q, cell.r);
    if (usedKeys.has(key)) continue;

    const direction = randChoice(rng, ALL_DIRECTIONS);
    const candidate: TileSpec = { q: cell.q, r: cell.r, direction };

    // Quick pre-check: candidate must not be a dead-end (must have at least one step in ray)
    const ray = getExitRayCells(candidate, radius);
    if (ray.length === 0) continue;

    const next = [...placed, candidate];
    if (isSolvable(next, radius)) {
      placed.push(candidate);
      usedKeys.add(key);
    }
  }

  if (placed.length < minTiles) {
    // Fallback: pure free-exit tiles (all pointing to nearest edge)
    placed.length = 0;
    usedKeys.clear();
    const rng2 = mulberry32(seed + 999);
    for (const cell of allCells) {
      if (placed.length >= minTiles) break;
      // Pick the direction that exits in exactly 1 step
      const freeDir = ALL_DIRECTIONS.find((d) => {
        const vec = DIRECTION_VECTORS[d];
        const next = hexAdd(cell, vec);
        return !isInsideRadius(next, radius);
      });
      if (freeDir) {
        placed.push({ q: cell.q, r: cell.r, direction: freeDir });
        rng2(); // consume rng to vary
      }
    }
  }

  return {
    id,
    name: `Level ${id}`,
    difficulty,
    par: placed.length,
    gridRadius: radius,
    tiles: placed,
  };
}

// ── Pre-generate levels 16–50 ─────────────────────────────────────────────────
const GENERATED_SPEC: Array<{ difficulty: Difficulty; count: number }> = [
  { difficulty: "beginner", count: 5 },
  { difficulty: "easy", count: 8 },
  { difficulty: "medium", count: 9 },
  { difficulty: "hard", count: 8 },
  { difficulty: "expert", count: 5 },
];

export function buildGeneratedLevels(startId = 16): LevelData[] {
  const levels: LevelData[] = [];
  let id = startId;
  let seed = 0xdeadbeef;
  for (const { difficulty, count } of GENERATED_SPEC) {
    for (let i = 0; i < count; i++) {
      levels.push(generateLevel(id, seed, difficulty));
      id++;
      seed = (seed * 1664525 + 1013904223) >>> 0;
    }
  }
  return levels;
}
