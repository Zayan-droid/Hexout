import type { Tile } from "@/types";

export type PowerUpId =
  | "hammer"
  | "swap"
  | "colorClear"
  | "shuffle"
  | "lineBlast"
  | "undo"
  | "bomb";

export interface PowerUpDef {
  id: PowerUpId;
  name: string;
  description: string;
  /** number of player picks required before the effect fires */
  picks: 0 | 1 | 2;
  /** dominant tint used for the icon/glow; falls back to a theme accent */
  hue: string;
  /** secondary tint for gradient depth */
  hueDeep: string;
}

export const POWER_UPS: Record<PowerUpId, PowerUpDef> = {
  hammer: {
    id: "hammer",
    name: "Hammer",
    description: "Crack a single tile off the board.",
    picks: 1,
    hue: "#FFB37A",
    hueDeep: "#E37C3A",
  },
  swap: {
    id: "swap",
    name: "Swap",
    description: "Trade the positions of two tiles.",
    picks: 2,
    hue: "#7AC7FF",
    hueDeep: "#3D8BD8",
  },
  colorClear: {
    id: "colorClear",
    name: "Color Clear",
    description: "Dissolve every tile of one color.",
    picks: 1,
    hue: "#C599FF",
    hueDeep: "#8C5AE0",
  },
  shuffle: {
    id: "shuffle",
    name: "Shuffle",
    description: "Lift the board and reorganize.",
    picks: 0,
    hue: "#FFD27A",
    hueDeep: "#E5A235",
  },
  lineBlast: {
    id: "lineBlast",
    name: "Line Blast",
    description: "Sweep an energy beam along a tile's path.",
    picks: 1,
    hue: "#88E6C8",
    hueDeep: "#3FAE85",
  },
  undo: {
    id: "undo",
    name: "Rewind",
    description: "Step back the last move.",
    picks: 0,
    hue: "#A8B5FF",
    hueDeep: "#5F73E0",
  },
  bomb: {
    id: "bomb",
    name: "Bloom Bomb",
    description: "Burst all neighbors of a chosen tile.",
    picks: 1,
    hue: "#FF8FA8",
    hueDeep: "#D8466C",
  },
};

export const POWER_UP_ORDER: PowerUpId[] = [
  "hammer",
  "swap",
  "lineBlast",
  "bomb",
  "colorClear",
  "shuffle",
  "undo",
];

/* ------------------------ Effect event payloads ------------------------- */
/* The store fires these so the visual layer can choreograph each effect.   */

export type PowerUpEffect =
  | { kind: "hammer"; tile: Tile; at: number }
  | { kind: "swap"; a: Tile; b: Tile; at: number }
  | { kind: "colorClear"; color: string; tiles: Tile[]; at: number }
  | { kind: "shuffle"; before: Tile[]; after: Tile[]; at: number }
  | { kind: "lineBlast"; from: Tile; path: Array<{ q: number; r: number }>; cleared: Tile[]; at: number }
  | { kind: "undo"; restored: Tile; at: number }
  | { kind: "bomb"; center: Tile; cleared: Tile[]; at: number };
