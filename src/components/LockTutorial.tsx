import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface LockTutorialProps {
  levelId: number;
  onDismiss: () => void;
}

export function LockTutorial({ levelId, onDismiss }: LockTutorialProps) {
  const [dismissed, setDismissed] = useState(false);

  // Show tutorial only for level 16
  const shouldShow = levelId === 16 && !dismissed;

  if (!shouldShow) return null;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss();
  };

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
          onClick={handleDismiss}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "var(--bg-primary)",
              borderRadius: 24,
              padding: 40,
              maxWidth: 480,
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
              border: "1px solid var(--board-stroke)",
            }}
          >
            <h2
              style={{
                fontSize: 28,
                fontWeight: 600,
                marginTop: 0,
                marginBottom: 16,
                color: "var(--text-primary)",
              }}
            >
              🔐 Locked Tiles
            </h2>

            <div
              style={{
                fontSize: 15,
                lineHeight: 1.6,
                color: "var(--text-secondary)",
                marginBottom: 24,
              }}
            >
              <p style={{ marginTop: 0 }}>
                Some tiles have a <strong>padlock icon</strong> and appear dimmed. They are <strong>locked</strong> and cannot be tapped until unlocked.
              </p>

              <p>
                <strong>To unlock a locked tile:</strong>
              </p>
              <ol style={{ marginTop: 8, marginBottom: 16, paddingLeft: 20 }}>
                <li>Find the tile with a <strong>matching key</strong></li>
                <li>Tap and clear that key tile first</li>
                <li>Once the key clears, the locked tile becomes unlocked</li>
                <li>Now you can tap the previously locked tile</li>
              </ol>

              <p style={{ marginBottom: 0, padding: 12, backgroundColor: "rgba(100,200,150,0.15)", borderRadius: 8 }}>
                <strong>Example:</strong> A tile might be locked by key "k1". Find the tile with key "k1", clear it, and then the locked tile becomes available.
              </p>
            </div>

            <button
              onClick={handleDismiss}
              style={{
                width: "100%",
                padding: "12px 24px",
                fontSize: 16,
                fontWeight: 600,
                backgroundColor: "var(--accent-primary)",
                color: "white",
                border: "none",
                borderRadius: 12,
                cursor: "pointer",
                transition: "opacity 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLButtonElement).style.opacity = "0.9";
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLButtonElement).style.opacity = "1";
              }}
            >
              Got it!
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
