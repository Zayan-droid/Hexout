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
              backgroundColor: "var(--bg-base)",
              backgroundImage: "var(--surface-raised)",
              borderRadius: 24,
              padding: 40,
              maxWidth: 480,
              boxShadow: "var(--shadow-raised)",
              border: "1px solid var(--surface-raised-border)",
            }}
          >
            <h2
              style={{
                fontSize: 28,
                fontWeight: 600,
                marginTop: 0,
                marginBottom: 16,
                color: "var(--fg-primary)",
                fontFamily: "var(--font-display)",
              }}
            >
              Locked Tiles
            </h2>

            <div
              style={{
                fontSize: 15,
                lineHeight: 1.6,
                color: "var(--fg-secondary)",
                marginBottom: 24,
              }}
            >
              <p style={{ marginTop: 0 }}>
                Some tiles wear a <strong>padlock</strong> and look dimmed. They can't be tapped until you clear their matching key.
              </p>

              <p>
                <strong>Spotting the pair:</strong> every locked tile and its key share the same <strong>colored ring</strong> around their edge. Matching ring colors mean "this key opens this lock."
              </p>

              <ol style={{ marginTop: 8, marginBottom: 16, paddingLeft: 20 }}>
                <li>Find the key tile (it has a small key icon and the same ring color)</li>
                <li>Clear that key first — its locked partner unlocks instantly</li>
                <li>Now the previously locked tile can be tapped</li>
              </ol>

              <p
                style={{
                  marginBottom: 0,
                  padding: 12,
                  backgroundColor: "color-mix(in srgb, var(--accent-primary) 14%, transparent)",
                  border: "1px solid color-mix(in srgb, var(--accent-primary) 28%, transparent)",
                  borderRadius: 10,
                  color: "var(--fg-primary)",
                }}
              >
                <strong>Tip:</strong> hover or tap a locked tile — its key partner pulses in the same color so you can find it at a glance.
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
                color: "var(--fg-on-accent)",
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
