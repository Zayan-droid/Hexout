import type { Direction, Hex } from "@/types";

// Pointy-top axial coordinates.
// q axis runs east-west; r axis runs from top-left to bottom-right.
// 6 neighbors form a flat-sided hexagon when we move along these vectors.
export const DIRECTION_VECTORS: Record<Direction, Hex> = {
  LEFT: { q: -1, r: 0 },
  RIGHT: { q: 1, r: 0 },
  TOP_LEFT: { q: 0, r: -1 },
  TOP_RIGHT: { q: 1, r: -1 },
  BOTTOM_LEFT: { q: -1, r: 1 },
  BOTTOM_RIGHT: { q: 0, r: 1 },
};

export const ALL_DIRECTIONS: Direction[] = [
  "LEFT",
  "RIGHT",
  "TOP_LEFT",
  "TOP_RIGHT",
  "BOTTOM_LEFT",
  "BOTTOM_RIGHT",
];

// Arrow rotation in degrees so a single arrow glyph can be reused per direction.
// 0deg points to the right (RIGHT); we measure clockwise from there.
export const DIRECTION_ANGLE_DEG: Record<Direction, number> = {
  RIGHT: 0,
  BOTTOM_RIGHT: 60,
  BOTTOM_LEFT: 120,
  LEFT: 180,
  TOP_LEFT: 240,
  TOP_RIGHT: 300,
};
