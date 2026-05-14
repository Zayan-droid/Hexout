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
}

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
  }>;
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
