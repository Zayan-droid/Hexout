import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { LEVELS_BY_DIFFICULTY } from "@/game/levels";
import { useProgressStore } from "@/store/progressStore";
import type { Difficulty } from "@/types";

const TABS: { key: Difficulty; label: string; color: string }[] = [
  { key: "beginner", label: "Beginner", color: "#4ade80" },
  { key: "easy",     label: "Easy",     color: "#60a5fa" },
  { key: "medium",   label: "Medium",   color: "#ffd23f" },
  { key: "hard",     label: "Hard",     color: "#ff8a3d" },
  { key: "expert",   label: "Expert",   color: "#c084fc" },
];

const SKILL_LABELS = ["Novice", "Apprentice", "Adept", "Veteran", "Master"];

export default function LevelSelect() {
  const [activeTab, setActiveTab] = useState<Difficulty>("beginner");
  const { isUnlocked, getProgress, stats } = useProgressStore();

  const levels = LEVELS_BY_DIFFICULTY[activeTab] ?? [];
  const tab = TABS.find((t) => t.key === activeTab)!;
  const skillLabel = SKILL_LABELS[Math.floor(stats.skillScore / 20)] ?? "Master";
  const skillPct = stats.skillScore;

  return (
    <div className="app-shell" style={{ display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", padding: "10px 14px", gap: 8 }}>
        <Link to="/" className="btn-ghost" style={{ padding: "7px 10px" }}>←</Link>
        <div style={{ flex: 1, fontWeight: 700, fontSize: 17 }}>Levels</div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 10, color: "var(--fg-2)" }}>
            {stats.totalLevelsCompleted} cleared
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: tab.color }}>{skillLabel}</div>
        </div>
      </div>

      {/* Skill bar */}
      <div style={{ padding: "0 14px 10px" }}>
        <div style={{ height: 4, borderRadius: 4, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
          <motion.div
            style={{ height: "100%", borderRadius: 4, background: `linear-gradient(90deg, ${tab.color}, var(--accent))` }}
            animate={{ width: `${skillPct}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Difficulty tabs */}
      <div style={{ display: "flex", gap: 6, padding: "0 12px 10px", overflowX: "auto" }}>
        {TABS.map((t) => {
          const count = LEVELS_BY_DIFFICULTY[t.key]?.length ?? 0;
          const done = LEVELS_BY_DIFFICULTY[t.key]?.filter((l) => getProgress(l.id)?.completed).length ?? 0;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              style={{
                flexShrink: 0,
                padding: "6px 12px",
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 600,
                background: activeTab === t.key ? t.color : "rgba(255,255,255,0.05)",
                color: activeTab === t.key ? "#111" : "var(--fg-2)",
                border: activeTab === t.key ? "none" : "1px solid rgba(255,255,255,0.08)",
                transition: "all 0.18s",
              }}
            >
              {t.label}
              <span style={{ marginLeft: 5, opacity: 0.7, fontSize: 10 }}>{done}/{count}</span>
            </button>
          );
        })}
      </div>

      {/* Level grid */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 12px 20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))", gap: 10 }}>
          {levels.map((lvl, i) => {
            const unlocked = isUnlocked(lvl.id);
            const progress = getProgress(lvl.id);
            const stars = progress?.stars ?? 0;

            return (
              <motion.div
                key={lvl.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                {unlocked ? (
                  <Link
                    to={`/play/${lvl.id}`}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 4,
                      padding: "10px 6px",
                      borderRadius: 14,
                      background: progress?.completed
                        ? `linear-gradient(160deg, ${tab.color}18, ${tab.color}08)`
                        : "rgba(255,255,255,0.03)",
                      border: progress?.completed
                        ? `1px solid ${tab.color}44`
                        : "1px solid rgba(255,255,255,0.07)",
                      aspectRatio: "1/1",
                      textDecoration: "none",
                    }}
                  >
                    <div style={{ fontSize: 22, fontWeight: 800, color: tab.color }}>{lvl.id}</div>
                    <div style={{ fontSize: 9, color: "var(--fg-2)", textAlign: "center", lineHeight: 1.3,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "100%" }}>
                      {lvl.name ?? `Level ${lvl.id}`}
                    </div>
                    {stars > 0 && (
                      <div style={{ fontSize: 11, letterSpacing: 1 }}>
                        {[1, 2, 3].map((n) => (
                          <span key={n} style={{ color: n <= stars ? "#ffd23f" : "rgba(255,255,255,0.15)" }}>★</span>
                        ))}
                      </div>
                    )}
                  </Link>
                ) : (
                  <div
                    style={{
                      display: "flex", flexDirection: "column", alignItems: "center",
                      justifyContent: "center", gap: 4, padding: "10px 6px",
                      borderRadius: 14, background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.05)",
                      aspectRatio: "1/1", opacity: 0.35,
                    }}
                  >
                    <div style={{ fontSize: 20 }}>🔒</div>
                    <div style={{ fontSize: 9, color: "var(--fg-2)" }}>{lvl.id}</div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
