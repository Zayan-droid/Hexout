import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePowerUpStore } from "@/store/powerupStore";
import { useGameStore } from "@/store/gameStore";
import { POWER_UPS, POWER_UP_ORDER } from "@/types/powerup";
import { PowerUpIcon } from "./PowerUpIcon";
import { fireInstantPowerUp } from "@/game/powerups/controller";
import { AudioManager } from "@/services/audio";

export function PowerUpBar() {
  const inventory = usePowerUpStore((s) => s.inventory);
  const active = usePowerUpStore((s) => s.active);
  const picks = usePowerUpStore((s) => s.picks);
  const arm = usePowerUpStore((s) => s.arm);
  const disarm = usePowerUpStore((s) => s.disarm);
  const status = useGameStore((s) => s.status);
  const animatingId = useGameStore((s) => s.animatingId);
  const undoBuffer = useGameStore((s) => s.undoBuffer);

  const [hint, setHint] = useState<string | null>(null);

  const armedDef = active ? POWER_UPS[active] : null;
  const tips = armedDef
    ? armedDef.id === "swap"
      ? picks.length === 0
        ? "Pick the first tile to swap"
        : "Pick the second tile"
      : armedDef.id === "lineBlast"
        ? "Tap a tile — its arrow charts the beam"
        : armedDef.id === "bomb"
          ? "Tap the bloom center"
          : armedDef.id === "hammer"
            ? "Tap any tile to break it"
            : armedDef.id === "colorClear"
              ? "Tap a color to dissolve all of it"
              : null
    : hint;

  const handleTap = (id: keyof typeof POWER_UPS) => {
    const count = inventory[id] ?? 0;
    if (count <= 0 || status !== "playing" || animatingId) return;
    AudioManager.powerupTick();

    if (id === "shuffle" || id === "undo") {
      if (id === "undo" && !undoBuffer) {
        setHint("Nothing to rewind yet");
        setTimeout(() => setHint(null), 1400);
        return;
      }
      fireInstantPowerUp(id);
      return;
    }
    arm(id);
  };

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        justifyContent: "center",
        padding: "8px clamp(8px, 3vw, 18px) calc(var(--safe-bottom, 0px) + 14px)",
        zIndex: 6,
      }}
    >
      {/* Hint balloon */}
      <AnimatePresence>
        {tips && (
          <motion.div
            key={tips}
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -4, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: "absolute",
              left: "50%",
              top: -34,
              transform: "translateX(-50%)",
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontSize: 13,
              padding: "5px 14px",
              borderRadius: 999,
              background: "var(--surface-raised)",
              border: "1px solid var(--surface-raised-border)",
              color: "var(--fg-secondary)",
              boxShadow: "var(--shadow-soft)",
              backdropFilter: "var(--surface-blur)",
              WebkitBackdropFilter: "var(--surface-blur)",
              whiteSpace: "nowrap",
              pointerEvents: "none",
              fontVariationSettings: '"opsz" 18, "SOFT" 100',
            }}
          >
            {tips}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cancel pill when armed */}
      <AnimatePresence>
        {active && (
          <motion.button
            key="cancel"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            onClick={() => {
              disarm();
              AudioManager.powerupTick();
            }}
            style={{
              position: "absolute",
              right: "clamp(10px, 3vw, 18px)",
              top: -6,
              fontSize: 10,
              letterSpacing: "0.20em",
              fontWeight: 700,
              padding: "5px 12px",
              borderRadius: 999,
              background: "var(--surface-bg)",
              border: "1px solid var(--surface-border)",
              color: "var(--fg-muted)",
              cursor: "pointer",
            }}
          >
            CANCEL
          </motion.button>
        )}
      </AnimatePresence>

      <div
        className="powerup-shelf"
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "clamp(5px, 1.6vw, 12px)",
          padding: "10px clamp(8px, 2.5vw, 14px)",
          borderRadius: 28,
          background: "var(--surface-raised)",
          border: "1px solid var(--surface-raised-border)",
          backdropFilter: "var(--surface-blur)",
          WebkitBackdropFilter: "var(--surface-blur)",
          boxShadow: "var(--shadow-soft)",
          maxWidth: "100%",
        }}
      >
        {POWER_UP_ORDER.map((id) => {
          const def = POWER_UPS[id];
          const count = inventory[id] ?? 0;
          const empty = count <= 0;
          const armed = active === id;
          const disabled = empty || status !== "playing" || animatingId !== null;

          return (
            <button
              key={id}
              onClick={() => handleTap(id)}
              onMouseEnter={() => !armed && setHint(def.description)}
              onMouseLeave={() => setHint(null)}
              disabled={disabled}
              aria-label={def.name}
              style={{
                position: "relative",
                width: "clamp(40px, 11vw, 56px)",
                height: "clamp(40px, 11vw, 56px)",
                borderRadius: 18,
                background: armed
                  ? `linear-gradient(160deg, ${def.hue} 0%, ${def.hueDeep} 100%)`
                  : `linear-gradient(165deg, color-mix(in srgb, ${def.hue} 18%, var(--surface-bg)) 0%, color-mix(in srgb, ${def.hueDeep} 12%, var(--surface-bg)) 100%)`,
                border: armed
                  ? `1px solid color-mix(in srgb, ${def.hueDeep} 70%, white)`
                  : `1px solid color-mix(in srgb, ${def.hueDeep} 28%, transparent)`,
                boxShadow: armed
                  ? `0 0 0 3px color-mix(in srgb, ${def.hue} 45%, transparent), 0 8px 22px color-mix(in srgb, ${def.hueDeep} 55%, transparent), inset 0 1px 0 rgba(255,255,255,0.45)`
                  : empty
                    ? "inset 0 0 0 1px rgba(0,0,0,0.04)"
                    : `0 4px 12px color-mix(in srgb, ${def.hueDeep} 22%, transparent), inset 0 1px 0 rgba(255,255,255,0.55)`,
                opacity: disabled && !armed ? 0.45 : 1,
                cursor: disabled ? "default" : "pointer",
                transition:
                  "transform 0.16s cubic-bezier(.34,1.56,.64,1), box-shadow 0.2s ease, background 0.2s ease, border-color 0.2s ease",
                transform: armed ? "translateY(-2px)" : undefined,
                touchAction: "manipulation",
              }}
              onMouseDown={(e) => {
                if (!disabled) (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.94)";
              }}
              onMouseUp={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = armed ? "translateY(-2px)" : "";
              }}
            >
              {/* Ambient glow halo behind the icon (only when armed) */}
              {armed && (
                <motion.span
                  aria-hidden
                  initial={{ opacity: 0.4, scale: 0.9 }}
                  animate={{ opacity: [0.55, 0.85, 0.55], scale: [1, 1.06, 1] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                  style={{
                    position: "absolute",
                    inset: -8,
                    borderRadius: 26,
                    background: `radial-gradient(circle, color-mix(in srgb, ${def.hue} 55%, transparent) 0%, transparent 70%)`,
                    pointerEvents: "none",
                    filter: "blur(6px)",
                  }}
                />
              )}

              {/* Soft top gloss */}
              <span
                aria-hidden
                style={{
                  position: "absolute",
                  left: 6,
                  right: 6,
                  top: 4,
                  height: "38%",
                  borderRadius: "14px 14px 30px 30px / 14px 14px 18px 18px",
                  background: "linear-gradient(180deg, rgba(255,255,255,0.55), rgba(255,255,255,0))",
                  pointerEvents: "none",
                }}
              />

              <span
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  filter: empty && !armed ? "saturate(0.3)" : undefined,
                }}
              >
                <PowerUpIcon id={id} hue={def.hue} hueDeep={def.hueDeep} active={armed} size={28} />
              </span>

              {/* Count badge */}
              {count > 0 && !armed && (
                <span
                  style={{
                    position: "absolute",
                    right: -4,
                    top: -4,
                    minWidth: 18,
                    height: 18,
                    padding: "0 5px",
                    borderRadius: 999,
                    background: "var(--fg-primary)",
                    color: "white",
                    fontSize: 10,
                    fontWeight: 800,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.16), inset 0 1px 0 rgba(255,255,255,0.25)",
                    letterSpacing: "0.04em",
                  }}
                >
                  {count}
                </span>
              )}

              {/* "selected pick" dot for swap step 1 */}
              {armed && def.picks === 2 && picks.length === 1 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  style={{
                    position: "absolute",
                    left: 4,
                    bottom: 4,
                    width: 8,
                    height: 8,
                    borderRadius: 99,
                    background: "white",
                    boxShadow: `0 0 0 2px ${def.hueDeep}`,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
