export type Direction =
  | "LEFT"
  | "RIGHT"
  | "TOP_LEFT"
  | "TOP_RIGHT"
  | "BOTTOM_LEFT"
  | "BOTTOM_RIGHT";

export type TileType = "NORMAL";

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
}

export interface LevelData {
  id: number;
  name?: string;
  gridRadius: number;
  tiles: Array<{
    q: number;
    r: number;
    direction: Direction;
    color?: string;
    type?: TileType;
  }>;
}

export type GameStatus = "playing" | "won" | "lost";
