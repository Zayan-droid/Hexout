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
import level16 from "./level16.json";
import level17 from "./level17.json";
import level18 from "./level18.json";
import level19 from "./level19.json";
import level20 from "./level20.json";
import level21 from "./level21.json";
import level22 from "./level22.json";
import level23 from "./level23.json";
import level24 from "./level24.json";
import level25 from "./level25.json";
import level26 from "./level26.json";
import level27 from "./level27.json";
import level28 from "./level28.json";
import level29 from "./level29.json";
import level30 from "./level30.json";
import level31 from "./level31.json";
import level32 from "./level32.json";
import level33 from "./level33.json";
import level34 from "./level34.json";
import level35 from "./level35.json";
import level36 from "./level36.json";
import level37 from "./level37.json";
import level38 from "./level38.json";
import level39 from "./level39.json";
import level40 from "./level40.json";
import level41 from "./level41.json";
import level42 from "./level42.json";
import level43 from "./level43.json";
import level44 from "./level44.json";
import level45 from "./level45.json";
import level46 from "./level46.json";
import level47 from "./level47.json";
import level48 from "./level48.json";
import level49 from "./level49.json";
import level50 from "./level50.json";

export const LEVELS: LevelData[] = [
  level1, level2, level3, level4, level5,
  level6, level7, level8, level9, level10,
  level11, level12, level13, level14, level15,
  level16, level17, level18, level19, level20,
  level21, level22, level23, level24, level25,
  level26, level27, level28, level29, level30,
  level31, level32, level33, level34, level35,
  level36, level37, level38, level39, level40,
  level41, level42, level43, level44, level45,
  level46, level47, level48, level49, level50,
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
