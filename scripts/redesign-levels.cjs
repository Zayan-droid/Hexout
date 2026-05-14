// Redesigns hand-crafted levels 1–15 to be progressively challenging puzzles.
// Each level introduces a new tactical theme. Solvability is verified before
// any JSON is written.
//
// Run: node scripts/redesign-levels.cjs
//   --check   verify only, don't write files
//   --write   verify + write files

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

function isInsideRadius(h, radius) {
  const s = -h.q - h.r;
  return (
    Math.abs(h.q) <= radius &&
    Math.abs(h.r) <= radius &&
    Math.abs(s) <= radius
  );
}

function getRayCells(tile, radius) {
  const vec = DIRECTION_VECTORS[tile.direction];
  if (!vec) throw new Error(`Unknown direction: ${tile.direction}`);
  const cells = [];
  let cur = { q: tile.q, r: tile.r };
  for (let i = 0; i < radius * 4 + 4; i++) {
    cur = { q: cur.q + vec.q, r: cur.r + vec.r };
    if (!isInsideRadius(cur, radius)) break;
    cells.push({ q: cur.q, r: cur.r });
  }
  return cells;
}

function analyze(level) {
  const tiles = level.tiles;
  const radius = level.gridRadius;
  const n = tiles.length;
  const key = (q, r) => `${q},${r}`;

  // Validate cell positions and uniqueness.
  const seen = new Set();
  for (let i = 0; i < n; i++) {
    const t = tiles[i];
    if (!isInsideRadius(t, radius)) {
      return { error: `Tile ${i} at (${t.q},${t.r}) is off-board (radius ${radius})` };
    }
    const k = key(t.q, t.r);
    if (seen.has(k)) return { error: `Duplicate tile at ${k}` };
    seen.add(k);
  }

  const inDeg = new Array(n).fill(0);
  const adj = Array.from({ length: n }, () => []);

  for (let i = 0; i < n; i++) {
    const ray = getRayCells(tiles[i], radius);
    const set = new Set(ray.map((c) => key(c.q, c.r)));
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      if (set.has(key(tiles[j].q, tiles[j].r))) {
        adj[j].push(i);
        inDeg[i]++;
      }
    }
  }

  const freeStart = inDeg.filter((d) => d === 0).length;

  // Kahn topological sort + per-node depth.
  const depth = new Array(n).fill(0);
  const work = [...inDeg];
  const q = [];
  for (let i = 0; i < n; i++) if (work[i] === 0) q.push(i);
  let cleared = 0;
  while (q.length) {
    const u = q.shift();
    cleared++;
    for (const v of adj[u]) {
      depth[v] = Math.max(depth[v], depth[u] + 1);
      work[v]--;
      if (work[v] === 0) q.push(v);
    }
  }
  const solvable = cleared === n;
  const maxDepth = n > 0 ? Math.max(...depth) : 0;

  // Count tiles that have a zero-length ray (immediate exit, no in-board cells).
  // These are trivial — never blocked. Flag if > 1.
  let trivialExits = 0;
  for (let i = 0; i < n; i++) {
    if (getRayCells(tiles[i], radius).length === 0) trivialExits++;
  }

  return { solvable, freeStart, maxDepth, n, trivialExits };
}

// ─── Level designs ─────────────────────────────────────────────────────────────
// Each level escalates a new puzzle concept:
//   L1  Ordering: a linear chain teaches "clear the unblocked end first".
//   L2  Chain length: 5-deep diagonal climb.
//   L3  Two axes: perpendicular chains plus a cross-branch.
//   L4  Long funnel: 6-deep BL diagonal + side branch.
//   L5  Hub: one anchor unlocks three independent two-step chains.
//   L6  Multi-axis: three chains (horizontal/vertical/diagonal) interlock at a hub.
//   L7  Stacks: three parallel TR diagonals + a cross-dependency.
//   L8  Snake: long zigzag with shared blockers.
//   L9  Lattice: dense radius-3 grid with several mid-depth chains.
//   L10 Knots: many interlocking short chains forcing a specific order.
//   L11 Cascade: radius-4 board — wide branching depth.
//   L12 Twin spiral: two opposing spirals on a big board.
//   L13 Pressure: dense radius-4 with very few free starts.
//   L14 Maelstrom: expert-tier interlocked chains.
//   L15 Inferno: maximum tile count with brutal depth.

