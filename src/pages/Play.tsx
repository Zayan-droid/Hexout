import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { GameBoard } from "@/components/GameBoard";
import { HUD } from "@/components/HUD";
import { ResultOverlay } from "@/components/ResultOverlay";
import { useGameStore } from "@/store/gameStore";
import { LEVELS, getLevelById } from "@/game/levels";
import { useElementSize } from "@/hooks/useElementSize";

export default function Play() {
  const { levelId } = useParams<{ levelId: string }>();
  const navigate = useNavigate();
  const loadLevel = useGameStore((s) => s.loadLevel);
  const reset = useGameStore((s) => s.reset);
  const status = useGameStore((s) => s.status);
  const moves = useGameStore((s) => s.moves);

  const { ref, width, height } = useElementSize<HTMLDivElement>();

  useEffect(() => {
    const lvl = getLevelById(levelId ?? "1");
    if (!lvl) {
      navigate("/levels", { replace: true });
      return;
    }
    loadLevel(lvl);
  }, [levelId, loadLevel, navigate]);

  const level = getLevelById(levelId ?? "1");
  if (!level) return null;

  const idx = LEVELS.findIndex((l) => l.id === level.id);
  const nextLevel = idx >= 0 && idx < LEVELS.length - 1 ? LEVELS[idx + 1] : null;

  return (
    <div className="app-shell">
      <HUD levelName={level.name ?? `Level ${level.id}`} levelId={level.id} />
      <div
        ref={ref}
        style={{
          flex: 1,
          position: "relative",
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        {width > 0 && height > 0 && (
          <GameBoard width={width} height={height} />
        )}
        <ResultOverlay
          status={status}
          moves={moves}
          onReplay={reset}
          nextLevelId={nextLevel?.id ?? null}
        />
      </div>
    </div>
  );
}
