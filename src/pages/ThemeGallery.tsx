import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { THEMES } from "@/themes";
import { useThemeStore } from "@/store/themeStore";
import { AudioManager } from "@/services/audio";
import type { ThemeTokens } from "@/types/theme";
import { useState } from "react";

export default function ThemeGallery() {
  const themeId = useThemeStore((s) => s.themeId);
  const setTheme = useThemeStore((s) => s.setTheme);
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div className="app-shell" style={{ display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "clamp(12px, 3vw, 18px) clamp(12px, 4vw, 18px) 10px",
          gap: 12,
          position: "relative",
          zIndex: 2,
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
            Your aesthetic
          </div>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontWeight: 500,
              fontSize: "clamp(22px, 5vw, 28px)",
              letterSpacing: "-0.01em",
              marginTop: 2,
              color: "var(--fg-primary)",
              fontVariationSettings: '"opsz" 48, "SOFT" 100',
            }}
          >
            Themes
          </div>
        </div>
      </div>

      {/* Gallery body */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
          padding: "8px clamp(12px, 4vw, 20px) calc(32px + var(--safe-bottom))",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "clamp(12px, 3vw, 18px)",
            maxWidth: 720,
            margin: "0 auto",
          }}
        >
          {THEMES.map((t, i) => {
            const active = t.id === themeId;
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.45, ease: "easeOut" }}
                onMouseEnter={() => setHovered(t.id)}
                onMouseLeave={() => setHovered(null)}
              >
                <ThemeCard
                  theme={t}
                  active={active}
                  hovered={hovered === t.id}
                  onSelect={() => {
                    if (t.id === themeId) return;
                    setTheme(t.id);
                    AudioManager.clear();
                  }}
                />
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{
            textAlign: "center",
            marginTop: 28,
            fontSize: 12,
            color: "var(--fg-muted)",
            fontStyle: "italic",
            fontFamily: "var(--font-display)",
            fontVariationSettings: '"opsz" 14, "SOFT" 100',
          }}
        >
          More themes simmering in the kitchen — stay cozy.
        </motion.div>
      </div>
    </div>
  );
}

function ThemeCard({
  theme,
  active,
  hovered,
  onSelect,
}: {
  theme: ThemeTokens;
  active: boolean;
  hovered: boolean;
  onSelect: () => void;
}) {
  return (
    <motion.button
      onClick={onSelect}
      whileTap={{ scale: 0.985 }}
      style={{
        textAlign: "left",
        width: "100%",
        padding: 0,
        borderRadius: 28,
        background: theme.board.fill,
        border: active
          ? `2px solid ${theme.accent.primary}`
          : "1px solid color-mix(in srgb, var(--fg-muted) 18%, transparent)",
        boxShadow: active
          ? `0 24px 60px ${theme.accent.primary}44, 0 4px 12px ${theme.accent.primary}33, inset 0 1px 0 rgba(255,255,255,0.55)`
          : hovered
          ? `0 18px 40px ${theme.accent.primary}30, inset 0 1px 0 rgba(255,255,255,0.45)`
          : `0 10px 24px ${theme.accent.primary}1A, inset 0 1px 0 rgba(255,255,255,0.40)`,
        overflow: "hidden",
        position: "relative",
        cursor: "pointer",
        transition: "box-shadow 0.35s ease, border-color 0.35s ease, transform 0.18s ease",
        transform: hovered && !active ? "translateY(-2px)" : "translateY(0)",
      }}
    >
      {/* Soft inner gradient overlay for depth */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 26,
          background:
            "linear-gradient(160deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0) 45%, rgba(0,0,0,0.04) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Active indicator */}
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 22 }}
            style={{
              position: "absolute",
              top: 14,
              right: 14,
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${theme.accent.primary}, ${theme.accent.secondary})`,
              boxShadow: `0 8px 20px ${theme.accent.primary}66, inset 0 1px 0 rgba(255,255,255,0.5)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: theme.fg.onAccent,
              fontWeight: 800,
              fontSize: 16,
              zIndex: 2,
            }}
          >
            ✓
          </motion.div>
        )}
      </AnimatePresence>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) auto",
          alignItems: "stretch",
          gap: "clamp(10px, 3vw, 16px)",
          padding: "clamp(16px, 4vw, 22px)",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Left — text + palette */}
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 9,
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              fontWeight: 700,
              color: theme.fg.muted,
              marginBottom: 6,
            }}
          >
            {theme.mood.join(" · ")}
          </div>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 500,
              fontStyle: "italic",
              fontSize: "clamp(22px, 6vw, 30px)",
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              color: theme.fg.primary,
              fontVariationSettings: '"opsz" 144, "SOFT" 100',
              wordBreak: "break-word",
            }}
          >
            {theme.name}
          </div>
          <div
            style={{
              fontSize: "clamp(12px, 1.5vw, 13px)",
              color: theme.fg.secondary,
              marginTop: 6,
              fontWeight: 500,
              lineHeight: 1.45,
            }}
          >
            {theme.tagline}
          </div>

          {/* Palette swatches */}
          <div style={{ display: "flex", gap: 6, marginTop: 14, flexWrap: "wrap" }}>
            {theme.tiles.slice(0, 6).map((color, i) => (
              <div
                key={i}
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 999,
                  background: color,
                  boxShadow: `0 2px 6px ${color}66, inset 0 1px 0 rgba(255,255,255,0.45)`,
                  border: "1px solid rgba(255,255,255,0.6)",
                }}
              />
            ))}
          </div>

          {/* Effect chips */}
          <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
            <Chip theme={theme} label={`✦ ${labelForAmbient(theme.ambient.kind)}`} />
            <Chip theme={theme} label={`◐ ${labelForShape(theme.particle.shape)}`} />
          </div>
        </div>

        {/* Right — preview tile */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            paddingRight: active ? 4 : 0,
            flexShrink: 0,
          }}
        >
          <PreviewHex theme={theme} hovered={hovered || active} />
        </div>
      </div>
    </motion.button>
  );
}

