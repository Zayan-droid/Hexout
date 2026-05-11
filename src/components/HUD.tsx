import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/store/gameStore";
import { calcStars } from "@/store/progressStore";
import { AudioManager } from "@/services/audio";

interface HUDProps {
  levelName: string;
  levelId: number;
  par: number;
  onReset: () => void;
}

export function HUD({ levelName, levelId, par, onReset }: HUDProps) {
  const tilesLeft = useGameStore((s) => s.tiles.length);
  const moves = useGameStore((s) => s.moves);
  const comboCount = useGameStore((s) => s.comboCount);
  const status = useGameStore((s) => s.status);
  const [muted, setMuted] = useState(false);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    AudioManager.setMuted(next);
  };

  const previewStars =
    status === "playing" && moves > 0 && par > 0 ? calcStars(moves, par) : null;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "auto minmax(0, 1fr) auto",
        alignItems: "center",
        padding: "clamp(10px, 2.5vw, 16px) clamp(10px, 4vw, 18px) 10px",
        gap: "clamp(6px, 1.5vw, 10px)",
        position: "relative",
        zIndex: 2,
      }}
    >
      <Link
        to="/levels"
        className="btn-ghost"
        aria-label="Back"
        style={{ padding: "0 14px", fontSize: 14, flexShrink: 0 }}
      >
        ←
      </Link>

      <div style={{ textAlign: "center", minWidth: 0, overflow: "hidden" }}>
        <div className="eyebrow" style={{ fontSize: 9 }}>
          Level {levelId}
          {par > 0 ? <span style={{ color: "var(--fg-muted)" }}>  ·  par {par}</span> : null}
        </div>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 500,
            fontStyle: "italic",
            fontSize: "clamp(15px, 4.2vw, 20px)",
            lineHeight: 1.3,
            marginTop: 3,
            color: "var(--fg-primary)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontVariationSettings: '"opsz" 36, "SOFT" 100',
          }}
        >
          {levelName}
        </div>
        {/* Inline stats — fit on narrow screens */}
        <div
          style={{
            marginTop: 4,
            display: "inline-flex",
            gap: 10,
            alignItems: "center",
            justifyContent: "center",
            padding: "4px 12px",
            borderRadius: 999,
            background: "var(--surface-bg)",
            border: "1px solid var(--surface-border)",
            backdropFilter: "var(--surface-blur)",
            WebkitBackdropFilter: "var(--surface-blur)",
            maxWidth: "100%",
          }}
        >
          <StatInline label="TILES" value={tilesLeft} accent="var(--accent-primary)" />
          <span style={{ color: "var(--fg-muted)", opacity: 0.4, fontSize: 14 }}>·</span>
          <StatInline label="MOVES" value={moves} accent="var(--accent-secondary)" />
        </div>
        {previewStars !== null && (
          <div style={{ fontSize: 11, letterSpacing: 2, marginTop: 2 }}>
            {[1, 2, 3].map((n) => (
              <span
                key={n}
                style={{
                  color: n <= previewStars ? "var(--accent-star)" : "color-mix(in srgb, var(--fg-muted) 50%, transparent)",
                  textShadow:
                    n <= previewStars ? "0 0 8px color-mix(in srgb, var(--accent-star) 70%, transparent)" : "none",
                }}
              >
                ★
              </span>
            ))}
          </div>
        )}
      </div>

      <div
        style={{
          display: "flex",
          gap: 6,
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        <button
          className="btn-ghost"
          onClick={onReset}
          aria-label="Reset"
          style={{ padding: "0 12px" }}
        >
          ↻
        </button>
        <button
          className="btn-ghost"
          onClick={toggleMute}
          aria-label={muted ? "Unmute" : "Mute"}
          style={{
            padding: "0 12px",
            opacity: muted ? 0.55 : 1,
            fontSize: 13,
          }}
        >
          {muted ? "🔇" : "🔊"}
        </button>
      </div>

      <AnimatePresence>
        {comboCount >= 2 && (
          <motion.div
            key={comboCount}
            initial={{ y: 6, opacity: 0, scale: 0.85 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -6, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 20 }}
            style={{
              position: "absolute",
              bottom: -28,
              left: "50%",
              transform: "translateX(-50%)",
              background:
                "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))",
              color: "var(--fg-on-accent)",
              fontWeight: 800,
              fontSize: 11,
              padding: "6px 16px",
              borderRadius: 999,
              letterSpacing: "0.20em",
              whiteSpace: "nowrap",
              boxShadow:
                "0 10px 24px color-mix(in srgb, var(--accent-primary) 45%, transparent), 0 0 0 1px rgba(255,255,255,0.20) inset, 0 1px 0 rgba(255,255,255,0.55) inset",
              pointerEvents: "none",
              zIndex: 20,
            }}
          >
            {comboCount}× COMBO
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatInline({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div style={{ textAlign: "center", lineHeight: 1, minWidth: 32 }}>
      <div
        style={{
          fontSize: 8,
          color: "var(--fg-muted)",
          letterSpacing: "0.16em",
          fontWeight: 700,
        }}
      >
        {label}
      </div>
      <motion.div
        key={value}
        initial={{ scale: 1.4, color: accent }}
        animate={{ scale: 1, color: "var(--fg-primary)" }}
        transition={{ duration: 0.28 }}
        style={{ fontWeight: 700, fontSize: 15, marginTop: 2 }}
      >
        {value}
      </motion.div>
    </div>
  );
}
