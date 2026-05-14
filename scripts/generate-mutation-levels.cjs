#!/usr/bin/env node
// Generates levels 31-50: dense base layouts (>= 22 tiles) with mutations on top.
// Tile-count progression: 22, 22, 23, 24, 24, 25, 26, 26, 27, 28, 28, 29, 30, 30, 31, 32, 32, 33, 34, 36
// Mutation progression (monotonic):
//   31-33: crack only
//   34-36: crack + shrink
//   37-50: crack + shrink + shift

const fs = require("fs");
const path = require("path");

const DIRECTION_VECTORS = {
  LEFT: { q: -1, r: 0 },
  RIGHT: { q: 1, r: 0 },
  TOP_LEFT: { q: 0, r: -1 },
  TOP_RIGHT: { q: 1, r: -1 },
  BOTTOM_LEFT: { q: -1, r: 1 },
  BOTTOM_RIGHT: { q: 0, r: 1 },
};
const ALL_DIRECTIONS = Object.keys(DIRECTION_VECTORS);
const SHIFT_RANK_FNS = {
  RIGHT: (q, r) => 2 * q + r,
  LEFT: (q, r) => -(2 * q + r),
  TOP_LEFT: (q, r) => -(q + 2 * r),
  TOP_RIGHT: (q, r) => q - r,
  BOTTOM_LEFT: (q, r) => -(q - r),
  BOTTOM_RIGHT: (q, r) => q + 2 * r,
};
const CRACKED_LOCK = "__cracked__";

function hexKey(q, r) { return `${q},${r}`; }
function isInsideRadius(q, r, radius) {
  return Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r)) <= radius;
}
function createBoardCells(radius) {
  const out = [];
  for (let q = -radius; q <= radius; q++) {
    const rMin = Math.max(-radius, -q - radius);
    const rMax = Math.min(radius, -q + radius);
    for (let r = rMin; r <= rMax; r++) out.push({ q, r });
  }
  return out;
}
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function randChoice(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }

// ── Base solvability check (no mutations) — topo sort on blocking DAG ──────
function getExitRayCells(tile, radius) {
  const v = DIRECTION_VECTORS[tile.direction];
  const cells = [];
  let q = tile.q, r = tile.r;
  for (let i = 0; i < radius * 4 + 4; i++) {
    q += v.q; r += v.r;
    if (!isInsideRadius(q, r, radius)) break;
    cells.push({ q, r });
  }
  return cells;
}
function isSolvableBase(tiles, radius) {
  const n = tiles.length;
  if (n === 0) return true;
  const inDeg = new Array(n).fill(0);
  const adj = Array.from({ length: n }, () => []);
  for (let i = 0; i < n; i++) {
    const ray = getExitRayCells(tiles[i], radius);
    const cells = new Set(ray.map((c) => hexKey(c.q, c.r)));
    // Honor lock dependency for base solvability too.
    if (tiles[i].locked) {
      const keyIdx = tiles.findIndex((t) => t.key === tiles[i].locked);
      if (keyIdx >= 0 && keyIdx !== i) {
        adj[keyIdx].push(i);
        inDeg[i]++;
      }
    }
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      if (cells.has(hexKey(tiles[j].q, tiles[j].r))) {
        adj[j].push(i);
        inDeg[i]++;
      }
    }
  }
  const queue = [];
  for (let i = 0; i < n; i++) if (inDeg[i] === 0) queue.push(i);
  let n2 = 0;
  while (queue.length) {
    const u = queue.shift();
    n2++;
    for (const v of adj[u]) {
      inDeg[v]--;
      if (inDeg[v] === 0) queue.push(v);
    }
  }
  return n2 === n;
}

// ── Base generator (biased toward long rays for denser dependency chains) ──
function pickBiasedDir(rng, candidates, bias) {
  const exp = 1 + bias * 3;
  let total = 0;
  const ws = [];
  for (const c of candidates) {
    const w = Math.pow(c.len, exp);
    ws.push(w); total += w;
  }
  let p = rng() * total;
  for (let i = 0; i < candidates.length; i++) {
    p -= ws[i];
    if (p <= 0) return candidates[i].dir;
  }
  return candidates[candidates.length - 1].dir;
}
function generateBase(seed, radius, targetTiles, bias) {
  const rng = mulberry32(seed);
  const cells = createBoardCells(radius);
  const placed = [];
  const used = new Set();
  let attempts = 0;
  const maxA = 18000;
  while (placed.length < targetTiles && attempts < maxA) {
    attempts++;
    const cell = randChoice(rng, cells);
    const k = hexKey(cell.q, cell.r);
    if (used.has(k)) continue;
    const dirCands = [];
    for (const d of ALL_DIRECTIONS) {
      const ray = getExitRayCells({ q: cell.q, r: cell.r, direction: d }, radius);
      if (ray.length > 0) dirCands.push({ dir: d, len: ray.length });
    }
    if (dirCands.length === 0) continue;
    const direction = pickBiasedDir(rng, dirCands, bias);
    const cand = { q: cell.q, r: cell.r, direction };
    if (isSolvableBase([...placed, cand], radius)) {
      placed.push(cand);
      used.add(k);
    }
  }
  return placed;
}

