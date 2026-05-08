import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div
      className="app-shell"
      style={{
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: 24,
      }}
    >
      <div style={{ maxWidth: 420, width: "100%" }}>
        <div
          aria-hidden
          style={{
            fontSize: 64,
            lineHeight: 1,
            marginBottom: 12,
          }}
        >
          ⬢
        </div>
        <div className="title">HexOut</div>
        <div className="subtitle">
          Tap tiles to slide them off the board.
          <br />
          Clear them all.
        </div>
        <div
          style={{
            marginTop: 32,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <Link to="/levels" className="btn-primary">
            Play
          </Link>
        </div>
      </div>
    </div>
  );
}
