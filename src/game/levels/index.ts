import type { Difficulty, LevelData } from "@/types";
import { buildGeneratedLevels, buildHardLevels } from "./generator";
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

// Patch legacy levels (1-5) with difficulty + par since they predate Phase 3
const LEGACY_PATCHES: Record<number, { difficulty: Difficulty; par: number }> = {
  1: { difficulty: "beginner", par: 3 },
  2: { difficulty: "beginner", par: 5 },
  3: { difficulty: "easy", par: 7 },
  4: { difficulty: "easy", par: 8 },
  5: { difficulty: "medium", par: 11 },
};

function patch(raw: object): LevelData {
  const l = raw as LevelData;
  const p = LEGACY_PATCHES[l.id];
  return p ? { ...l, ...p } : l;
}

const HAND_CRAFTED: LevelData[] = [
  patch(level1), patch(level2), patch(level3), patch(level4), patch(level5),
  level6 as LevelData, level7 as LevelData, level8 as LevelData,
  level9 as LevelData, level10 as LevelData, level11 as LevelData,
  level12 as LevelData, level13 as LevelData, level14 as LevelData,
  level15 as LevelData,
];

const GENERATED = buildGeneratedLevels(16);
const HARD_GENERATED = buildHardLevels(51);

export const LEVELS: LevelData[] = [...HAND_CRAFTED, ...GENERATED, ...HARD_GENERATED];

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
