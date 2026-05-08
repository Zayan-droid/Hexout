import { Link } from "react-router-dom";
import { LEVELS } from "@/game/levels";

export default function LevelSelect() {
  return (
    <div className="app-shell" style={{ padding: 16 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <Link to="/" className="btn-ghost" aria-label="Home">
          ←
        </Link>
        <div style={{ fontWeight: 700, fontSize: 18 }}>Levels</div>
        <div style={{ width: 40 }} />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
          gap: 12,
          overflowY: "auto",
          padding: 4,
        }}
      >
        {LEVELS.map((lvl) => (
          <Link
            key={lvl.id}
            to={`/play/${lvl.id}`}
            style={{
              aspectRatio: "1 / 1",
              borderRadius: 16,
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))",
              border: "1px solid rgba(255,255,255,0.08)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              padding: 8,
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: 28,
                fontWeight: 800,
                color: "var(--accent)",
              }}
            >
              {lvl.id}
            </div>
            <div
              style={{
                fontSize: 11,
                color: "var(--fg-2)",
                lineHeight: 1.2,
              }}
            >
              {lvl.name ?? `Level ${lvl.id}`}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
