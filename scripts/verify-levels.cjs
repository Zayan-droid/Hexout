#!/usr/bin/env node
// Verification script for levels 16-30
// Checks: all tiles on board, no duplicates, DAG is acyclic (solvable)

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

function isInsideRadius(q, r, radius) {
  return Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r)) <= radius;
}

function hexKey(q, r) { return `${q},${r}`; }

function resolveRay(tile, occupancyMap, radius) {
  const vec = DIRECTION_VECTORS[tile.direction];
  let cq = tile.q, cr = tile.r;
  const maxSteps = radius * 4 + 4;
  for (let i = 0; i < maxSteps; i++) {
    cq += vec.q; cr += vec.r;
    if (!isInsideRadius(cq, cr, radius)) return { kind: "exits" };
    const key = hexKey(cq, cr);
    if (occupancyMap.has(key)) {
      return { kind: "blocked", blockerKey: key };
    }
  }
  return { kind: "exits" };
}

function verifyLevel(levelData) {
  const { id, tiles, gridRadius } = levelData;
  const errors = [];

  // 1. All tiles on board
  for (const t of tiles) {
    if (!isInsideRadius(t.q, t.r, gridRadius)) {
      errors.push(`Tile at (${t.q},${t.r}) is outside gridRadius ${gridRadius}`);
    }
  }

  // 2. No duplicates
  const positions = new Set();
  for (const t of tiles) {
    const k = hexKey(t.q, t.r);
    if (positions.has(k)) errors.push(`Duplicate tile at ${k}`);
    positions.add(k);
  }

  // 3. Key references valid tiles
  const keyTiles = new Map(); // key value -> tile
  for (const t of tiles) {
    if (t.key) keyTiles.set(t.key, t);
  }
  for (const t of tiles) {
    if (t.locked && !keyTiles.has(t.locked)) {
      errors.push(`Tile at (${t.q},${t.r}) locked by "${t.locked}" but no tile has that key`);
    }
  }

  if (errors.length > 0) return { solvable: false, errors };

  // 4. Build dependency graph
  // tileId -> index
  const tileIdx = new Map();
  for (let i = 0; i < tiles.length; i++) {
    tileIdx.set(hexKey(tiles[i].q, tiles[i].r), i);
  }

  // For each tile, find its spatial blocker (if any)
  const occupancyMap = new Map();
  for (let i = 0; i < tiles.length; i++) {
    occupancyMap.set(hexKey(tiles[i].q, tiles[i].r), i);
  }

  // edges[i] = set of tile indices that tile i depends on (must be cleared first)
  const deps = Array.from({ length: tiles.length }, () => new Set());

  for (let i = 0; i < tiles.length; i++) {
    // Spatial dependency
    const result = resolveRay(tiles[i], occupancyMap, gridRadius);
    if (result.kind === "blocked") {
      const blockerIdx = occupancyMap.get(result.blockerKey);
      if (blockerIdx !== undefined && blockerIdx !== i) {
        deps[i].add(blockerIdx);
      }
    }
    // Lock dependency
    if (tiles[i].locked) {
      const keyTile = keyTiles.get(tiles[i].locked);
      if (keyTile) {
        const keyIdx = tileIdx.get(hexKey(keyTile.q, keyTile.r));
        if (keyIdx !== undefined) deps[i].add(keyIdx);
      }
    }
  }

  // 5. Kahn's topological sort
  const inDegree = new Array(tiles.length).fill(0);
  // Build reverse: dependents[j] = tiles that depend on j
  const dependents = Array.from({ length: tiles.length }, () => []);
  for (let i = 0; i < tiles.length; i++) {
    for (const j of deps[i]) {
      inDegree[i]++;
      dependents[j].push(i);
    }
  }

  const queue = [];
  for (let i = 0; i < tiles.length; i++) {
    if (inDegree[i] === 0) queue.push(i);
  }

  const order = [];
  while (queue.length > 0) {
    const idx = queue.shift();
    order.push(idx);
    for (const dep of dependents[idx]) {
      inDegree[dep]--;
      if (inDegree[dep] === 0) queue.push(dep);
    }
  }

  const freeStarts = tiles.filter((_, i) => {
    const spatialFree = (() => {
      const result = resolveRay(tiles[i], occupancyMap, gridRadius);
      return result.kind === "exits";
    })();
    const lockFree = !tiles[i].locked;
    return spatialFree && lockFree;
  }).length;

  // Compute chain depth (longest path in DAG)
  let maxDepth = 0;
  if (order.length === tiles.length) {
    const depth = new Array(tiles.length).fill(0);
    for (const idx of order) {
      for (const dep of dependents[idx]) {
        depth[dep] = Math.max(depth[dep], depth[idx] + 1);
      }
      maxDepth = Math.max(maxDepth, depth[idx]);
    }
  }

  if (order.length < tiles.length) {
    // Find cycle members
    const cycleNodes = [];
    for (let i = 0; i < tiles.length; i++) {
      if (inDegree[i] > 0) cycleNodes.push(`(${tiles[i].q},${tiles[i].r})`);
    }
    errors.push(`CYCLE DETECTED in dependency graph! Nodes in cycle: ${cycleNodes.join(", ")}`);
    return { solvable: false, errors, freeStarts, chainDepth: maxDepth };
  }

  return { solvable: true, errors, freeStarts, chainDepth: maxDepth, topoOrder: order };
}

// Run verification on levels 16-30
const levelsDir = path.join(__dirname, "..", "src", "game", "levels");
let allOk = true;

for (let id = 16; id <= 30; id++) {
  const filePath = path.join(levelsDir, `level${id}.json`);
  if (!fs.existsSync(filePath)) {
    console.log(`Level ${id}: FILE NOT FOUND`);
    allOk = false;
    continue;
  }
  const data = JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^﻿/, ""));
  const result = verifyLevel(data);
  if (result.solvable) {
    console.log(`Level ${id} "${data.name}" [${data.difficulty}]: OK - ${data.tiles.length} tiles, par=${data.par}, freeStarts=${result.freeStarts}, chainDepth=${result.chainDepth}`);
  } else {
    console.log(`Level ${id} "${data.name}" [${data.difficulty}]: FAIL`);
    for (const e of result.errors) console.log(`  ERROR: ${e}`);
    allOk = false;
  }
}

console.log(allOk ? "\nAll levels OK!" : "\nSome levels have issues!");