const LEVELS = [
  {
    id: 1,
    name: "Lockstep",
    difficulty: "beginner",
    par: 4,
    gridRadius: 2,
    tiles: [
      { q: -1, r: 0, direction: "LEFT" },   // free
      { q: 0, r: 0, direction: "LEFT" },    // blocked by (-1,0)
      { q: 1, r: 0, direction: "LEFT" },    // blocked by (0,0)
      { q: 0, r: 1, direction: "TOP_LEFT" } // blocked by (0,0)
    ],
  },
  {
    id: 2,
    name: "Climb",
    difficulty: "beginner",
    par: 6,
    gridRadius: 2,
    tiles: [
      { q: 2, r: -2, direction: "TOP_RIGHT" },   // free (ray empty → off-board)
      { q: 1, r: -1, direction: "TOP_RIGHT" },
      { q: 0, r: 0, direction: "TOP_RIGHT" },
      { q: -1, r: 1, direction: "TOP_RIGHT" },
      { q: -2, r: 2, direction: "TOP_RIGHT" },
      { q: -1, r: 0, direction: "BOTTOM_RIGHT" } // depends on (-1,1)
    ],
  },
  {
    id: 3,
    name: "Crossroads",
    difficulty: "easy",
    par: 7,
    gridRadius: 3,
    tiles: [
      // Horizontal RIGHT chain (skips center).
      { q: -3, r: 0, direction: "RIGHT" },
      { q: -1, r: 0, direction: "RIGHT" },
      { q: 1, r: 0, direction: "RIGHT" },
      // Vertical BOTTOM_RIGHT chain (skips center).
      { q: 0, r: -3, direction: "BOTTOM_RIGHT" },
      { q: 0, r: -1, direction: "BOTTOM_RIGHT" },
      { q: 0, r: 1, direction: "BOTTOM_RIGHT" },
      // Cross-branch — depends on (1,0).
      { q: 1, r: 2, direction: "TOP_LEFT" }
    ],
  },
  {
    id: 4,
    name: "Funnel",
    difficulty: "easy",
    par: 7,
    gridRadius: 3,
    tiles: [
      // BL diagonal (q+r = 0): 6-deep chain.
      { q: 2, r: -2, direction: "BOTTOM_LEFT" },
      { q: 1, r: -1, direction: "BOTTOM_LEFT" },
      { q: 0, r: 0, direction: "BOTTOM_LEFT" },
      { q: -1, r: 1, direction: "BOTTOM_LEFT" },
      { q: -2, r: 2, direction: "BOTTOM_LEFT" },
      { q: -3, r: 3, direction: "BOTTOM_LEFT" }, // free
      // Side branch: depends on (0,0) clearing.
      { q: 0, r: -3, direction: "BOTTOM_RIGHT" }
    ],
  },
  {
    id: 5,
    name: "Anchor",
    difficulty: "medium",
    par: 8,
    gridRadius: 3,
    tiles: [
      // Hub escapes south-west; everything else is blocked behind it.
      { q: 0, r: 0, direction: "BOTTOM_LEFT" },
      // Three two-step chains, one per axis (no opposing pairs).
      { q: 2, r: 0, direction: "LEFT" },
      { q: 3, r: 0, direction: "LEFT" },
      { q: 0, r: 2, direction: "TOP_LEFT" },
      { q: 0, r: 3, direction: "TOP_LEFT" },
      { q: 2, r: -2, direction: "BOTTOM_LEFT" },
      { q: 3, r: -3, direction: "BOTTOM_LEFT" },
      // Independent free tile to give the player a fake-start to consider.
      { q: -3, r: 1, direction: "LEFT" }
    ],
  },
  {
    id: 6,
    name: "Sweep",
    difficulty: "medium",
    par: 8,
    gridRadius: 3,
    tiles: [
      // Horizontal RIGHT chain (depth 2).
      { q: 0, r: 0, direction: "RIGHT" },
      { q: -1, r: 0, direction: "RIGHT" },
      { q: -2, r: 0, direction: "RIGHT" },
      // Vertical BR chain (depth 1) — independent.
      { q: 0, r: 2, direction: "BOTTOM_RIGHT" },
      { q: 0, r: 1, direction: "BOTTOM_RIGHT" },
      // BL diagonal — chained off the hub (0,0).
      { q: 1, r: -1, direction: "BOTTOM_LEFT" },
      { q: 2, r: -2, direction: "BOTTOM_LEFT" },
      { q: 3, r: -3, direction: "BOTTOM_LEFT" }
    ],
  },
  {
    id: 7,
    name: "Stacks",
    difficulty: "medium",
    par: 10,
    gridRadius: 3,
    tiles: [
      // Three parallel TR diagonals: q+r = 1, 0, -1.
      { q: 0, r: 1, direction: "TOP_RIGHT" },
      { q: 1, r: 0, direction: "TOP_RIGHT" },
      { q: 2, r: -1, direction: "TOP_RIGHT" },

      { q: -1, r: 1, direction: "TOP_RIGHT" },
      { q: 0, r: 0, direction: "TOP_RIGHT" },
      { q: 1, r: -1, direction: "TOP_RIGHT" },

      { q: -2, r: 1, direction: "TOP_RIGHT" },
      { q: -1, r: 0, direction: "TOP_RIGHT" },
      { q: 0, r: -1, direction: "TOP_RIGHT" },

      // Cross-blocker — depends on chain-mid (1,-1) and gates chain bottom (0,-1).
      { q: 1, r: -2, direction: "BOTTOM_RIGHT" }
    ],
  },
  {
    id: 8,
    name: "Snake",
    difficulty: "medium",
    par: 10,
    gridRadius: 3,
    tiles: [
      // Two interleaved BR chains with cross-blockers.
      { q: -2, r: 0, direction: "BOTTOM_RIGHT" },
      { q: -2, r: 1, direction: "BOTTOM_RIGHT" },
      { q: -2, r: 2, direction: "BOTTOM_RIGHT" },
      { q: 0, r: -2, direction: "BOTTOM_RIGHT" },
      { q: 0, r: -1, direction: "BOTTOM_RIGHT" },
      { q: 0, r: 1, direction: "BOTTOM_RIGHT" },
      // Cross-row tiles pointing LEFT — depend on the BR column tiles being out
      // of the way? No: their rays don't intersect the BR columns. Place them
      // so they pull through both columns.
      { q: 2, r: -1, direction: "LEFT" },        // ray through (1,-1) (0,-1!) ... blocked by (0,-1)
      { q: 2, r: 0, direction: "LEFT" },         // ray through (1,0), (0,0), (-1,0), (-2,0)! blocked by (-2,0)
      { q: 3, r: -2, direction: "LEFT" },        // blocked by (0,-2)
      { q: 3, r: -1, direction: "LEFT" }         // blocked by (0,-1)
    ],
  },
  {
    id: 9,
    name: "Lattice",
    difficulty: "hard",
    par: 11,
    gridRadius: 3,
    tiles: [
      // R chain row r=-1 (4 tiles): chain head (1,-1) gates the column above.
      { q: -2, r: -1, direction: "RIGHT" },
      { q: -1, r: -1, direction: "RIGHT" },
      { q: 0, r: -1, direction: "RIGHT" },
      { q: 1, r: -1, direction: "RIGHT" },
      // R chain row r=0.
      { q: -3, r: 0, direction: "RIGHT" },
      { q: -1, r: 0, direction: "RIGHT" },
      { q: 1, r: 0, direction: "RIGHT" },
      // R chain row r=1.
      { q: -1, r: 1, direction: "RIGHT" },
      { q: 1, r: 1, direction: "RIGHT" },
      // TL connectors — depend on rows beneath.
      { q: 0, r: 3, direction: "TOP_LEFT" },     // blocked by (0,-1)
      { q: 1, r: 2, direction: "TOP_LEFT" }      // blocked by (1,1)
    ],
  },
  {
    id: 10,
    name: "Knots",
    difficulty: "hard",
    par: 12,
    gridRadius: 3,
    tiles: [
      // BR column at q=-1.
      { q: -1, r: -1, direction: "BOTTOM_RIGHT" },
      { q: -1, r: 0, direction: "BOTTOM_RIGHT" },
      { q: -1, r: 1, direction: "BOTTOM_RIGHT" },
      // BR column at q=1.
      { q: 1, r: -2, direction: "BOTTOM_RIGHT" },
      { q: 1, r: -1, direction: "BOTTOM_RIGHT" },
      { q: 1, r: 0, direction: "BOTTOM_RIGHT" },
      // R row at r=-2 — chained.
      { q: -1, r: -2, direction: "RIGHT" },
      { q: 0, r: -2, direction: "RIGHT" },
      // L row at r=2 — chained the other way.
      { q: 0, r: 2, direction: "LEFT" },
      { q: -1, r: 2, direction: "LEFT" },
      // Two diagonal blockers.
      { q: 2, r: -3, direction: "BOTTOM_LEFT" },
      { q: -2, r: 3, direction: "TOP_RIGHT" }
    ],
  },
  {
    id: 11,
    name: "Cascade",
    difficulty: "hard",
    par: 13,
    gridRadius: 4,
    tiles: [
      // Long BL diagonal (q+r = 0) — 6-deep chain.
      { q: 3, r: -3, direction: "BOTTOM_LEFT" },
      { q: 2, r: -2, direction: "BOTTOM_LEFT" },
      { q: 1, r: -1, direction: "BOTTOM_LEFT" },
      { q: 0, r: 0, direction: "BOTTOM_LEFT" },
      { q: -1, r: 1, direction: "BOTTOM_LEFT" },
      { q: -2, r: 2, direction: "BOTTOM_LEFT" },
      // Side branches feeding the diagonal.
      { q: 3, r: 0, direction: "LEFT" },
      { q: 4, r: -2, direction: "LEFT" },
      { q: 0, r: 3, direction: "TOP_LEFT" },
      { q: -2, r: 4, direction: "TOP_LEFT" },
      // Independent supporting chain on the BR axis.
      { q: -3, r: -1, direction: "BOTTOM_RIGHT" },
      { q: -3, r: 0, direction: "BOTTOM_RIGHT" },
      { q: -3, r: 1, direction: "BOTTOM_RIGHT" }
    ],
  },
  {
    id: 12,
    name: "Twin Spirals",
    difficulty: "hard",
    par: 14,
    gridRadius: 4,
    tiles: [
      // Upper TR chain.
      { q: 4, r: -4, direction: "TOP_RIGHT" },
      { q: 3, r: -3, direction: "TOP_RIGHT" },
      { q: 2, r: -2, direction: "TOP_RIGHT" },
      { q: 1, r: -1, direction: "TOP_RIGHT" },
      // Lower BL chain (opposite half of the same diagonal).
      { q: -4, r: 4, direction: "BOTTOM_LEFT" },
      { q: -3, r: 3, direction: "BOTTOM_LEFT" },
      { q: -2, r: 2, direction: "BOTTOM_LEFT" },
      { q: -1, r: 1, direction: "BOTTOM_LEFT" },
      // Right-side R chain.
      { q: 0, r: 0, direction: "RIGHT" },
      { q: -2, r: 0, direction: "RIGHT" },
      { q: -4, r: 0, direction: "RIGHT" },
      // Vertical TL chain on q=2.
      { q: 2, r: 2, direction: "TOP_LEFT" },
      { q: 2, r: 1, direction: "TOP_LEFT" },
      { q: 2, r: 0, direction: "TOP_LEFT" }
    ],
  },
  {
    id: 13,
    name: "Pressure",
    difficulty: "hard",
    par: 15,
    gridRadius: 4,
    tiles: [
      // Two long R chains stacked.
      { q: -4, r: 0, direction: "RIGHT" },
      { q: -2, r: 0, direction: "RIGHT" },
      { q: 0, r: 0, direction: "RIGHT" },
      { q: 2, r: 0, direction: "RIGHT" },
      { q: -4, r: 1, direction: "RIGHT" },
      { q: -2, r: 1, direction: "RIGHT" },
      { q: 0, r: 1, direction: "RIGHT" },
      { q: 2, r: 1, direction: "RIGHT" },
      // BR column at q=1.
      { q: 1, r: -3, direction: "BOTTOM_RIGHT" },
      { q: 1, r: -2, direction: "BOTTOM_RIGHT" },
      { q: 1, r: -1, direction: "BOTTOM_RIGHT" },
      // BR column at q=-1.
      { q: -1, r: -3, direction: "BOTTOM_RIGHT" },
      { q: -1, r: -2, direction: "BOTTOM_RIGHT" },
      // Side branches.
      { q: 4, r: -3, direction: "BOTTOM_LEFT" },
      { q: -3, r: -1, direction: "BOTTOM_RIGHT" }
    ],
  },
  {
    id: 14,
    name: "Maelstrom",
    difficulty: "expert",
    par: 17,
    gridRadius: 4,
    tiles: [
      // BL grand diagonal — 8-deep chain.
      { q: 4, r: -4, direction: "BOTTOM_LEFT" },
      { q: 3, r: -3, direction: "BOTTOM_LEFT" },
      { q: 2, r: -2, direction: "BOTTOM_LEFT" },
      { q: 1, r: -1, direction: "BOTTOM_LEFT" },
      { q: 0, r: 0, direction: "BOTTOM_LEFT" },
      { q: -1, r: 1, direction: "BOTTOM_LEFT" },
      { q: -2, r: 2, direction: "BOTTOM_LEFT" },
      { q: -3, r: 3, direction: "BOTTOM_LEFT" },
      // Two perpendicular feeder chains.
      { q: 4, r: -3, direction: "LEFT" },
      { q: 4, r: -2, direction: "LEFT" },
      { q: 4, r: -1, direction: "LEFT" },
      { q: 0, r: 3, direction: "TOP_LEFT" },
      { q: 0, r: 4, direction: "TOP_LEFT" },
      // Cross blockers on column q=-2.
      { q: -2, r: -2, direction: "BOTTOM_RIGHT" },
      { q: -2, r: -1, direction: "BOTTOM_RIGHT" },
      { q: -2, r: 0, direction: "BOTTOM_RIGHT" },
      { q: -2, r: 1, direction: "BOTTOM_RIGHT" }
    ],
  },
  {
    id: 15,
    name: "Inferno",
    difficulty: "expert",
    par: 20,
    gridRadius: 4,
    tiles: [
      // Three R chains stacked on rows r=-1,0,1.
      { q: -3, r: -1, direction: "RIGHT" },
      { q: -1, r: -1, direction: "RIGHT" },
      { q: 0, r: -1, direction: "RIGHT" },
      { q: 2, r: -1, direction: "RIGHT" },
      { q: -4, r: 0, direction: "RIGHT" },
      { q: -2, r: 0, direction: "RIGHT" },
      { q: 0, r: 0, direction: "RIGHT" },
      { q: 2, r: 0, direction: "RIGHT" },
      { q: -3, r: 1, direction: "RIGHT" },
      { q: -1, r: 1, direction: "RIGHT" },
      { q: 1, r: 1, direction: "RIGHT" },
      // Two BR columns intersecting them.
      { q: -1, r: -3, direction: "BOTTOM_RIGHT" },
      { q: -1, r: -2, direction: "BOTTOM_RIGHT" },
      { q: 1, r: -3, direction: "BOTTOM_RIGHT" },
      { q: 1, r: -2, direction: "BOTTOM_RIGHT" },
      // Two BL diagonal blockers.
      { q: 4, r: -4, direction: "BOTTOM_LEFT" },
      { q: 4, r: -3, direction: "BOTTOM_LEFT" },
      { q: 4, r: -2, direction: "BOTTOM_LEFT" },
      // Two TL column blockers.
      { q: -3, r: 3, direction: "TOP_LEFT" },
      { q: -3, r: 4, direction: "TOP_LEFT" }
    ],
  },
];

