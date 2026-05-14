#!/usr/bin/env node
// Procedurally generates levels 17-30 with key/lock pairs.
// Each level's combined dependency graph (spatial blocking + lock-key chains)
// is verified to be acyclic, guaranteeing at least one winning play order
// without power-ups.
//
// Run: node scripts/generate-locked-levels.cjs
//        --check   verify only, don't write
//        --write   verify + write (default)

const fs = require("fs");
const path = require("path");

const args = process.argv.slice(2);
const WRITE = !args.includes("--check");

const DIRECTION_VECTORS = {
  LEFT: { q: -1, r: 0 },
  RIGHT: { q: 1, r: 0 },
  TOP_LEFT: { q: 0, r: -1 },
  TOP_RIGHT: { q: 1, r: -1 },
  BOTTOM_LEFT: { q: -1, r: 1 },
  BOTTOM_RIGHT: { q: 0, r: 1 },
};
const ALL_DIRECTIONS = Object.keys(DIRECTION_VECTORS);

function isInsideRadius(q, r, radius) {
  return Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r)) <= radius;
}
function hexKey(q, r) {
  return `${q},${r}`;
}
function boardCells(radius) {
  const cells = [];
  for (let q = -radius; q <= radius; q++) {
    for (let r = -radius; r <= radius; r++) {
      if (isInsideRadius(q, r, radius)) cells.push({ q, r });
    }
  }
  return cells;
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
function shuffle(arr, rng) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function pick(arr, rng) {
  return arr[Math.floor(rng() * arr.length)];
}

function exitRay(tile, radius) {
  const v = DIRECTION_VECTORS[tile.direction];
  const cells = [];
  let cur = { q: tile.q, r: tile.r };
  for (let i = 0; i < radius * 4 + 4; i++) {
    cur = { q: cur.q + v.q, r: cur.r + v.r };
    if (!isInsideRadius(cur.q, cur.r, radius)) break;
    cells.push({ ...cur });
  }
  return cells;
}

// Spatial-only solvability — used while seeding.
function isSpatiallySolvable(tiles, radius) {
  const n = tiles.length;
  if (n === 0) return true;
  const idx = new Map();
  for (let i = 0; i < n; i++) idx.set(hexKey(tiles[i].q, tiles[i].r), i);
  const inDeg = new Array(n).fill(0);
  const adj = Array.from({ length: n }, () => []);
  for (let i = 0; i < n; i++) {
    const ray = exitRay(tiles[i], radius);
    for (const c of ray) {
      const j = idx.get(hexKey(c.q, c.r));
      if (j !== undefined && j !== i) {
        adj[j].push(i);
        inDeg[i]++;
      }
    }
  }
  const queue = [];
  for (let i = 0; i < n; i++) if (inDeg[i] === 0) queue.push(i);
  let cleared = 0;
  while (queue.length) {
    const u = queue.shift();
    cleared++;
    for (const v of adj[u]) {
      inDeg[v]--;
      if (inDeg[v] === 0) queue.push(v);
    }
  }
  return cleared === n;
}

// Build a topological order respecting spatial-block deps.
// Returns an array of tile indices in a valid clear order, or null if cyclic.
function topoOrder(tiles, radius) {
  const n = tiles.length;
  const idx = new Map();
  for (let i = 0; i < n; i++) idx.set(hexKey(tiles[i].q, tiles[i].r), i);
  const inDeg = new Array(n).fill(0);
  const adj = Array.from({ length: n }, () => []);
  for (let i = 0; i < n; i++) {
    const ray = exitRay(tiles[i], radius);
    for (const c of ray) {
      const j = idx.get(hexKey(c.q, c.r));
      if (j !== undefined && j !== i) {
        adj[j].push(i);
        inDeg[i]++;
      }
    }
  }
  const order = [];
  const queue = [];
  for (let i = 0; i < n; i++) if (inDeg[i] === 0) queue.push(i);
  while (queue.length) {
    const u = queue.shift();
    order.push(u);
    for (const v of adj[u]) {
      inDeg[v]--;
      if (inDeg[v] === 0) queue.push(v);
    }
  }
  return order.length === n ? order : null;
}

// Combined verification — both spatial and lock dependencies must be acyclic.
function verifyCombined(tiles, radius) {
  const n = tiles.length;
  const idx = new Map();
  for (let i = 0; i < n; i++) idx.set(hexKey(tiles[i].q, tiles[i].r), i);

  const keyOwner = new Map(); // keyId -> tile index
  for (let i = 0; i < n; i++) {
    if (tiles[i].key) keyOwner.set(tiles[i].key, i);
  }
  for (const t of tiles) {
    if (t.locked && !keyOwner.has(t.locked)) {
      return { ok: false, reason: `unmatched lock "${t.locked}"` };
    }
  }

  const inDeg = new Array(n).fill(0);
  const adj = Array.from({ length: n }, () => []);
  const addEdge = (from, to) => {
    adj[from].push(to);
    inDeg[to]++;
  };

  for (let i = 0; i < n; i++) {
    // Spatial: any tile j sitting in i's exit ray blocks i.
    const ray = exitRay(tiles[i], radius);
    for (const c of ray) {
      const j = idx.get(hexKey(c.q, c.r));
      if (j !== undefined && j !== i) addEdge(j, i);
    }
    // Lock: i's key tile must clear before i.
    if (tiles[i].locked) {
      const k = keyOwner.get(tiles[i].locked);
      if (k !== undefined && k !== i) addEdge(k, i);
    }
  }

  const queue = [];
  for (let i = 0; i < n; i++) if (inDeg[i] === 0) queue.push(i);
  let cleared = 0;
  const order = [];
  while (queue.length) {
    const u = queue.shift();
    cleared++;
    order.push(u);
    for (const v of adj[u]) {
      inDeg[v]--;
      if (inDeg[v] === 0) queue.push(v);
    }
  }
  if (cleared !== n) return { ok: false, reason: "cycle" };
  return { ok: true, order };
}

// ── Placement: seed N spatially solvable tiles on a board ─────────────────────
function placeSpatialTiles(radius, target, rng) {
  const cells = boardCells(radius);
  const placed = [];
  const used = new Set();
  let tries = 0;
  while (placed.length < target && tries < 8000) {
    tries++;
    const c = pick(cells, rng);
    const k = hexKey(c.q, c.r);
    if (used.has(k)) continue;
    // Bias direction toward longer rays so tiles tend to block each other.
    const dirs = ALL_DIRECTIONS.map((d) => ({
      d,
      len: exitRay({ q: c.q, r: c.r, direction: d }, radius).length,
    })).filter((x) => x.len > 0);
    if (dirs.length === 0) continue;
    const exp = 2.5;
    let total = 0;
    const weights = dirs.map((x) => {
      const w = Math.pow(x.len, exp);
      total += w;
      return w;
    });
    let pickW = rng() * total;
    let dir = dirs[dirs.length - 1].d;
    for (let i = 0; i < dirs.length; i++) {
      pickW -= weights[i];
      if (pickW <= 0) {
        dir = dirs[i].d;
        break;
      }
    }
    const cand = { q: c.q, r: c.r, direction: dir };
    const next = [...placed, cand];
    if (isSpatiallySolvable(next, radius)) {
      placed.push(cand);
      used.add(k);
    }
  }
  return placed;
}

// ── Assign locks: pick (key, locked) pairs that respect topological order ─────
// If tiles already have a valid topo order, we pick pairs so that
//   topoPos(keyTile) < topoPos(lockedTile)
// and the lock dependency is therefore consistent — combined graph stays acyclic.
function assignLocks(tiles, radius, lockCount, allowChain, rng) {
  const order = topoOrder(tiles, radius);
  if (!order) return false;
  const topoPos = new Array(tiles.length);
  for (let i = 0; i < order.length; i++) topoPos[order[i]] = i;

  // Track usage so each tile holds at most one role.
  const isKey = new Array(tiles.length).fill(false);
  const isLocked = new Array(tiles.length).fill(false);

  let keysAssigned = 0;
  let attempts = 0;
  while (keysAssigned < lockCount && attempts < 600) {
    attempts++;
    // Pick a future-locked tile first (must have at least one predecessor in topo).
    const lockedIdx = Math.floor(rng() * tiles.length);
    if (isLocked[lockedIdx] || isKey[lockedIdx]) continue;
    if (topoPos[lockedIdx] === 0) continue; // nothing comes before it

    // Pick a key tile strictly earlier in topo order.
    // Allow chains by letting a previously-locked tile also be a key, but a
    // key tile can't itself be locked (would force two simultaneous unlocks).
    const candidates = [];
    for (let i = 0; i < tiles.length; i++) {
      if (i === lockedIdx) continue;
      if (isLocked[i] && !allowChain) continue;
      if (topoPos[i] >= topoPos[lockedIdx]) continue;
      candidates.push(i);
    }
    if (candidates.length === 0) continue;
    const keyIdx = candidates[Math.floor(rng() * candidates.length)];
    if (isLocked[keyIdx]) continue; // can't be locked-and-key

    // Each key can unlock multiple locked tiles — reuse if already keyed.
    let keyId = tiles[keyIdx].key;
    if (!keyId) {
      keyId = `k${keysAssigned + 1}`;
      tiles[keyIdx].key = keyId;
      isKey[keyIdx] = true;
    }
    tiles[lockedIdx].locked = keyId;
    isLocked[lockedIdx] = true;
    keysAssigned++;
  }
  return keysAssigned >= Math.max(1, Math.floor(lockCount * 0.6));
}

// ── Level recipes ─────────────────────────────────────────────────────────────
// Existing names preserved; difficulty kept at hard/expert.
// (radius, tile count, lock count, allowChain) tuned for difficulty progression.
const LEVEL_RECIPES = [
  { id: 17, name: "Gatekeeper",  difficulty: "hard",   radius: 3, tiles: 10, locks: 2, chain: false },
  { id: 18, name: "Sequence",    difficulty: "hard",   radius: 3, tiles: 11, locks: 3, chain: true  },
  { id: 19, name: "Convergence", difficulty: "hard",   radius: 3, tiles: 12, locks: 3, chain: false },
  { id: 20, name: "Spiral",      difficulty: "hard",   radius: 3, tiles: 12, locks: 3, chain: true  },
  { id: 21, name: "Labyrinth",   difficulty: "hard",   radius: 3, tiles: 13, locks: 4, chain: true  },
  { id: 22, name: "Cascade",     difficulty: "expert", radius: 4, tiles: 14, locks: 3, chain: true  },
  { id: 23, name: "Paradox",     difficulty: "expert", radius: 4, tiles: 14, locks: 4, chain: false },
  { id: 24, name: "Nexus",       difficulty: "expert", radius: 4, tiles: 15, locks: 4, chain: true  },
  { id: 25, name: "Vortex",      difficulty: "expert", radius: 4, tiles: 16, locks: 4, chain: true  },
  { id: 26, name: "Threshold",   difficulty: "expert", radius: 4, tiles: 17, locks: 5, chain: true  },
  { id: 27, name: "Oblivion",    difficulty: "expert", radius: 4, tiles: 18, locks: 5, chain: true  },
  { id: 28, name: "Collapse",    difficulty: "expert", radius: 4, tiles: 19, locks: 5, chain: true  },
  { id: 29, name: "Singularity", difficulty: "expert", radius: 4, tiles: 20, locks: 6, chain: true  },
  { id: 30, name: "Eternity",    difficulty: "expert", radius: 4, tiles: 22, locks: 6, chain: true  },
];

function generateLevel(recipe, seed) {
  const rng = mulberry32(seed);
  let best = null;
  for (let attempt = 0; attempt < 30; attempt++) {
    const tiles = placeSpatialTiles(recipe.radius, recipe.tiles, () => rng());
    if (tiles.length < recipe.tiles) continue;
    // Mutable copies — assignLocks adds key/locked fields.
    const candidate = tiles.map((t) => ({ ...t }));
    const ok = assignLocks(candidate, recipe.radius, recipe.locks, recipe.chain, () => rng());
    if (!ok) continue;
    const verdict = verifyCombined(candidate, recipe.radius);
    if (!verdict.ok) continue;
    const keyCount = candidate.filter((t) => t.key).length;
    const lockCount = candidate.filter((t) => t.locked).length;
    if (lockCount < Math.max(1, Math.floor(recipe.locks * 0.6))) continue;
    const score = lockCount * 100 + keyCount; // prefer more locks
    if (!best || score > best.score) best = { tiles: candidate, score, keyCount, lockCount };
  }
  return best;
}

function levelToJson(recipe, generated) {
  // Build tiles in spec order: q, r, direction, [key], [locked]
  const tiles = generated.tiles.map((t) => {
    const out = { q: t.q, r: t.r, direction: t.direction };
    if (t.key) out.key = t.key;
    if (t.locked) out.locked = t.locked;
    return out;
  });
  return {
    id: recipe.id,
    name: recipe.name,
    gridRadius: recipe.radius,
    par: tiles.length,
    difficulty: recipe.difficulty,
    tiles,
  };
}

// ── Run ────────────────────────────────────────────────────────────────────────
const levelsDir = path.join(__dirname, "..", "src", "game", "levels");
let allOk = true;
const summary = [];

for (const recipe of LEVEL_RECIPES) {
  // Stable seed derived from recipe id so the build is reproducible.
  let seed = 0xa17e0000 ^ (recipe.id * 2654435761);
  let result = null;
  for (let s = 0; s < 8 && !result; s++) {
    result = generateLevel(recipe, seed >>> 0);
    seed = (seed * 1664525 + 1013904223) >>> 0;
  }
  if (!result) {
    console.log(`Level ${recipe.id} "${recipe.name}": FAILED to generate`);
    allOk = false;
    continue;
  }
  // Re-verify on the final tiles before writing.
  const verdict = verifyCombined(result.tiles, recipe.radius);
  if (!verdict.ok) {
    console.log(`Level ${recipe.id} "${recipe.name}": post-gen verify failed (${verdict.reason})`);
    allOk = false;
    continue;
  }
  const json = levelToJson(recipe, result);
  if (WRITE) {
    const out = path.join(levelsDir, `level${recipe.id}.json`);
    fs.writeFileSync(out, JSON.stringify(json, null, 2) + "\n");
  }
  summary.push({
    id: recipe.id,
    name: recipe.name,
    tiles: result.tiles.length,
    keys: result.keyCount,
    locks: result.lockCount,
  });
  console.log(
    `Level ${recipe.id} "${recipe.name}" [${recipe.difficulty}]: OK — ${result.tiles.length} tiles, ${result.keyCount} keys, ${result.lockCount} locks`
  );
}

console.log(allOk ? `\nAll ${summary.length} levels generated.` : "\nSome levels failed.");
if (!allOk) process.exit(1);
