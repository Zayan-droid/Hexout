import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PowerUpEffect, PowerUpId } from "@/types/powerup";
import { POWER_UPS } from "@/types/powerup";

interface PowerUpState {
  /** Per-power-up charge count (∞ for now, but persisted for future economy). */
  inventory: Record<PowerUpId, number>;

  /** Currently armed power-up — clicks on the board route through it. */
  active: PowerUpId | null;

  /** Tile IDs the player has already picked for this multi-pick power-up. */
  picks: string[];

  /** Most recent effect — visual layer subscribes and animates this once. */
  lastEffect: PowerUpEffect | null;

  /** Per-level usage count, used by HUD to nudge "go light on power-ups for stars". */
  usedThisLevel: number;

  arm: (id: PowerUpId) => void;
  disarm: () => void;
  registerPick: (tileId: string) => string[];
  fireEffect: (e: PowerUpEffect) => void;
  consume: (id: PowerUpId) => void;
  grant: (id: PowerUpId, count: number) => void;
  resetForLevel: () => void;
}

const STARTING: Record<PowerUpId, number> = {
  hammer: 0,
  swap: 3,
  colorClear: 0,
  shuffle: 0,
  lineBlast: 0,
  undo: 3,
  bomb: 1,
};

export const usePowerUpStore = create<PowerUpState>()(
  persist(
    (set, get) => ({
      inventory: { ...STARTING },
      active: null,
      picks: [],
      lastEffect: null,
      usedThisLevel: 0,

      arm: (id) => {
        const inv = get().inventory[id] ?? 0;
        if (inv <= 0) return;
        // Toggle: arming the same one disarms.
        if (get().active === id) {
          set({ active: null, picks: [] });
          return;
        }
        set({ active: id, picks: [] });
      },

      disarm: () => set({ active: null, picks: [] }),

      registerPick: (tileId) => {
        const next = [...get().picks, tileId];
        set({ picks: next });
        return next;
      },

      fireEffect: (e) => set({ lastEffect: e }),

      consume: (id) =>
        set((s) => ({
          inventory: { ...s.inventory, [id]: Math.max(0, (s.inventory[id] ?? 0) - 1) },
          active: null,
          picks: [],
          usedThisLevel: s.usedThisLevel + 1,
        })),

      grant: (id, count) =>
        set((s) => ({
          inventory: { ...s.inventory, [id]: (s.inventory[id] ?? 0) + count },
        })),

      resetForLevel: () => set({ active: null, picks: [], usedThisLevel: 0 }),
    }),
    {
      name: "hexout-powerups",
      version: 2,
      migrate: () => ({ inventory: { ...STARTING } }),
      partialize: (s) => ({ inventory: s.inventory }),
    }
  )
);

export function powerUpDef(id: PowerUpId) {
  return POWER_UPS[id];
}