// ─── Verify ────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const writeMode = args.includes("--write");

let allOk = true;
console.log("ID  Name             Diff       n   free  depth  par   status");
console.log("──  ───────────────  ─────────  ──  ────  ─────  ────  ──────");
for (const lvl of LEVELS) {
  const a = analyze(lvl);
  if (a.error) {
    console.log(
      `${String(lvl.id).padEnd(2)}  ${lvl.name.padEnd(15)}  ${lvl.difficulty.padEnd(9)}  -   -     -      ${String(lvl.par).padEnd(4)}  ERROR: ${a.error}`
    );
    allOk = false;
    continue;
  }
  const matchPar = lvl.par === a.n;
  const status = a.solvable
    ? matchPar
      ? "OK"
      : `PAR≠TILES(${a.n})`
    : "UNSOLVABLE";
  console.log(
    `${String(lvl.id).padEnd(2)}  ${lvl.name.padEnd(15)}  ${lvl.difficulty.padEnd(9)}  ${String(a.n).padEnd(2)}  ${String(a.freeStart).padEnd(4)}  ${String(a.maxDepth).padEnd(5)}  ${String(lvl.par).padEnd(4)}  ${status}`
  );
  if (!a.solvable) allOk = false;
}

if (!allOk) {
  console.log("\n❌ Some levels failed. Not writing.");
  process.exit(1);
}

if (writeMode) {
  const outDir = path.join(__dirname, "..", "src", "game", "levels");
  for (const lvl of LEVELS) {
    const file = path.join(outDir, `level${lvl.id}.json`);
    fs.writeFileSync(file, JSON.stringify(lvl, null, 2) + "\n");
  }
  console.log(`\n✅ Wrote ${LEVELS.length} level files to ${outDir}`);
} else {
  console.log("\n✅ All levels verified. Re-run with --write to update JSON files.");
}