// ── Mutation tick (matches engine) ──────────────────────────────────────────
function computeRingHexes(radius) {
  const out = new Set();
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
function buildOcc(tiles) {
  const m = new Map();
  for (const t of tiles) m.set(hexKey(t.q, t.r), t);
  return m;
}
function resolveMove(tile, occ, radius) {
  const v = DIRECTION_VECTORS[tile.direction];
  let q = tile.q, r = tile.r;
  for (let i = 0; i < radius * 4 + 4; i++) {
    q += v.q; r += v.r;
    if (!isInsideRadius(q, r, radius)) return { kind: "exits" };
    const b = occ.get(hexKey(q, r));
    if (b && b.id !== tile.id) return { kind: "blocked" };
  }
  return { kind: "exits" };
}
function applyShift(tiles, direction, currentRadius) {
  const v = DIRECTION_VECTORS[direction];
  const rankFn = SHIFT_RANK_FNS[direction];
  const order = [...tiles].sort((a, b) => rankFn(b.q, b.r) - rankFn(a.q, a.r));
  const occ = buildOcc(tiles);
  const decided = new Map();
  const removed = [];
  for (const t of order) {
    const nq = t.q + v.q, nr = t.r + v.r;
    if (!isInsideRadius(nq, nr, currentRadius)) {
      removed.push(t.id);
      decided.set(t.id, null);
      occ.delete(hexKey(t.q, t.r));
      continue;
    }
    const k = hexKey(nq, nr);
    const b = occ.get(k);
    if (b && b.id !== t.id) { decided.set(t.id, t); continue; }
    occ.delete(hexKey(t.q, t.r));
    const moved = { ...t, q: nq, r: nr };
    occ.set(k, moved);
    decided.set(t.id, moved);
  }
  const out = [];
  for (const t of tiles) {
    const d = decided.get(t.id);
    if (d === null) continue;
    out.push(d || t);
  }
  return { tiles: out, removed };
}
function applyMutationTick(tiles, runtime) {
  let working = tiles.map((t) => {
    if (t.cracked || t.crackAfter === undefined || t.crackAfter <= 0) return t;
    const nx = t.crackAfter - 1;
    if (nx <= 0) return { ...t, crackAfter: 0, cracked: true, locked: CRACKED_LOCK };
    return { ...t, crackAfter: nx };
  });
  const removed = [];
  const nextShiftIn = [...runtime.nextShiftIn];
  for (let i = 0; i < runtime.shiftSpecs.length; i++) {
    nextShiftIn[i] -= 1;
    if (nextShiftIn[i] <= 0) {
      const r = applyShift(working, runtime.shiftSpecs[i].direction, runtime.currentRadius);
      working = r.tiles;
      removed.push(...r.removed);
      nextShiftIn[i] = runtime.shiftSpecs[i].period;
    }
  }
  let cr = runtime.currentRadius;
  let nsr = runtime.nextShrinkIn;
  if (runtime.shrinkSpec) {
    nsr -= 1;
    if (nsr <= 0) {
      const minR = runtime.shrinkSpec.minRadius ?? 1;
      const nr = Math.max(minR, cr - 1);
      if (nr < cr) {
        for (const t of working) {
          if (!isInsideRadius(t.q, t.r, nr)) removed.push(t.id);
        }
        working = working.filter((t) => isInsideRadius(t.q, t.r, nr));
        cr = nr;
      }
      nsr = runtime.shrinkSpec.period;
    }
  }
  return {
    tiles: working,
    runtime: { ...runtime, currentRadius: cr, nextShiftIn, nextShrinkIn: nsr },
    removed,
  };
}
function initRuntime(level) {
  const muts = level.mutations || [];
  const shiftSpecs = muts.filter((m) => m.kind === "shift");
  const shrinkSpec = muts.find((m) => m.kind === "shrink") || null;
  return {
    currentRadius: level.gridRadius,
    nextShiftIn: shiftSpecs.map((s) => s.period),
    nextShrinkIn: shrinkSpec ? shrinkSpec.period : Infinity,
    shiftSpecs,
    shrinkSpec,
  };
}
function movableIds(tiles, runtime, clearedKeys) {
  const occ = buildOcc(tiles);
  const ids = [];
  for (const t of tiles) {
    if (t.locked && !clearedKeys.has(t.locked)) continue;
    const r = resolveMove(t, occ, runtime.currentRadius);
    if (r.kind === "exits") ids.push(t.id);
  }
  return ids;
}
function stateKey(tiles, runtime, clearedKeys) {
  const t = tiles
    .map((x) => `${x.id}:${x.q},${x.r}:${x.crackAfter ?? "-"}:${x.cracked ? 1 : 0}`)
    .sort().join("|");
  return `${t}#R${runtime.currentRadius}#SI${runtime.nextShiftIn.join(",")}#SR${runtime.nextShrinkIn}#K${[...clearedKeys].sort().join(",")}`;
}

/** Returns true iff there's a winning sequence from the initial state. */
function isMutationSolvable(level, opts = {}) {
  const maxMoves = opts.maxMoves || level.tiles.length + 10;
  const timeBudgetMs = opts.timeBudgetMs || 10000;
  const tiles0 = level.tiles.map((t, i) => ({
    id: `t${i}`, q: t.q, r: t.r, direction: t.direction,
    locked: t.locked, key: t.key, crackAfter: t.crackAfter,
  }));
  const rt0 = initRuntime(level);
  const seen = new Map();
  const start = Date.now();
  let solved = false;
  function dfs(tiles, runtime, clearedKeys, moves) {
    if (solved) return;
    if (Date.now() - start > timeBudgetMs) return;
    if (tiles.length === 0) { solved = true; return; }
    if (moves >= maxMoves) return;
    const k = stateKey(tiles, runtime, clearedKeys);
    const prev = seen.get(k);
    if (prev !== undefined && prev <= moves) return;
    seen.set(k, moves);
    const mv = movableIds(tiles, runtime, clearedKeys);
    if (mv.length === 0) return;
    for (const id of mv) {
      if (solved) return;
      const tile = tiles.find((t) => t.id === id);
      const after = tiles.filter((t) => t.id !== id);
      const newKeys = tile.key ? new Set([...clearedKeys, tile.key]) : clearedKeys;
      const ticked = applyMutationTick(after, runtime);
      dfs(ticked.tiles, ticked.runtime, newKeys, moves + 1);
    }
  }
  dfs(tiles0, rt0, new Set(), 0);
  return { solved, exhausted: Date.now() - start > timeBudgetMs };
}

// ── Level builder ───────────────────────────────────────────────────────────
function buildLevel(spec) {
  const { id, name, difficulty, radius, targetTiles, bias, mutations, crackPlan, seed: seed0 } = spec;
  let seed = seed0;
  let lastBase = null;
  for (let attempt = 0; attempt < 60; attempt++) {
    const base = generateBase(seed, radius, targetTiles, bias);
    seed = (seed * 1664525 + 1013904223) >>> 0;
    if (base.length < targetTiles) { lastBase = base; continue; }

    // Apply crack timers. Choose tiles with the LONGEST exit rays (most likely
    // late in clear order) and give them generous timers ≈ base.length - small.
    const withRays = base.map((t, idx) => ({
      ...t, idx, rayLen: getExitRayCells(t, radius).length,
    }));
    withRays.sort((a, b) => b.rayLen - a.rayLen);
    const tiles = base.map((t) => ({ ...t }));
    for (const cp of crackPlan) {
      const target = withRays[cp.tileRank];
      if (target) tiles[target.idx].crackAfter = cp.timer;
    }
    const level = {
      id,
      name,
      gridRadius: radius,
      par: tiles.length,
      difficulty,
      tiles,
      mutations: mutations || undefined,
    };
    if (mutations === undefined || mutations === null) delete level.mutations;

    // Verify solvability under mutations.
    const ok = isMutationSolvable(level, { maxMoves: tiles.length + 8, timeBudgetMs: 8000 });
    if (ok.solved) return level;
    lastBase = base;
  }
  throw new Error(
    `Level ${id} "${name}" could not be made solvable after retries (last base size ${lastBase ? lastBase.length : 0}).`
  );
}

// ── Level specifications ────────────────────────────────────────────────────
// Tile count must be monotonically non-decreasing from 22 (level 30 baseline).
// Mutations stack: crack → +shrink → +shift.
const SPECS = [
  // crack only — radius 4, generous crack timers
  { id: 31, name: "Hourglass",        targetTiles: 22, radius: 4, bias: 0.35, crackPlan: [{tileRank:0,timer:14}],                                   mutations: null,                                                                                       seed: 0xA1A1A1A1 },
  { id: 32, name: "Brittle Twins",    targetTiles: 22, radius: 4, bias: 0.40, crackPlan: [{tileRank:0,timer:14},{tileRank:1,timer:12}],              mutations: null,                                                                                       seed: 0xA2B2C2D2 },
  { id: 33, name: "Crack the Key",    targetTiles: 23, radius: 4, bias: 0.45, crackPlan: [{tileRank:0,timer:16},{tileRank:1,timer:13},{tileRank:2,timer:10}], mutations: null,                                                                              seed: 0x77AABBCC },
  // + shrink (generous period so it fires once mid-game on radius 4 → 3)
  { id: 34, name: "Closing Doors",    targetTiles: 24, radius: 4, bias: 0.45, crackPlan: [{tileRank:0,timer:16},{tileRank:1,timer:13}],              mutations: [{kind:"shrink", period: 14, minRadius: 3}],                                                seed: 0x12345678 },
  { id: 35, name: "Tight Squeeze",    targetTiles: 24, radius: 4, bias: 0.50, crackPlan: [{tileRank:0,timer:16},{tileRank:1,timer:13},{tileRank:2,timer:11}], mutations: [{kind:"shrink", period: 12, minRadius: 3}],                                       seed: 0xDEAFBEEF },
  { id: 36, name: "Last Hex",         targetTiles: 25, radius: 4, bias: 0.55, crackPlan: [{tileRank:0,timer:17},{tileRank:1,timer:14},{tileRank:2,timer:11},{tileRank:3,timer:9}], mutations: [{kind:"shrink", period: 11, minRadius: 3}],                  seed: 0xCAFEBABE },
  // + shift (so crack + shrink + shift from 37 onward)
  { id: 37, name: "Drift West",       targetTiles: 26, radius: 4, bias: 0.50, crackPlan: [{tileRank:0,timer:18},{tileRank:1,timer:14}],              mutations: [{kind:"shrink", period: 14, minRadius: 3},{kind:"shift", direction:"LEFT", period: 6}],     seed: 0x0BADF00D },
  { id: 38, name: "Down the Cascade", targetTiles: 26, radius: 4, bias: 0.55, crackPlan: [{tileRank:0,timer:18},{tileRank:1,timer:14},{tileRank:2,timer:11}], mutations: [{kind:"shrink", period: 13, minRadius: 3},{kind:"shift", direction:"BOTTOM_LEFT", period: 6}], seed: 0x13371337 },
  { id: 39, name: "Diagonal Drift",   targetTiles: 27, radius: 4, bias: 0.55, crackPlan: [{tileRank:0,timer:18},{tileRank:1,timer:14},{tileRank:2,timer:11}], mutations: [{kind:"shrink", period: 12, minRadius: 3},{kind:"shift", direction:"TOP_RIGHT", period: 7}], seed: 0xACEBEEF1 },
  { id: 40, name: "Crumbling Walls",  targetTiles: 27, radius: 4, bias: 0.55, crackPlan: [{tileRank:0,timer:18},{tileRank:1,timer:14},{tileRank:2,timer:11},{tileRank:3,timer:9}], mutations: [{kind:"shrink", period: 11, minRadius: 3},{kind:"shift", direction:"LEFT", period: 6}], seed: 0xBADC0FFE },
  { id: 41, name: "Decay Spiral",     targetTiles: 28, radius: 4, bias: 0.60, crackPlan: [{tileRank:0,timer:19},{tileRank:1,timer:15},{tileRank:2,timer:12},{tileRank:3,timer:9}], mutations: [{kind:"shrink", period: 12, minRadius: 3},{kind:"shift", direction:"BOTTOM_RIGHT", period: 6}], seed: 0xFEEDFACE },
  { id: 42, name: "Erosion",          targetTiles: 28, radius: 4, bias: 0.60, crackPlan: [{tileRank:0,timer:19},{tileRank:1,timer:15},{tileRank:2,timer:12},{tileRank:3,timer:9}], mutations: [{kind:"shrink", period: 11, minRadius: 2},{kind:"shift", direction:"TOP_LEFT", period: 7}], seed: 0xD15EA5E0 },
  { id: 43, name: "Cracked Current",  targetTiles: 29, radius: 4, bias: 0.60, crackPlan: [{tileRank:0,timer:20},{tileRank:1,timer:16},{tileRank:2,timer:13},{tileRank:3,timer:10}], mutations: [{kind:"shrink", period: 12, minRadius: 2},{kind:"shift", direction:"LEFT", period: 6}], seed: 0xAAA00BBB },
  { id: 44, name: "Tidal Strain",     targetTiles: 29, radius: 4, bias: 0.65, crackPlan: [{tileRank:0,timer:20},{tileRank:1,timer:16},{tileRank:2,timer:13},{tileRank:3,timer:10}], mutations: [{kind:"shrink", period: 11, minRadius: 2},{kind:"shift", direction:"BOTTOM_RIGHT", period: 6}], seed: 0x5EED5EED },
  { id: 45, name: "Brittle Tide",     targetTiles: 30, radius: 4, bias: 0.65, crackPlan: [{tileRank:0,timer:20},{tileRank:1,timer:16},{tileRank:2,timer:13},{tileRank:3,timer:10},{tileRank:4,timer:8}], mutations: [{kind:"shrink", period: 11, minRadius: 2},{kind:"shift", direction:"TOP_RIGHT", period: 7}], seed: 0xBA5EBA11 },
  { id: 46, name: "Storm Drift",      targetTiles: 30, radius: 4, bias: 0.65, crackPlan: [{tileRank:0,timer:21},{tileRank:1,timer:17},{tileRank:2,timer:13},{tileRank:3,timer:10},{tileRank:4,timer:8}], mutations: [{kind:"shrink", period: 11, minRadius: 2},{kind:"shift", direction:"LEFT", period: 6}], seed: 0x11221122 },
  { id: 47, name: "Vortex",           targetTiles: 31, radius: 4, bias: 0.70, crackPlan: [{tileRank:0,timer:21},{tileRank:1,timer:17},{tileRank:2,timer:14},{tileRank:3,timer:11},{tileRank:4,timer:8}], mutations: [{kind:"shrink", period: 11, minRadius: 2},{kind:"shift", direction:"BOTTOM_LEFT", period: 6}], seed: 0x33445566 },
  { id: 48, name: "Funnel",           targetTiles: 32, radius: 4, bias: 0.70, crackPlan: [{tileRank:0,timer:22},{tileRank:1,timer:18},{tileRank:2,timer:14},{tileRank:3,timer:11},{tileRank:4,timer:8}], mutations: [{kind:"shrink", period: 11, minRadius: 2},{kind:"shift", direction:"TOP_LEFT", period: 7}], seed: 0x77889900 },
  { id: 49, name: "Hex Tempest",      targetTiles: 33, radius: 4, bias: 0.75, crackPlan: [{tileRank:0,timer:22},{tileRank:1,timer:18},{tileRank:2,timer:15},{tileRank:3,timer:12},{tileRank:4,timer:9},{tileRank:5,timer:7}], mutations: [{kind:"shrink", period: 11, minRadius: 2},{kind:"shift", direction:"BOTTOM_RIGHT", period: 6}], seed: 0xC0DECAFE },
  { id: 50, name: "Endgame Engine",   targetTiles: 34, radius: 4, bias: 0.80, crackPlan: [{tileRank:0,timer:23},{tileRank:1,timer:19},{tileRank:2,timer:15},{tileRank:3,timer:12},{tileRank:4,timer:9},{tileRank:5,timer:7}], mutations: [{kind:"shrink", period: 12, minRadius: 2},{kind:"shift", direction:"LEFT", period: 7}], seed: 0xDEAD10CC },
];

// Difficulty assignment: all expert (from level 30 onward).
for (const s of SPECS) s.difficulty = "expert";

const outDir = path.join(__dirname, "..", "src", "game", "levels");

const onlyArg = process.argv.slice(2).map((x) => parseInt(x, 10)).filter((x) => !isNaN(x));
const todo = onlyArg.length ? SPECS.filter((s) => onlyArg.includes(s.id)) : SPECS;

let successes = 0;
for (const spec of todo) {
  process.stdout.write(`Generating level ${spec.id} "${spec.name}" (target=${spec.targetTiles}, r=${spec.radius})... `);
  try {
    const level = buildLevel(spec);
    fs.writeFileSync(
      path.join(outDir, `level${spec.id}.json`),
      JSON.stringify(level, null, 2) + "\n"
    );
    const mut = (level.mutations || []).map((m) => m.kind).join("+") || "none";
    console.log(`OK tiles=${level.tiles.length} mut=${mut}`);
    successes++;
  } catch (e) {
    console.log(`FAIL: ${e.message}`);
  }
}
console.log(`\n${successes}/${todo.length} levels generated.`);
