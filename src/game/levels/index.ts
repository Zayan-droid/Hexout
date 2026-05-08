import type { LevelData } from "@/types";
import level1 from "./level1.json";
import level2 from "./level2.json";
import level3 from "./level3.json";
import level4 from "./level4.json";
import level5 from "./level5.json";

export const LEVELS: LevelData[] = [
  level1 as LevelData,
  level2 as LevelData,
  level3 as LevelData,
  level4 as LevelData,
  level5 as LevelData,
];

export function getLevelById(id: number | string): LevelData | undefined {
  const numId = typeof id === "string" ? parseInt(id, 10) : id;
  return LEVELS.find((l) => l.id === numId);
}
