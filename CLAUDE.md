# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start Vite dev server (default port 5173; override with `PORT=xxxx npm run dev`)
- `npm run build` — `tsc -b` then `vite build` (type-check is part of build; failing types break the build)
- `npm run preview` — serve the production build
- `npm run lint` — ESLint over the repo
- Type-check only: `npx tsc --noEmit`

There is no test runner configured. Verify behavior in the browser via `npm run dev`.

## Architecture

HexOut is a hexagonal puzzle game. Each tile carries an arrow direction; tapping it raycasts along that direction. The tile either exits the board (clears) or hits another tile (blocked). The level is won when all tiles are cleared and lost when no remaining tile has a valid exit.

### Coordinate system (critical)

- **Pointy-top axial coordinates** `(q, r)` with implied `s = -q-r`.
- A cell is on the board iff `max(|q|, |r|, |s|) <= gridRadius` — see `isInsideRadius` in [src/game/grid/hex.ts](src/game/grid/hex.ts).
- Six directions (`LEFT, RIGHT, TOP_LEFT, TOP_RIGHT, BOTTOM_LEFT, BOTTOM_RIGHT`) are unit vectors in [src/game/grid/directions.ts](src/game/grid/directions.ts). Do not invent diagonals; the six axial neighbors are the only valid moves.
- Pixel conversion via `hexToPixel(h, size)` — `size` is center-to-corner radius, not edge length.

### Movement engine

[src/game/engine/movement.ts](src/game/engine/movement.ts) is pure logic, no React. The whole game rule set lives here:

- `buildOccupancy(tiles)` — `Map<"q,r", Tile>` for O(1) lookup
- `resolveMove(tile, occupancy, radius)` — steps along the direction vector one hex at a time; returns `{ kind: "exits", path }` or `{ kind: "blocked", blocker, path }`
- `hasAnyValidMove(tiles, radius)` — used for lose detection. **Important:** a "valid" move means the tile can fully exit the board. Sliding partway is not a move.

### State (Zustand)

Two stores, kept separate by lifetime:

- [src/store/gameStore.ts](src/store/gameStore.ts) — per-session: current level, tiles, status, moves, combo tracking, animation lock (`animatingId`). Tile clears go through `attemptMove` → `finishExit` two-step (animation completes before state mutates). Combo window is 1200ms between back-to-back clears.
- [src/store/progressStore.ts](src/store/progressStore.ts) — persisted to localStorage as `hexout-progress` via `zustand/middleware/persist`. Tracks per-level `LevelProgress` (stars, bestMoves, completed) and global `PlayerStats` (skillScore 0–100, totals).
  - `calcStars(moves, par)`: 3★ ≤ par, 2★ ≤ par×1.5, 1★ otherwise
  - `isUnlocked(id)`: levels 1–3 always unlocked, else previous level must be completed
  - Skill score adjusts by `(par/moves - 0.5) * 6` on completion (range −3 to +3)

### Levels

Two sources, merged in [src/game/levels/index.ts](src/game/levels/index.ts):

1. **Hand-crafted JSON** — `level1.json` … `level15.json`. Each file includes `difficulty` + `par` directly. `par` equals tile count (every tile must clear once; no wasted moves possible at par). Designs are verified solvable by [scripts/redesign-levels.cjs](scripts/redesign-levels.cjs), which runs the same topological-sort solvability check used by the generator.
2. **Procedural** — [src/game/levels/generator.ts](src/game/levels/generator.ts) emits levels 16–50 using mulberry32 PRNG. Solvability is guaranteed by Kahn's topological sort over a blocking dependency graph: tile A depends on tile B if B sits in A's exit ray; if the DAG has a cycle, the level is rejected. Difficulty params (radius, tile count, max-attempt budget) live in `DifficultyParams` inside this file.

`LEVELS_BY_DIFFICULTY` groups levels by tab for the level select screen.

### Rendering

- SVG-based (no canvas/PixiJS). [src/components/GameBoard.tsx](src/components/GameBoard.tsx) computes `size` to fit the hexagonal board into the available space, then translates the `<g>` group to center it.
- [src/components/TileView.tsx](src/components/TileView.tsx) uses **GSAP for the exit animation** (power3.in, ~0.42s) and **framer-motion for idle pulses and shake feedback**. Position is set imperatively on a ref to keep animation smooth; do not let React re-render the tile mid-flight.
- [src/components/ParticleCanvas.tsx](src/components/ParticleCanvas.tsx) is a sibling overlay with a `burst(x, y, color, count)` imperative handle exposed via `forwardRef`. `GameBoard` fires it just before calling `finishExit` so particles spawn at the cleared tile's last position.
- [src/components/ResultOverlay.tsx](src/components/ResultOverlay.tsx) draws the win/lose modal plus its own canvas confetti when `status === "won"`.

### Audio

[src/services/audio.ts](src/services/audio.ts) is a Web Audio API singleton — no static audio files. Methods: `tap`, `slide`, `clear`, `combo(count)`, `blocked`, `win`, `lost`, `setMuted`. The store calls these directly on state transitions.

### Routing

React Router v6, three routes in [src/App.tsx](src/App.tsx): `/` (Home), `/levels` (LevelSelect), `/play/:levelId` (Play). [src/pages/Play.tsx](src/pages/Play.tsx) redirects to `/levels` if the level is locked or missing, and uses a `hasRecorded` ref to record the win exactly once per session.

### Path alias

`@/*` resolves to `src/*` (configured in both `vite.config.ts` and `tsconfig.json`). Always use it for cross-package imports.

## Conventions

- Game rules live in `src/game/**` and must remain framework-agnostic (no React, no DOM). UI consumes them via stores.
- New tiles/levels: extend the `LevelData` JSON shape; coordinates must satisfy `isInsideRadius` for `gridRadius`. The generator's solvability check should be reused if you author new procedural content.
- Animation locks: never mutate `tiles` while `animatingId` is set — wait for `finishExit`.
