#!/usr/bin/env node
// Verifier for mutation-enabled levels (31-50).
// Performs DFS over (tile state, mutation runtime) to find a winning sequence,
// then reports min-move solution length so we can tune par.

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
  const vec = DIRECTION_VECTORS[tile.direction];
  let cq = tile.q, cr = tile.r;
  const max = radius * 4 + 4;
  for (let i = 0; i < max; i++) {
    cq += vec.q; cr += vec.r;
    if (!isInsideRadius(cq, cr, radius)) return { kind: "exits" };
    const blocker = occ.get(hexKey(cq, cr));
    if (blocker && blocker.id !== tile.id) return { kind: "blocked" };
  }
  return { kind: "exits" };
}

function applyShift(tiles, direction, currentRadius) {
  const vec = DIRECTION_VECTORS[direction];
  const rankFn = SHIFT_RANK_FNS[direction];
  const order = [...tiles].sort((a, b) => rankFn(b.q, b.r) - rankFn(a.q, a.r));
  const occ = buildOcc(tiles);
  const decided = new Map();
  const removed = [];
  for (const t of order) {
    const nq = t.q + vec.q, nr = t.r + vec.r;
    if (!isInsideRadius(nq, nr, currentRadius)) {
      removed.push(t.id);
      decided.set(t.id, null);
      occ.delete(hexKey(t.q, t.r));
      continue;
    }
    const k = hexKey(nq, nr);
    const blocker = occ.get(k);
    if (blocker && blocker.id !== t.id) {
      decided.set(t.id, t);
      continue;
    }
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
  let currentRadius = runtime.currentRadius;
  let nextShrinkIn = runtime.nextShrinkIn;
  if (runtime.shrinkSpec) {
    nextShrinkIn -= 1;
    if (nextShrinkIn <= 0) {
      const minR = runtime.shrinkSpec.minRadius ?? 1;
      const nr = Math.max(minR, currentRadius - 1);
      if (nr < currentRadius) {
        for (const t of working) {
          if (!isInsideRadius(t.q, t.r, nr)) removed.push(t.id);
        }
        working = working.filter((t) => isInsideRadius(t.q, t.r, nr));
        currentRadius = nr;
      }
      nextShrinkIn = runtime.shrinkSpec.period;
    }
  }
  return {
    tiles: working,
    runtime: { ...runtime, currentRadius, nextShiftIn, nextShrinkIn },
    removed,
  };
}

function initRuntime(level) {
  const mutations = level.mutations || [];
  const shiftSpecs = mutations.filter((m) => m.kind === "shift");
  const shrinkSpec = mutations.find((m) => m.kind === "shrink") || null;
  return {
    currentRadius: level.gridRadius,
    nextShiftIn: shiftSpecs.map((s) => s.period),
    nextShrinkIn: shrinkSpec ? shrinkSpec.period : Infinity,
    shiftSpecs,
    shrinkSpec,
  };
}

function movableTileIds(tiles, runtime, clearedKeys) {
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
    .sort()
    .join("|");
  return `${t}#R${runtime.currentRadius}#SI${runtime.nextShiftIn.join(",")}#SR${runtime.nextShrinkIn}#K${[...clearedKeys].sort().join(",")}`;
}

function solve(level, opts = {}) {
  const maxMoves = opts.maxMoves || 60;
  const tiles0 = level.tiles.map((t, i) => ({
    id: `t${i}`,
    q: t.q, r: t.r,
    direction: t.direction,
    locked: t.locked,
    key: t.key,
    crackAfter: t.crackAfter,
  }));
  const rt0 = initRuntime(level);
  const seen = new Map(); // key -> minMoves
  let best = null; // { moves, sequence }

  function dfs(tiles, runtime, clearedKeys, moves, seq) {
    if (best && moves >= best.moves) return;
    if (tiles.length === 0) {
      if (!best || moves < best.moves) best = { moves, sequence: seq.slice() };
      return;
    }
    if (moves >= maxMoves) return;

    const k = stateKey(tiles, runtime, clearedKeys);
    const prev = seen.get(k);
    if (prev !== undefined && prev <= moves) return;
    seen.set(k, moves);

    const movable = movableTileIds(tiles, runtime, clearedKeys);
    if (movable.length === 0) return;

    for (const id of movable) {
      const tile = tiles.find((t) => t.id === id);
      const after = tiles.filter((t) => t.id !== id);
      const newKeys = tile.key ? new Set([...clearedKeys, tile.key]) : clearedKeys;
      const ticked = applyMutationTick(after, runtime);
      seq.push(id);
      dfs(ticked.tiles, ticked.runtime, newKeys, moves + 1, seq);
      seq.pop();
    }
  }

  dfs(tiles0, rt0, new Set(), 0, []);
  return best;
}

function verifyLevel(level) {
  const errors = [];

  // Structural checks
  for (const t of level.tiles) {
    if (!isInsideRadius(t.q, t.r, level.gridRadius)) {
      errors.push(`Tile at (${t.q},${t.r}) outside gridRadius ${level.gridRadius}`);
    }
  }
  const positions = new Set();
  for (const t of level.tiles) {
    const k = hexKey(t.q, t.r);
    if (positions.has(k)) errors.push(`Duplicate tile at ${k}`);
    positions.add(k);
  }
  const keys = new Set();
  for (const t of level.tiles) if (t.key) keys.add(t.key);
  for (const t of level.tiles) {
    if (t.locked && !keys.has(t.locked)) {
      errors.push(`Tile at (${t.q},${t.r}) locked by "${t.locked}" but no key tile has it`);
    }
  }

  if (errors.length) return { errors };

  const sol = solve(level, { maxMoves: level.tiles.length + 8 });
  return { errors, solution: sol };
}

// Run
const levelsDir = path.join(__dirname, "..", "src", "game", "levels");
const idsArg = process.argv.slice(2);
const ids = idsArg.length
  ? idsArg.map((x) => parseInt(x, 10)).filter((x) => !Number.isNaN(x))
  : Array.from({ length: 20 }, (_, i) => 31 + i);

let allOk = true;
for (const id of ids) {
  const f = path.join(levelsDir, `level${id}.json`);
  if (!fs.existsSync(f)) {
    console.log(`Level ${id}: FILE NOT FOUND`);
    allOk = false;
    continue;
  }
  const data = JSON.parse(fs.readFileSync(f, "utf8").replace(/^﻿/, ""));
  const res = verifyLevel(data);
  if (res.errors && res.errors.length) {
    console.log(`Level ${id} "${data.name}": FAIL`);
    for (const e of res.errors) console.log(`  ERROR: ${e}`);
    allOk = false;
    continue;
  }
  if (!res.solution) {
    console.log(`Level ${id} "${data.name}": NOT SOLVABLE within ${data.tiles.length + 8} moves`);
    allOk = false;
    continue;
  }
  const par = data.par || data.tiles.length;
  const mut = (data.mutations || []).map((m) => m.kind).sort().join("+") || "none";
  const flag = res.solution.moves <= par ? "OK" : "PAR-LOW";
  console.log(
    `Level ${id} "${data.name}" [${data.difficulty || "?"}]: ${flag} tiles=${data.tiles.length} par=${par} minMoves=${res.solution.moves} mut=${mut}`
  );
  if (res.solution.moves > par) allOk = false;
}

console.log(allOk ? "\nAll levels OK!" : "\nSome levels need attention.");
