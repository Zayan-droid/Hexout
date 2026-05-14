import type { Tile, LevelData } from "@/types";

// Distinct hues for key↔lock pairs. Bright enough to read on dimmed locked tiles,
// soft enough to layer over any theme's tile colors.
export const LOCK_PALETTE: string[] = [
  "#C77DFF", // lavender
  "#FFC247", // amber
  "#FF6B9D", // rose
  "#5EE2C7", // mint
  "#FF8A65", // coral
  "#7DB9FF", // sky
  "#B6E04E", // lime
  "#FFD56B", // sunshine
];

type PairSource = Pick<Tile, "key" | "locked"> | LevelData["tiles"][number];

/**
 * Map each unique lock key (e.g. "k1", "k2") to a stable tint color.
 * Order is determined by first appearance in the input list, so pass the
 * original level tile list (not the live tiles array) for stability across
 * clears.
 */
export function getPairTints(tiles: PairSource[]): Map<string, string> {
  const tints = new Map<string, string>();
  let idx = 0;
  for (const t of tiles) {
    const id = t.key ?? t.locked;
    if (id && !tints.has(id)) {
      tints.set(id, LOCK_PALETTE[idx % LOCK_PALETTE.length]);
      idx++;
    }
  }
  return tints;
}

export function pairTintFor(
  tile: Pick<Tile, "key" | "locked">,
  tints: Map<string, string>
): string | undefined {
  const id = tile.key ?? tile.locked;
  return id ? tints.get(id) : undefined;
}
