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

  // Live star preview (only while playing)
  const previewStars = status === "playing" && moves > 0 && par > 0
    ? calcStars(moves, par)
    : null;

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
      <Link to="/levels" className="btn-ghost" aria-label="Back" style={{ padding: "7px 8px", textAlign: "center" }}>
        ←
      </Link>

      <div style={{ textAlign: "center", minWidth: 0, overflow: "hidden" }}>
        <div style={{ fontSize: 10, color: "var(--fg-2)", lineHeight: 1 }}>
          Level {levelId}{par > 0 ? ` · par ${par}` : ""}
        </div>
        <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.3,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {levelName}
        </div>
        {/* Live star preview */}
        {previewStars !== null && (
          <div style={{ fontSize: 11, letterSpacing: 1, marginTop: 1 }}>
            {[1, 2, 3].map((n) => (
              <span key={n} style={{ color: n <= previewStars ? "#ffd23f" : "rgba(255,255,255,0.2)" }}>★</span>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 5, alignItems: "center", flexShrink: 0 }}>
        <div className="btn-ghost" style={{ cursor: "default", padding: "5px 10px",
          display: "flex", gap: 8, alignItems: "center" }}>
          <StatInline label="T" value={tilesLeft} />
          <span style={{ color: "rgba(255,255,255,0.15)", fontSize: 12 }}>|</span>
          <StatInline label="M" value={moves} />
        </div>
        <button className="btn-ghost" onClick={onReset} aria-label="Reset" style={{ padding: "7px 9px" }}>↻</button>
        <button
          className="btn-ghost"
          onClick={toggleMute}
          aria-label={muted ? "Unmute" : "Mute"}
          style={{ padding: "7px 9px", opacity: muted ? 0.45 : 1, fontSize: 13 }}
        >
          {muted ? "🔇" : "🔊"}
        </button>
      </div>

      {/* Combo badge */}
      <AnimatePresence>
        {comboCount >= 2 && (
          <motion.div
            key={comboCount}
            initial={{ y: 6, opacity: 0, scale: 0.8 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -6, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 20 }}
            style={{
              position: "absolute", bottom: -28, left: "50%", transform: "translateX(-50%)",
              background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
              color: "#1a1208", fontWeight: 800, fontSize: 12,
              padding: "3px 10px", borderRadius: 99, letterSpacing: "0.08em",
              whiteSpace: "nowrap", boxShadow: "0 4px 12px rgba(255,138,61,0.4)",
              pointerEvents: "none", zIndex: 20,
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