function Chip({ theme, label }: { theme: ThemeTokens; label: string }) {
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.04em",
        padding: "4px 10px",
        borderRadius: 999,
        background: `color-mix(in srgb, ${theme.accent.primary} 14%, white)`,
        color: theme.fg.secondary,
        border: `1px solid color-mix(in srgb, ${theme.accent.primary} 30%, transparent)`,
      }}
    >
      {label}
    </span>
  );
}

function labelForAmbient(kind: string): string {
  switch (kind) {
    case "hearts": return "Floating hearts";
    case "steam": return "Rising steam";
    case "bubbles": return "Drifting bubbles";
    case "fireflies": return "Soft fireflies";
    case "petals": return "Falling petals";
    default: return kind;
  }
}

function labelForShape(shape: string): string {
  switch (shape) {
    case "heart": return "Heart sparkles";
    case "bubble": return "Bubble pops";
    case "petal": return "Petal burst";
    case "leaf": return "Tea leaves";
    case "spark": return "Honey sparks";
    default: return shape;
  }
}

function PreviewHex({ theme, hovered }: { theme: ThemeTokens; hovered: boolean }) {
  const t1 = theme.tiles[0];
  const t2 = theme.tiles[1] ?? theme.tiles[0];
  const t3 = theme.tiles[2] ?? theme.tiles[0];
  return (
    <motion.div
      animate={hovered ? { y: [-2, 2, -2], rotate: [-1, 1, -1] } : { y: 0, rotate: 0 }}
      transition={hovered ? { duration: 4, repeat: Infinity, ease: "easeInOut" } : { duration: 0.3 }}
      style={{
        width: "clamp(64px, 18vw, 100px)",
        aspectRatio: "1 / 1",
        position: "relative",
      }}
    >
      <svg viewBox="-60 -60 120 120" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id={`prev-${theme.id}`} x1="0" y1="-60" x2="0" y2="60" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={t1} />
            <stop offset="60%" stopColor={t2} />
            <stop offset="100%" stopColor={t3} />
          </linearGradient>
          <radialGradient id={`prev-gloss-${theme.id}`} cx="35%" cy="22%" r="80%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.65)" />
            <stop offset="55%" stopColor="rgba(255,255,255,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.18)" />
          </radialGradient>
        </defs>
        <polygon
          points="0,-50 43.3,-25 43.3,25 0,50 -43.3,25 -43.3,-25"
          fill={theme.tile.shadowColor}
          transform="translate(0, 6)"
          style={{ filter: "blur(7px)" }}
        />
        <polygon
          points="0,-50 43.3,-25 43.3,25 0,50 -43.3,25 -43.3,-25"
          fill={`url(#prev-${theme.id})`}
        />
        <polygon
          points="0,-50 43.3,-25 43.3,25 0,50 -43.3,25 -43.3,-25"
          fill={`url(#prev-gloss-${theme.id})`}
        />
        <polygon
          points="0,-50 43.3,-25 43.3,25 0,50 -43.3,25 -43.3,-25"
          fill="none"
          stroke={theme.tile.borderColor}
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        {/* Tiny arrow */}
        <g transform="rotate(0)">
          <line
            x1="-18" y1="0" x2="14" y2="0"
            stroke={theme.tile.arrowColor}
            strokeWidth="3.2" strokeLinecap="round"
          />
          <polygon points="22,0 12,-7 12,7" fill={theme.tile.arrowColor} />
        </g>
      </svg>
    </motion.div>
  );
}
