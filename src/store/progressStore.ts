import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { LevelProgress, PlayerStats } from "@/types";

// How many moves above par still earns 2 stars (50% slack)
const TWO_STAR_MULTIPLIER = 1.5;

export function calcStars(moves: number, par: number): number {
  if (moves <= par) return 3;
  if (moves <= Math.ceil(par * TWO_STAR_MULTIPLIER)) return 2;
  return 1;
}

interface ProgressState {
  levelProgress: Record<number, LevelProgress>;
  stats: PlayerStats;

  // Returns new stars earned (0 if no improvement)
  recordCompletion: (levelId: number, moves: number, par: number) => number;
  recordInvalidMove: () => void;
  recordRetry: () => void;
  isUnlocked: (levelId: number) => boolean;
  getProgress: (levelId: number) => LevelProgress | undefined;
  resetAll: () => void;
}

const DEFAULT_STATS: PlayerStats = {
  skillScore: 30,
  totalLevelsCompleted: 0,
  invalidMoves: 0,
  totalRetries: 0,
};

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      levelProgress: {},
      stats: { ...DEFAULT_STATS },

      recordCompletion: (levelId, moves, par) => {
        const existing = get().levelProgress[levelId];
        const newStars = calcStars(moves, par);
        const prevStars = existing?.stars ?? 0;
        const prevBest = existing?.bestMoves ?? Infinity;
        const improved = newStars > prevStars || moves < prevBest;

        if (improved || !existing?.completed) {
          set((s) => ({
            levelProgress: {
              ...s.levelProgress,
              [levelId]: {
                completed: true,
                stars: Math.max(newStars, prevStars),
                bestMoves: Math.min(moves, prevBest === Infinity ? moves : prevBest),
              },
            },
          }));
        }

        // Update skill score: reward clean play, penalise extra moves
        const efficiency = Math.min(1, par / moves);
        const delta = (efficiency - 0.5) * 6; // -3 to +3
        set((s) => ({
          stats: {
            ...s.stats,
            skillScore: Math.max(0, Math.min(100, s.stats.skillScore + delta)),
            totalLevelsCompleted: existing?.completed
              ? s.stats.totalLevelsCompleted
              : s.stats.totalLevelsCompleted + 1,
          },
        }));

        return improved ? newStars - prevStars : 0;
      },

      recordInvalidMove: () =>
        set((s) => ({
          stats: {
            ...s.stats,
            skillScore: Math.max(0, s.stats.skillScore - 0.5),
            invalidMoves: s.stats.invalidMoves + 1,
          },
        })),

      recordRetry: () =>
        set((s) => ({
          stats: {
            ...s.stats,
            skillScore: Math.max(0, s.stats.skillScore - 1),
            totalRetries: s.stats.totalRetries + 1,
          },
        })),

      isUnlocked: (levelId) => {
        return true; // all levels unlocked for testing
      },

      getProgress: (levelId) => get().levelProgress[levelId],

      resetAll: () =>
        set({ levelProgress: {}, stats: { ...DEFAULT_STATS } }),
    }),
    { name: "hexout-progress" }
  )
);
