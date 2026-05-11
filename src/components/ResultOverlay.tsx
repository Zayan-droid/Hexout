import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef } from "react";
import type { GameStatus } from "@/types";
import { useTheme } from "./ThemeProvider";

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
  const theme = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const won = status === "won";

  useEffect(() => {
    if (status !== "won") {
      cancelAnimationFrame(rafRef.current);
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    // Size the confetti canvas to the parent overlay (handles all viewports)
    const parent = canvas.parentElement;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cssW = parent?.clientWidth ?? window.innerWidth;
    const cssH = parent?.clientHeight ?? window.innerHeight;
    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);
    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const W = cssW;
    const H = cssH;

    const PALETTE = [...theme.tiles, "#FFFFFF"];

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
        ctx.beginPath();
        const r = Math.min(p.w, p.h) * 0.4;
        roundRect(ctx, -p.w / 2, -p.h / 2, p.w, p.h, r);
        ctx.fill();
        ctx.restore();
      }
      if (pieces.some((p) => p.alpha > 0 && p.y < H + 20)) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [status, theme.tiles]);

  return (
    <AnimatePresence>
      {status !== "playing" && (
        <motion.div
          key="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "color-mix(in srgb, var(--bg-base) 70%, transparent)",
            backdropFilter: "blur(14px) saturate(120%)",
            WebkitBackdropFilter: "blur(14px) saturate(120%)",
            zIndex: 10,
          }}
        >
          {won && (
            <canvas
              ref={canvasRef}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                pointerEvents: "none",
              }}
            />
          )}

          <motion.div
            initial={{ y: 30, opacity: 0, scale: 0.94 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 220, damping: 20, delay: 0.06 }}
            className="surface-raised"
            style={{
              padding: "clamp(22px, 5vw, 34px) clamp(20px, 5vw, 32px) clamp(20px, 4vw, 26px)",
              width: "min(380px, calc(100vw - 32px))",
              maxWidth: "calc(100vw - 24px)",
              maxHeight: "calc(100dvh - 32px)",
              textAlign: "center",
              position: "relative",
              zIndex: 1,
              overflow: "hidden",
            }}
          >
            {/* Soft accent glow behind the modal */}
            <div
              style={{
                position: "absolute",
                inset: -40,
                background: won
                  ? `radial-gradient(circle at 50% 0%, color-mix(in srgb, ${theme.accent.primary} 35%, transparent), transparent 60%)`
                  : `radial-gradient(circle at 50% 0%, color-mix(in srgb, ${theme.accent.danger} 25%, transparent), transparent 60%)`,
                pointerEvents: "none",
                zIndex: -1,
              }}
            />

            {won && (
              <motion.div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: 28,
                  border: `1.5px solid ${theme.accent.primary}`,
                  zIndex: -1,
                  pointerEvents: "none",
                }}
                animate={{ opacity: [0.3, 0.85, 0.3], scale: [1, 1.012, 1] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
              />
            )}

            <div
              style={{
                fontSize: 10,
                letterSpacing: "0.32em",
                fontWeight: 700,
                color: won ? theme.accent.primary : theme.accent.danger,
                textTransform: "uppercase",
              }}
            >
              {won ? "Cleared" : "Stuck"}
            </div>

            <motion.div
              style={{
                fontFamily: "var(--font-display)",
                fontStyle: "italic",
                fontSize: "clamp(24px, 6vw, 32px)",
                fontWeight: 500,
                letterSpacing: "-0.02em",
                margin: "10px 0 14px",
                color: "var(--fg-primary)",
                fontVariationSettings: '"opsz" 144, "SOFT" 100',
              }}
              initial={{ scale: 0.88 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 16, delay: 0.15 }}
            >
              {won ? "Level complete" : "No moves left"}
            </motion.div>

            {won && <StarRow stars={stars} starColor={theme.accent.star} />}

            <div
              style={{
                color: "var(--fg-secondary)",
                marginBottom: 4,
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              <span style={{ color: "var(--fg-primary)", fontWeight: 700 }}>{moves}</span>{" "}
              {moves === 1 ? "move" : "moves"}
              {par > 0 && (
                <span
                  style={{
                    color: stars === 3 ? theme.accent.primary : "var(--fg-muted)",
                    marginLeft: 6,
                  }}
                >
                  · par {par}
                </span>
              )}
            </div>

            <div
              style={{
                display: "flex",
                gap: 8,
                justifyContent: "center",
                flexWrap: "wrap",
                marginTop: 22,
              }}
            >
              <button className="btn-ghost" onClick={onReplay}>
                Replay
              </button>
              <Link to="/levels" className="btn-ghost">
                Levels
              </Link>
              {won && nextLevelId !== null && (
                <Link to={`/play/${nextLevelId}`} className="btn-primary">
                  Next →
                </Link>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function StarRow({ stars, starColor }: { stars: number; starColor: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        gap: 8,
        margin: "10px 0 14px",
      }}
    >
      {[1, 2, 3].map((n) => (
        <motion.div
          key={n}
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            type: "spring",
            stiffness: 380,
            damping: 18,
            delay: 0.2 + n * 0.1,
          }}
          style={{
            fontSize: 34,
            lineHeight: 1,
            color: n <= stars ? starColor : "color-mix(in srgb, var(--fg-muted) 35%, transparent)",
            filter:
              n <= stars
                ? `drop-shadow(0 0 14px ${starColor}AA)`
                : "none",
          }}
        >
          {n <= stars ? "★" : "☆"}
        </motion.div>
      ))}
    </div>
  );
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
