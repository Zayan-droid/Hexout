import { useGameStore, tileLinePath, tilesInBombRadius } from "@/store/gameStore";
import { usePowerUpStore } from "@/store/powerupStore";
import { AudioManager } from "@/services/audio";
import type { PowerUpId } from "@/types/powerup";

/**
 * Routes a tile-click while a power-up is armed.
 * Returns true if the click was consumed by a power-up (so normal move logic should bail).
 */
export function routeTileClick(tileId: string): boolean {
  const pu = usePowerUpStore.getState();
  const active = pu.active;
  if (!active) return false;

  const game = useGameStore.getState();
  const tile = game.tiles.find((t) => t.id === tileId);
  if (!tile) return false;

  switch (active) {
    case "hammer": {
      pu.fireEffect({ kind: "hammer", tile, at: performance.now() });
      AudioManager.hammerCharge();
      // Pop animation runs ~280ms, then we actually remove
      setTimeout(() => {
        useGameStore.getState().removeTiles([tile.id]);
        AudioManager.hammerHit();
      }, 280);
      pu.consume("hammer");
      return true;
    }

    case "swap": {
      const picks = pu.registerPick(tileId);
      if (picks.length === 1) {
        AudioManager.powerupTick();
        return true;
      }
      if (picks.length >= 2) {
        const [aId, bId] = picks;
        const a = game.tiles.find((t) => t.id === aId);
        const b = game.tiles.find((t) => t.id === bId);
        if (a && b && a.id !== b.id) {
          pu.fireEffect({ kind: "swap", a, b, at: performance.now() });
          AudioManager.swapShimmer();
          // Swap immediately so TileView animates from old → new position
          useGameStore.getState().swapTiles(a.id, b.id);
        }
        pu.consume("swap");
      }
      return true;
    }

    case "colorClear": {
      const color = tile.color;
      const matches = game.tiles.filter((t) => t.color === color);
      pu.fireEffect({ kind: "colorClear", color, tiles: matches, at: performance.now() });
      AudioManager.colorWave();
      // Stagger the dissolve a little behind the pulse
      setTimeout(() => {
        useGameStore.getState().removeTiles(matches.map((t) => t.id));
      }, 460);
      pu.consume("colorClear");
      return true;
    }

    case "lineBlast": {
      const { path, clearedAlong } = tileLinePath(tile, game.gridRadius);
      pu.fireEffect({
        kind: "lineBlast",
        from: tile,
        path,
        cleared: game.tiles.filter((t) => clearedAlong.includes(t.id)),
        at: performance.now(),
      });
      AudioManager.lineBlast();
      // Tiles fall sequentially as the beam sweeps
      const stepMs = 70;
      clearedAlong.forEach((id, i) => {
        setTimeout(() => useGameStore.getState().removeTiles([id], i === clearedAlong.length - 1), 180 + i * stepMs);
      });
      pu.consume("lineBlast");
      return true;
    }

    case "bomb": {
      const cleared = tilesInBombRadius(tile);
      pu.fireEffect({ kind: "bomb", center: tile, cleared, at: performance.now() });
      AudioManager.bombCharge();
      setTimeout(() => AudioManager.bombBoom(), 380);
      setTimeout(() => {
        useGameStore.getState().removeTiles([tile.id, ...cleared.map((t) => t.id)]);
      }, 440);
      pu.consume("bomb");
      return true;
    }

    default:
      return false;
  }
}

/** Power-ups that don't need a tile target — invoked directly from the bar. */
export function fireInstantPowerUp(id: PowerUpId): boolean {
  const pu = usePowerUpStore.getState();
  const inv = pu.inventory[id] ?? 0;
  if (inv <= 0) return false;

  if (id === "shuffle") {
    const { before, after } = useGameStore.getState().shuffleTiles();
    pu.fireEffect({ kind: "shuffle", before, after, at: performance.now() });
    AudioManager.shuffleLift();
    pu.consume("shuffle");
    return true;
  }
  if (id === "undo") {
    const restored = useGameStore.getState().undoLast();
    if (!restored) return false;
    pu.fireEffect({ kind: "undo", restored, at: performance.now() });
    AudioManager.rewindChime();
    pu.consume("undo");
    return true;
  }
  return false;
}
