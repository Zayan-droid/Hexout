import { useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { GameBoard } from "@/components/GameBoard";
import { HUD } from "@/components/HUD";
import { ResultOverlay } from "@/components/ResultOverlay";
import { PowerUpBar } from "@/components/powerups/PowerUpBar";
import { useGameStore } from "@/store/gameStore";
import { useProgressStore, calcStars } from "@/store/progressStore";
import { LEVELS, getLevelById } from "@/game/levels";
import { useElementSize } from "@/hooks/useElementSize";

export default function Play() {
  const { levelId } = useParams<{ levelId: string }>();
  const navigate = useNavigate();
  const loadLevel = useGameStore((s) => s.loadLevel);
  const reset = useGameStore((s) => s.reset);
  const status = useGameStore((s) => s.status);
  const moves = useGameStore((s) => s.moves);

  const { recordCompletion, recordRetry, isUnlocked } = useProgressStore();
  const hasRecorded = useRef(false);

  const { ref, width, height } = useElementSize<HTMLDivElement>();

  const level = getLevelById(levelId ?? "1");

  useEffect(() => {
    if (!level) { navigate("/levels", { replace: true }); return; }
    if (!isUnlocked(level.id)) { navigate("/levels", { replace: true }); return; }
    loadLevel(level);
    hasRecorded.current = false;
  }, [levelId, level, loadLevel, navigate, isUnlocked]);

  // Record win once
  useEffect(() => {
    if (status === "won" && level && !hasRecorded.current) {
      hasRecorded.current = true;
      recordCompletion(level.id, moves, level.par ?? moves);
    }
  }, [status, level, moves, recordCompletion]);

  const handleReset = () => {
    recordRetry();
    reset();
  };

  if (!level) return null;

  const idx = LEVELS.findIndex((l) => l.id === level.id);
  const nextLevel = idx >= 0 && idx < LEVELS.length - 1 ? LEVELS[idx + 1] : null;
  const nextUnlocked = nextLevel ? isUnlocked(nextLevel.id) || status === "won" : false;
  const par = level.par ?? 0;
  const stars = status === "won" ? calcStars(moves, par) : 0;

  return (
    <div className="app-shell">
      <HUD
        levelName={level.name ?? `Level ${level.id}`}
        levelId={level.id}
        par={par}
        onReset={handleReset}
      />
      <div ref={ref} style={{ flex: 1, position: "relative", minHeight: 0, overflow: "hidden" }}>
        {width > 0 && height > 0 && <GameBoard width={width} height={height} />}
        <ResultOverlay
          status={status}
          moves={moves}
          par={par}
          stars={stars}
          onReplay={handleReset}
          nextLevelId={nextUnlocked && nextLevel ? nextLevel.id : null}
        />
      </div>
      <PowerUpBar />
    </div>
  );
}
