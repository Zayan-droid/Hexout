import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/store/gameStore";
import { DIRECTION_ANGLE_DEG } from "@/game/grid/directions";
import type { Direction } from "@/types";

/**
 * Compact telegraph showing the player what mutations are coming and when.
 * Renders nothing when the level has no mutations.
 */
export function MutationHUD() {
  const runtime = useGameStore((s) => s.mutationRuntime);

  if (runtime.shiftSpecs.length === 0 && !runtime.shrinkSpec) return null;

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        marginTop: 10,
      }}
    >
      <div
        style={{
          display: "inline-flex",
          gap: 8,
          alignItems: "center",
          padding: "5px 10px",
          borderRadius: 999,
          background: "var(--surface-bg)",
          border: "1px solid var(--surface-border)",
          backdropFilter: "var(--surface-blur)",
          WebkitBackdropFilter: "var(--surface-blur)",
        }}
      >
        {runtime.shiftSpecs.map((spec, i) => (
          <ShiftChip
            key={`shift-${i}`}
            direction={spec.direction}
            countdown={runtime.nextShiftIn[i] ?? spec.period}
            period={spec.period}
          />
        ))}
        {runtime.shrinkSpec && Number.isFinite(runtime.nextShrinkIn) && (
          <ShrinkChip
            countdown={runtime.nextShrinkIn}
            period={runtime.shrinkSpec.period}
            atFloor={
              runtime.currentRadius <= (runtime.shrinkSpec.minRadius ?? 1)
            }
          />
        )}
      </div>
    </div>
  );
}

function ShiftChip({
  direction,
  countdown,
  period,
}: {
  direction: Direction;
  countdown: number;
  period: number;
}) {
  const angle = DIRECTION_ANGLE_DEG[direction];
  const urgent = countdown === 1;
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "3px 9px",
        borderRadius: 999,
        background: urgent
          ? "color-mix(in srgb, #5EE2C7 28%, transparent)"
          : "color-mix(in srgb, var(--accent-secondary) 14%, transparent)",
        border: `1px solid color-mix(in srgb, ${
          urgent ? "#5EE2C7" : "var(--accent-secondary)"
        } 55%, transparent)`,
        lineHeight: 1,
      }}
      title={`Shift ${direction} every ${period} clears`}
    >
      <motion.svg
        width={14}
        height={14}
        viewBox="-7 -7 14 14"
        animate={urgent ? { x: [-1, 1, -1] } : { x: 0 }}
        transition={{ duration: 0.6, repeat: urgent ? Infinity : 0 }}
      >
        <g transform={`rotate(${angle})`}>
          <line x1={-5} y1={0} x2={3} y2={0} stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
          <polygon points="5,0 1,-3 1,3" fill="currentColor" />
        </g>
      </motion.svg>
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.10em",
          color: "var(--fg-primary)",
        }}
      >
        SHIFT
      </span>
      <CountdownBubble n={countdown} urgent={urgent} />
    </div>
  );
}

function ShrinkChip({
  countdown,
  period,
  atFloor,
}: {
  countdown: number;
  period: number;
  atFloor: boolean;
}) {
  const urgent = countdown === 1 && !atFloor;
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "3px 9px",
        borderRadius: 999,
        background: urgent
          ? "color-mix(in srgb, #FF5577 24%, transparent)"
          : "color-mix(in srgb, var(--accent-danger, #FF6B9D) 12%, transparent)",
        border: `1px solid color-mix(in srgb, ${
          urgent ? "#FF5577" : "var(--accent-danger, #FF6B9D)"
        } 55%, transparent)`,
        lineHeight: 1,
        opacity: atFloor ? 0.5 : 1,
      }}
      title={`Outer ring culled every ${period} clears`}
    >
      <motion.svg
        width={14}
        height={14}
        viewBox="-7 -7 14 14"
        animate={urgent ? { scale: [1, 1.18, 1] } : { scale: 1 }}
        transition={{ duration: 0.7, repeat: urgent ? Infinity : 0 }}
      >
        <polygon
          points="0,-5 4.3,-2.5 4.3,2.5 0,5 -4.3,2.5 -4.3,-2.5"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.6}
          strokeLinejoin="round"
        />
        <polygon
          points="0,-3 2.6,-1.5 2.6,1.5 0,3 -2.6,1.5 -2.6,-1.5"
          fill="currentColor"
        />
      </motion.svg>
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.10em",
          color: "var(--fg-primary)",
        }}
      >
        {atFloor ? "FLOOR" : "SHRINK"}
      </span>
      {!atFloor && <CountdownBubble n={countdown} urgent={urgent} />}
    </div>
  );
}

function CountdownBubble({ n, urgent }: { n: number; urgent: boolean }) {
  return (
    <AnimatePresence mode="popLayout">
      <motion.span
        key={n}
        initial={{ scale: 1.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.6, opacity: 0 }}
        transition={{ duration: 0.18 }}
        style={{
          minWidth: 16,
          height: 16,
          padding: "0 4px",
          borderRadius: 999,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          background: urgent ? "#FF5577" : "rgba(0,0,0,0.35)",
          color: "#fff",
          fontWeight: 800,
          fontSize: 10,
          lineHeight: 1,
        }}
      >
        {n}
      </motion.span>
    </AnimatePresence>
  );
}
