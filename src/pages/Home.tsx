import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTheme } from "@/components/ThemeProvider";

export default function Home() {
  const theme = useTheme();

  return (
    <div
      className="app-shell"
      style={{
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "clamp(16px, 5vw, 28px)",
        position: "relative",
      }}
    >
      {/* Top-right theme chip */}
      <div
        style={{
          position: "absolute",
          top: "calc(var(--safe-top) + clamp(10px, 2.5vw, 18px))",
          right: "calc(var(--safe-right) + clamp(10px, 2.5vw, 18px))",
          zIndex: 3,
        }}
      >
        <Link
          to="/themes"
          className="btn-ghost"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 14px 8px 10px",
            fontSize: 12,
            minHeight: 36,
            maxWidth: "60vw",
          }}
        >
          <ThemeChipSwatch />
          <span
            style={{
              fontWeight: 600,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {theme.name}
          </span>
        </Link>
      </div>

      <div
        style={{
          maxWidth: 480,
          width: "100%",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* Floating hex emblem */}
        <motion.div
          aria-hidden
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{
            marginBottom: "clamp(14px, 3vw, 22px)",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            style={{
              position: "relative",
              width: "clamp(96px, 28vw, 140px)",
              aspectRatio: "1 / 1",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: "-22%",
                borderRadius: "50%",
                background:
                  `radial-gradient(circle, color-mix(in srgb, ${theme.accent.primary} 35%, transparent), transparent 65%)`,
                filter: "blur(10px)",
              }}
            />
            <HeroHex theme={theme} />
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
          style={{ width: "100%" }}
        >
          <div className="eyebrow" style={{ marginBottom: 12 }}>
            A cozy hex puzzle
          </div>
          <div className="title">
            Hex<em>Out</em>
          </div>
          <div className="subtitle">
            Tap a tile. Watch it drift away. <br />
            Clear the board, savor the calm.
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.25, ease: "easeOut" }}
          style={{
            marginTop: "clamp(28px, 6vw, 44px)",
            display: "flex",
            flexDirection: "column",
            gap: 12,
            alignItems: "center",
            width: "100%",
          }}
        >
          <Link
            to="/levels"
            className="btn-primary"
            style={{
              minWidth: "min(220px, 80vw)",
              width: "min(280px, 100%)",
            }}
          >
            Play
          </Link>
          <Link
            to="/themes"
            className="btn-ghost"
            style={{
              minWidth: "min(220px, 80vw)",
              width: "min(280px, 100%)",
              justifyContent: "center",
              display: "inline-flex",
            }}
          >
            ✦ Themes
          </Link>
        </motion.div>

        {/* Bottom serif signature */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.6 }}
          style={{
            marginTop: "clamp(28px, 8vw, 60px)",
            paddingInline: 12,
          }}
        >
          <span
            className="serif-label"
            style={{
              fontSize: 13,
              opacity: 0.7,
              letterSpacing: "0.04em",
            }}
          >
            “{theme.tagline}”
          </span>
        </motion.div>
      </div>
    </div>
  );
}

function ThemeChipSwatch() {
  const theme = useTheme();
  const c = theme.tiles.slice(0, 4);
  return (
    <div
      style={{
        display: "flex",
        borderRadius: 999,
        overflow: "hidden",
        boxShadow: "0 0 0 1px rgba(0,0,0,0.06)",
        flexShrink: 0,
      }}
    >
      {c.map((color, i) => (
        <div
          key={i}
          style={{
            width: 10,
            height: 18,
            background: color,
          }}
        />
      ))}
    </div>
  );
}

function HeroHex({ theme }: { theme: ReturnType<typeof useTheme> }) {
  const primary = theme.accent.primary;
  const secondary = theme.accent.secondary;
  const tertiary = theme.accent.tertiary;
  return (
    <svg
      viewBox="-60 -60 120 120"
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid meet"
      style={{ display: "block" }}
    >
      <defs>
        <linearGradient id="homeHex" x1="0" y1="-60" x2="0" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={tertiary} />
          <stop offset="60%" stopColor={primary} />
          <stop offset="100%" stopColor={secondary} />
        </linearGradient>
        <radialGradient id="homeHexGloss" cx="35%" cy="22%" r="80%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.70)" />
          <stop offset="55%" stopColor="rgba(255,255,255,0)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.20)" />
        </radialGradient>
      </defs>
      {/* Drop shadow */}
      <polygon
        points="0,-50 43.3,-25 43.3,25 0,50 -43.3,25 -43.3,-25"
        fill="rgba(0,0,0,0.10)"
        transform="translate(0, 6)"
        style={{ filter: "blur(6px)" }}
      />
      <polygon
        points="0,-50 43.3,-25 43.3,25 0,50 -43.3,25 -43.3,-25"
        fill="url(#homeHex)"
      />
      <polygon
        points="0,-50 43.3,-25 43.3,25 0,50 -43.3,25 -43.3,-25"
        fill="url(#homeHexGloss)"
      />
      <polygon
        points="0,-50 43.3,-25 43.3,25 0,50 -43.3,25 -43.3,-25"
        fill="none"
        stroke="rgba(255,255,255,0.55)"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      {/* Tiny center marker */}
      <circle cx="0" cy="0" r="3" fill="rgba(255,255,255,0.9)" />
    </svg>
  );
}
