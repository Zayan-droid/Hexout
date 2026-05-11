import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { LEVELS } from "@/game/levels";
import { useProgressStore } from "@/store/progressStore";
import { useTheme } from "@/components/ThemeProvider";

const SKILL_LABELS = ["Novice", "Apprentice", "Adept", "Veteran", "Master"];

export default function LevelSelect() {
  const theme = useTheme();
  const { isUnlocked, getProgress, stats } = useProgressStore();

  const accentColor = theme.tiles[0];
  const skillLabel = SKILL_LABELS[Math.floor(stats.skillScore / 20)] ?? "Master";
  const skillPct = stats.skillScore;

  return (
    <div className="app-shell" style={{ display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "clamp(12px, 3vw, 18px) clamp(12px, 4vw, 18px) 10px",
          gap: 10,
          flexWrap: "nowrap",
        }}
      >
        <Link
          to="/"
          className="btn-ghost"
          style={{ padding: "0 14px", flexShrink: 0 }}
        >
          ←
        </Link>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="eyebrow" style={{ fontSize: 10 }}>
            Select a level
          </div>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontWeight: 500,
              fontSize: "clamp(20px, 5vw, 26px)",
              letterSpacing: "-0.01em",
              marginTop: 2,
              color: "var(--fg-primary)",
              fontVariationSettings: '"opsz" 48, "SOFT" 100',
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            Levels
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0, minWidth: 0 }}>
          <div
            style={{
              fontSize: 9,
              color: "var(--fg-muted)",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              fontWeight: 700,
              whiteSpace: "nowrap",
            }}
          >
            {stats.totalLevelsCompleted}/{LEVELS.length} cleared
          </div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: accentColor,
              textShadow: `0 0 14px ${accentColor}55`,
              marginTop: 2,
              whiteSpace: "nowrap",
            }}
          >
            {skillLabel}
          </div>
        </div>
      </div>

      {/* Skill bar */}
      <div style={{ padding: "0 clamp(12px, 4vw, 18px) 18px" }}>
        <div
          style={{
            height: 7,
            borderRadius: 999,
            background: "color-mix(in srgb, var(--fg-muted) 18%, transparent)",
            overflow: "hidden",
            border: "1px solid color-mix(in srgb, var(--fg-muted) 15%, transparent)",
            boxShadow: "inset 0 1px 2px rgba(0,0,0,0.04)",
          }}
        >
          <motion.div
            style={{
              height: "100%",
              borderRadius: 999,
              background: `linear-gradient(90deg, ${accentColor}, ${theme.accent.primary}, ${theme.accent.secondary})`,
              boxShadow: `0 0 14px ${accentColor}66`,
            }}
            animate={{ width: `${skillPct}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Level grid — all levels in one section */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
          padding: "4px clamp(10px, 4vw, 18px) calc(24px + var(--safe-bottom))",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(min(80px, 28vw), 1fr))",
            gap: "clamp(8px, 2.5vw, 14px)",
            maxWidth: 920,
            margin: "0 auto",
          }}
        >
          {LEVELS.map((lvl, i) => {
            const unlocked = isUnlocked(lvl.id);
            const progress = getProgress(lvl.id);
            const stars = progress?.stars ?? 0;
            const completed = progress?.completed;
            const tileColor =
              theme.tiles[(lvl.id - 1) % theme.tiles.length] ?? accentColor;

            return (
              <motion.div
                key={lvl.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.012, 0.6) }}
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
                      padding: "12px 6px",
                      borderRadius: 18,
                      background: completed
                        ? `linear-gradient(160deg, ${tileColor}30, ${tileColor}08 60%, var(--surface-bg))`
                        : "var(--surface-bg)",
                      border: completed
                        ? `1px solid ${tileColor}77`
                        : "1px solid var(--surface-border)",
                      boxShadow: completed
                        ? `0 10px 24px ${tileColor}30, inset 0 1px 0 rgba(255,255,255,0.40)`
                        : "0 4px 14px color-mix(in srgb, var(--fg-muted) 8%, transparent), inset 0 1px 0 rgba(255,255,255,0.40)",
                      backdropFilter: "var(--surface-blur)",
                      WebkitBackdropFilter: "var(--surface-blur)",
                      aspectRatio: "1/1",
                      textDecoration: "none",
                      transition: "transform 0.18s ease, box-shadow 0.22s ease",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "var(--font-display)",
                        fontWeight: 500,
                        fontStyle: completed ? "italic" : "normal",
                        fontSize: "clamp(22px, 6vw, 30px)",
                        letterSpacing: "-0.02em",
                        color: completed ? tileColor : "var(--fg-primary)",
                        textShadow: completed ? `0 0 16px ${tileColor}66` : "none",
                        fontVariationSettings: '"opsz" 48, "SOFT" 100',
                        lineHeight: 1,
                      }}
                    >
                      {lvl.id}
                    </div>
                    <div
                      style={{
                        fontSize: 9,
                        color: "var(--fg-muted)",
                        textAlign: "center",
                        lineHeight: 1.3,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        width: "100%",
                        padding: "0 4px",
                        letterSpacing: "0.05em",
                        fontWeight: 600,
                      }}
                    >
                      {lvl.name ?? `Level ${lvl.id}`}
                    </div>
                    {stars > 0 && (
                      <div style={{ fontSize: 11, letterSpacing: 1.5 }}>
                        {[1, 2, 3].map((n) => (
                          <span
                            key={n}
                            style={{
                              color:
                                n <= stars
                                  ? theme.accent.star
                                  : "color-mix(in srgb, var(--fg-muted) 30%, transparent)",
                              textShadow:
                                n <= stars
                                  ? `0 0 6px ${theme.accent.star}99`
                                  : "none",
                            }}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    )}
                  </Link>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 4,
                      padding: "12px 6px",
                      borderRadius: 18,
                      background: "color-mix(in srgb, var(--fg-muted) 6%, transparent)",
                      border: "1px solid color-mix(in srgb, var(--fg-muted) 12%, transparent)",
                      aspectRatio: "1/1",
                      opacity: 0.5,
                    }}
                  >
                    <div style={{ fontSize: 18, opacity: 0.7 }}>🔒</div>
                    <div
                      style={{
                        fontSize: 10,
                        color: "var(--fg-muted)",
                        fontWeight: 700,
                      }}
                    >
                      {lvl.id}
                    </div>
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
