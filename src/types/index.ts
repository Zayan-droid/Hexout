export type Direction =
  | "LEFT"
  | "RIGHT"
  | "TOP_LEFT"
  | "TOP_RIGHT"
  | "BOTTOM_LEFT"
  | "BOTTOM_RIGHT";

export type TileType = "NORMAL";

export type Difficulty = "beginner" | "easy" | "medium" | "hard" | "expert";

export interface Hex {
  q: number;
  r: number;
}

export interface Tile {
  id: string;
  type: TileType;
  direction: Direction;
  color: string;
  q: number;
  r: number;
  /** If set, tile cannot move until the tile with key === this value has been cleared. */
  locked?: string;
  /** When this tile is cleared, all tiles with locked === this value become movable. */
  key?: string;
  /** Number of clears remaining until cracks finalize this tile. Counts down each clear. */
  crackAfter?: number;
  /** True once cracks have finalized: tile is permanently immovable and acts as a blocker. */
  cracked?: boolean;
}

/**
 * Rule mutations. Each level may declare zero or more mutations that re-shape gameplay
 * over time. Crack is per-tile (set on the Tile itself), so it's not in this union.
 */
export type MutationSpec =
  | {
      /** All tiles slide one hex in `direction` every `period` clears. Tiles pushed
       *  off the board count as cleared. Tiles colliding with another tile stop. */
      kind: "shift";
      direction: Direction;
      period: number;
    }
  | {
      /** The outermost ring of the board becomes hazardous every `period` clears,
       *  shrinking the play area. Tiles caught on hazardous hexes are destroyed. */
      kind: "shrink";
      period: number;
      /** Optional floor; play area will never shrink below this radius. */
      minRadius?: number;
    };

export interface LevelData {
  id: number;
  name?: string;
  difficulty?: Difficulty;
  par?: number;       // moves to earn 3 stars
  gridRadius: number;
  tiles: Array<{
    q: number;
    r: number;
    direction: Direction;
    color?: string;
    type?: TileType;
    locked?: string;
    key?: string;
    crackAfter?: number;
  }>;
  mutations?: MutationSpec[];
}

export type GameStatus = "playing" | "won" | "lost";

export interface LevelProgress {
  completed: boolean;
  stars: number;       // 0-3
  bestMoves: number;
}

export interface PlayerStats {
  skillScore: number;         // 0-100, drives adaptive difficulty
  totalLevelsCompleted: number;
  invalidMoves: number;       // lifetime invalid move count
  totalRetries: number;
}
