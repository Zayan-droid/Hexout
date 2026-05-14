import type { Difficulty, LevelData } from "@/types";
import level1 from "./level1.json";
import level2 from "./level2.json";
import level3 from "./level3.json";
import level4 from "./level4.json";
import level5 from "./level5.json";
import level6 from "./level6.json";
import level7 from "./level7.json";
import level8 from "./level8.json";
import level9 from "./level9.json";
import level10 from "./level10.json";
import level11 from "./level11.json";
import level12 from "./level12.json";
import level13 from "./level13.json";
import level14 from "./level14.json";
import level15 from "./level15.json";

export const LEVELS: LevelData[] = [
  level1, level2, level3, level4, level5,
  level6, level7, level8, level9, level10,
  level11, level12, level13, level14, level15,
] as LevelData[];

export function getLevelById(id: number | string): LevelData | undefined {
  const numId = typeof id === "string" ? parseInt(id, 10) : id;
  return LEVELS.find((l) => l.id === numId);
}

export const LEVELS_BY_DIFFICULTY: Record<Difficulty, LevelData[]> = {
  beginner: LEVELS.filter((l) => l.difficulty === "beginner"),
  easy: LEVELS.filter((l) => l.difficulty === "easy"),
  medium: LEVELS.filter((l) => l.difficulty === "medium"),
  hard: LEVELS.filter((l) => l.difficulty === "hard"),
  expert: LEVELS.filter((l) => l.difficulty === "expert"),
};
