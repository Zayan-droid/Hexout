import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import type { ParticleShape } from "@/types/theme";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  rot: number;
  rotV: number;
}

export interface ParticleCanvasHandle {
  burst(x: number, y: number, color: string, count?: number): void;
}

interface Props {
  width: number;
  height: number;
  shape: ParticleShape;
  accents: string[];
}

export const ParticleCanvas = forwardRef<ParticleCanvasHandle, Props>(
  ({ width, height, shape, accents }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particles = useRef<Particle[]>([]);
    const rafRef = useRef<number>(0);
    const shapeRef = useRef<ParticleShape>(shape);
    const accentsRef = useRef<string[]>(accents);

    shapeRef.current = shape;
    accentsRef.current = accents;

    useImperativeHandle(ref, () => ({
      burst(x, y, color, count = 14) {
        const palette = [color, ...accentsRef.current];
        for (let i = 0; i < count; i++) {
          const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
          const speed = 2.4 + Math.random() * 3.2;
          particles.current.push({
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 1.5,
            life: 1,
            maxLife: 1,
            size: 4 + Math.random() * 5,
            color: palette[Math.floor(Math.random() * palette.length)],
            rot: Math.random() * Math.PI * 2,
            rotV: (Math.random() - 0.5) * 0.2,
          });
        }
        // Sparkle pops
        for (let i = 0; i < 5; i++) {
          const angle = Math.random() * Math.PI * 2;
          particles.current.push({
            x,
            y,
            vx: Math.cos(angle) * (5 + Math.random() * 3),
            vy: Math.sin(angle) * (5 + Math.random() * 3) - 2,
            life: 1,
            maxLife: 1,
            size: 2 + Math.random() * 2,
            color: "#ffffff",
            rot: Math.random() * Math.PI * 2,
            rotV: (Math.random() - 0.5) * 0.3,
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
          p.vy += 0.13;
          p.vx *= 0.97;
          p.rot += p.rotV;
          p.life -= 0.028;
          if (p.life <= 0) continue;
          alive.push(p);

          const alpha = Math.max(0, p.life);
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          drawShape(ctx, p.size * p.life, p.color, shapeRef.current);
          ctx.restore();
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

function drawShape(
  ctx: CanvasRenderingContext2D,
  r: number,
  color: string,
  shape: ParticleShape
) {
  ctx.fillStyle = color;
  switch (shape) {
    case "heart": {
      const s = r / 6;
      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.bezierCurveTo(0, -3 * s, -3 * s, -3 * s, -3 * s, -0.5 * s);
      ctx.bezierCurveTo(-3 * s, 1.5 * s, 0, 3 * s, 0, 4 * s);
      ctx.bezierCurveTo(0, 3 * s, 3 * s, 1.5 * s, 3 * s, -0.5 * s);
      ctx.bezierCurveTo(3 * s, -3 * s, 0, -3 * s, 0, -s);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.beginPath();
      ctx.ellipse(-s, -s, s * 0.7, s * 0.5, -0.5, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "bubble": {
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
      grad.addColorStop(0, withAlpha(color, 0.35));
      grad.addColorStop(0.6, withAlpha(color, 0.6));
      grad.addColorStop(1, withAlpha(color, 0));
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.beginPath();
      ctx.arc(-r * 0.32, -r * 0.32, r * 0.22, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "petal": {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(0, 0, r, r * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.30)";
      ctx.beginPath();
      ctx.ellipse(-r * 0.25, -r * 0.1, r * 0.5, r * 0.18, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "leaf": {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(-r, 0);
      ctx.quadraticCurveTo(0, -r * 0.8, r, 0);
      ctx.quadraticCurveTo(0, r * 0.8, -r, 0);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(-r, 0);
      ctx.lineTo(r, 0);
      ctx.stroke();
      break;
    }
    case "spark":
    default: {
      // 4-point star
      const spikes = 4;
      const inner = r * 0.4;
      ctx.beginPath();
      for (let i = 0; i < spikes * 2; i++) {
        const radius = i % 2 === 0 ? r : inner;
        const angle = (Math.PI / spikes) * i - Math.PI / 2;
        if (i === 0) ctx.moveTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
        else ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
      }
      ctx.closePath();
      ctx.fill();
    }
  }
}

function withAlpha(hex: string, alpha: number): string {
  if (hex.startsWith("rgb")) return hex;
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
