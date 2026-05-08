import type { Hex, Tile } from "@/types";
import { DIRECTION_VECTORS } from "@/game/grid/directions";
import { hexAdd, hexKey, isInsideRadius } from "@/game/grid/hex";

export type MoveOutcome =
  | { kind: "exits"; path: Hex[] } // tile leaves the board; path is cells traversed (excluding starting cell)
  | { kind: "blocked"; blocker: Tile; path: Hex[] }; // path is cells traversed before hitting blocker

// Build a fast occupancy map keyed by "q,r".
export function buildOccupancy(tiles: Tile[]): Map<string, Tile> {
  const map = new Map<string, Tile>();
  for (const t of tiles) map.set(hexKey(t.q, t.r), t);
  return map;
}

// Cast a ray from `tile` in its arrow direction across the board.
// We step one hex at a time:
//   - if next cell is outside the board radius, the tile exits.
//   - if next cell is occupied by another tile, this tile is blocked.
//   - otherwise, keep stepping.
export function resolveMove(
  tile: Tile,
  occupancy: Map<string, Tile>,
  gridRadius: number
): MoveOutcome {
  const vec = DIRECTION_VECTORS[tile.direction];
  const path: Hex[] = [];
  let cursor: Hex = { q: tile.q, r: tile.r };

  // Hard cap on iterations — radius*4 is more than enough for any sane board.
  const maxSteps = gridRadius * 4 + 4;
  for (let i = 0; i < maxSteps; i++) {
    cursor = hexAdd(cursor, vec);
    if (!isInsideRadius(cursor, gridRadius)) {
      path.push({ ...cursor });
      return { kind: "exits", path };
    }
    const blocker = occupancy.get(hexKey(cursor.q, cursor.r));
    if (blocker && blocker.id !== tile.id) {
      return { kind: "blocked", blocker, path };
    }
    path.push({ ...cursor });
  }
  // Shouldn't happen, but treat as exit to avoid hangs.
  return { kind: "exits", path };
}

// True if any tile on the board has at least one valid (exit) move available.
// A move is "valid" if the tile can leave the board along its arrow.
// (Sliding into another empty cell without exiting isn't a thing in this game —
// tiles only resolve by exiting the board.)
export function hasAnyValidMove(tiles: Tile[], gridRadius: number): boolean {
  const occ = buildOccupancy(tiles);
  for (const t of tiles) {
    const out = resolveMove(t, occ, gridRadius);
    if (out.kind === "exits") return true;
  }
  return false;
}
