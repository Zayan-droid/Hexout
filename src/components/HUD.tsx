import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/store/gameStore";
import { AudioManager } from "@/services/audio";

interface HUDProps {
  levelName: string;
  levelId: number;
}

export function HUD({ levelName, levelId }: HUDProps) {
  const tilesLeft = useGameStore((s) => s.tiles.length);
  const moves = useGameStore((s) => s.moves);
  const comboCount = useGameStore((s) => s.comboCount);
  const reset = useGameStore((s) => s.reset);
  const [muted, setMuted] = useState(false);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    AudioManager.setMuted(next);
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "40px 1fr auto",
        alignItems: "center",
        padding: "8px 12px",
        gap: 6,
        position: "relative",
      }}
    >
      <Link to="/levels" className="btn-ghost" aria-label="Back to levels" style={{ padding: "7px 8px", textAlign: "center" }}>
        ←
      </Link>

      <div style={{ textAlign: "center", minWidth: 0, overflow: "hidden" }}>
        <div style={{ fontSize: 10, color: "var(--fg-2)", lineHeight: 1 }}>Level {levelId}</div>
        <div
          style={{
            fontWeight: 700,
            fontSize: 15,
            lineHeight: 1.2,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {levelName}
        </div>
      </div>

      <div style={{ display: "flex", gap: 5, alignItems: "center", flexShrink: 0 }}>
        {/* Compact stats pill */}
        <div
          className="btn-ghost"
          style={{ cursor: "default", padding: "5px 10px", display: "flex", gap: 8, alignItems: "center" }}
        >
          <StatInline label="T" value={tilesLeft} />
          <span style={{ color: "rgba(255,255,255,0.15)", fontSize: 12 }}>|</span>
          <StatInline label="M" value={moves} />
        </div>
        <button className="btn-ghost" onClick={reset} aria-label="Reset" style={{ padding: "7px 9px" }}>
          ↻
        </button>
        <button
          className="btn-ghost"
          onClick={toggleMute}
          aria-label={muted ? "Unmute" : "Mute"}
          style={{ padding: "7px 9px", opacity: muted ? 0.45 : 1, fontSize: 13 }}
        >
          {muted ? "🔇" : "🔊"}
        </button>
      </div>

      {/* Combo badge — floats above HUD */}
      <AnimatePresence>
        {comboCount >= 2 && (
          <motion.div
            key={comboCount}
            initial={{ y: 6, opacity: 0, scale: 0.8 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -6, opacity: 0, scale: 0.85 }}
            transition={{ type: "spring", stiffness: 380, damping: 20 }}
            style={{
              position: "absolute",
              bottom: -28,
              left: "50%",
              transform: "translateX(-50%)",
              background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
              color: "#1a1208",
              fontWeight: 800,
              fontSize: 12,
              padding: "3px 10px",
              borderRadius: 99,
              letterSpacing: "0.08em",
              whiteSpace: "nowrap",
              boxShadow: "0 4px 12px rgba(255,138,61,0.4)",
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

function StatInline({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ textAlign: "center", lineHeight: 1 }}>
      <div style={{ fontSize: 8, color: "var(--fg-2)", letterSpacing: "0.08em" }}>{label}</div>
      <motion.div
        key={value}
        initial={{ scale: 1.3, color: "var(--accent)" }}
        animate={{ scale: 1, color: "var(--fg-0)" }}
        transition={{ duration: 0.22 }}
        style={{ fontWeight: 700, fontSize: 15 }}
      >
        {value}
      </motion.div>
    </div>
  );
}
