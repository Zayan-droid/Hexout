import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef } from "react";
import type { GameStatus } from "@/types";

interface ResultOverlayProps {
  status: GameStatus;
  moves: number;
  par: number;
  stars: number;
  onReplay: () => void;
  nextLevelId: number | null;
}

export function ResultOverlay({
  status,
  moves,
  par,
  stars,
  onReplay,
  nextLevelId,
}: ResultOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const won = status === "won";

  // Confetti
  useEffect(() => {
    if (status !== "won") {
      cancelAnimationFrame(rafRef.current);
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const W = canvas.width;
    const H = canvas.height;

    const PALETTE = ["#ffd23f", "#ff8a3d", "#4ade80", "#60a5fa", "#c084fc", "#f472b6", "#22d3ee", "#ffffff"];

    interface Confetto {
      x: number; y: number; vx: number; vy: number;
      rot: number; rotV: number; w: number; h: number;
      color: string; alpha: number;
    }

    const pieces: Confetto[] = Array.from({ length: 90 }, () => ({
      x: Math.random() * W,
      y: -10 - Math.random() * 80,
      vx: (Math.random() - 0.5) * 2.5,
      vy: 2 + Math.random() * 3,
      rot: Math.random() * Math.PI * 2,
      rotV: (Math.random() - 0.5) * 0.2,
      w: 6 + Math.random() * 8,
      h: 5 + Math.random() * 6,
      color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
      alpha: 1,
    }));

    let frame = 0;
    const tick = () => {
      ctx.clearRect(0, 0, W, H);
      frame++;
      for (const p of pieces) {
        p.x += p.vx + Math.sin(frame * 0.02 + p.rot) * 0.5;
        p.y += p.vy;
        p.rot += p.rotV;
        p.vy += 0.04;
        if (p.y > H * 0.75) p.alpha -= 0.018;
        if (p.alpha <= 0 || p.y > H + 20) continue;
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      if (pieces.some((p) => p.alpha > 0 && p.y < H + 20)) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [status]);

  return (
    <AnimatePresence>
      {status !== "playing" && (
        <motion.div
          key="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(8,10,15,0.72)",
            backdropFilter: "blur(7px)",
            zIndex: 10,
          }}
        >
          {won && (
            <canvas
              ref={canvasRef}
              width={400} height={700}
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
            />
          )}

          <motion.div
            initial={{ y: 24, opacity: 0, scale: 0.94 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 220, damping: 20, delay: 0.06 }}
            style={{
              background: "var(--bg-1)",
              padding: "24px 24px 20px",
              borderRadius: 22,
              border: "1px solid rgba(255,255,255,0.09)",
              minWidth: 280,
              textAlign: "center",
              boxShadow: "0 30px 80px rgba(0,0,0,0.55)",
              position: "relative",
              zIndex: 1,
            }}
          >
            {won && (
              <motion.div
                style={{
                  position: "absolute", inset: -2, borderRadius: 24,
                  border: "2px solid var(--success)", zIndex: -1,
                }}
                animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.02, 1] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              />
            )}

            <div style={{ fontSize: 12, letterSpacing: "0.18em", fontWeight: 700, color: won ? "var(--success)" : "var(--danger)" }}>
              {won ? "CLEARED" : "STUCK"}
            </div>

            <motion.div
              style={{
                fontSize: 32, fontWeight: 800, margin: "4px 0 8px",
                background: won ? "linear-gradient(180deg,#fff,var(--success))" : "linear-gradient(180deg,#fff,var(--danger))",
                WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent",
              }}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 16, delay: 0.15 }}
            >
              {won ? "Level complete!" : "No moves left"}
            </motion.div>

            {/* Star display */}
            {won && <StarRow stars={stars} />}

            <div style={{ color: "var(--fg-2)", marginBottom: 4, fontSize: 13 }}>
              {moves} {moves === 1 ? "move" : "moves"}
              {par > 0 && (
                <span style={{ color: stars === 3 ? "var(--success)" : "var(--fg-2)", marginLeft: 6 }}>
                  (par {par})
                </span>
              )}
            </div>

            <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginTop: 16 }}>
              <button className="btn-ghost" onClick={onReplay}>Replay</button>
              <Link to="/levels" className="btn-ghost">Levels</Link>
              {won && nextLevelId !== null && (
                <Link to={`/play/${nextLevelId}`} className="btn-primary">Next →</Link>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function StarRow({ stars }: { stars: number }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", gap: 6, margin: "8px 0 10px" }}>
      {[1, 2, 3].map((n) => (
        <motion.div
          key={n}
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 18, delay: 0.2 + n * 0.1 }}
          style={{ fontSize: 28, filter: n <= stars ? "drop-shadow(0 0 6px #ffd23f)" : "none" }}
        >
          {n <= stars ? "★" : "☆"}
        </motion.div>
      ))}
    </div>
  );
}
