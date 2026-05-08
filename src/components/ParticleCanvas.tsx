import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  type: "circle" | "star";
}

export interface ParticleCanvasHandle {
  burst(x: number, y: number, color: string, count?: number): void;
}

export const ParticleCanvas = forwardRef<ParticleCanvasHandle, { width: number; height: number }>(
  ({ width, height }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particles = useRef<Particle[]>([]);
    const rafRef = useRef<number>(0);

    useImperativeHandle(ref, () => ({
      burst(x, y, color, count = 14) {
        for (let i = 0; i < count; i++) {
          const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
          const speed = 2.5 + Math.random() * 3.5;
          particles.current.push({
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 1.5,
            life: 1,
            maxLife: 1,
            size: 3 + Math.random() * 4,
            color,
            type: Math.random() > 0.4 ? "circle" : "star",
          });
        }
        // Sparkle streaks in the arrow direction
        for (let i = 0; i < 4; i++) {
          const angle = Math.random() * Math.PI * 2;
          particles.current.push({
            x,
            y,
            vx: Math.cos(angle) * (5 + Math.random() * 3),
            vy: Math.sin(angle) * (5 + Math.random() * 3) - 2,
            life: 1,
            maxLife: 1,
            size: 1.5 + Math.random() * 2,
            color: "#ffffff",
            type: "star",
          });
        }
      },
    }));

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d")!;

      const tick = () => {
        ctx.clearRect(0, 0, width, height);
        const alive: Particle[] = [];
        for (const p of particles.current) {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.15; // gravity
          p.vx *= 0.97;
          p.life -= 0.032;
          if (p.life <= 0) continue;
          alive.push(p);

          const alpha = p.life;
          ctx.globalAlpha = alpha;
          ctx.fillStyle = p.color;

          if (p.type === "circle") {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fill();
          } else {
            drawStar(ctx, p.x, p.y, p.size * p.life);
          }
        }
        ctx.globalAlpha = 1;
        particles.current = alive;
        rafRef.current = requestAnimationFrame(tick);
      };

      rafRef.current = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(rafRef.current);
    }, [width, height]);

    return (
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 5,
        }}
      />
    );
  }
);
ParticleCanvas.displayName = "ParticleCanvas";

function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  const spikes = 4;
  const inner = r * 0.4;
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const radius = i % 2 === 0 ? r : inner;
    const angle = (Math.PI / spikes) * i - Math.PI / 2;
    if (i === 0) ctx.moveTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
    else ctx.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
  }
  ctx.closePath();
  ctx.fill();
}
