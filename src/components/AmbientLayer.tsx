import { useEffect, useRef } from "react";
import { useTheme } from "./ThemeProvider";

// A full-viewport canvas behind everything that paints theme-specific drifting
// elements (hearts, steam, bubbles, fireflies, petals). Pointer events disabled.

interface Drifter {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rot: number;
  rotV: number;
  hue: string;
  life: number;
  maxLife: number;
  seed: number;
}

export function AmbientLayer() {
  const theme = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const driftersRef = useRef<Drifter[]>([]);
  const rafRef = useRef<number>(0);
  const dimsRef = useRef({ w: window.innerWidth, h: window.innerHeight });

  useEffect(() => {
    const onResize = () => {
      dimsRef.current = { w: window.innerWidth, h: window.innerHeight };
      const c = canvasRef.current;
      if (!c) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      c.width = dimsRef.current.w * dpr;
      c.height = dimsRef.current.h * dpr;
      const ctx = c.getContext("2d");
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    driftersRef.current = [];
  }, [theme.id]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const kind = theme.ambient.kind;
    const colors = theme.ambient.colors;
    const targetCount = Math.floor(28 * theme.ambient.density);

    const spawn = (): Drifter => {
      const w = dimsRef.current.w;
      const h = dimsRef.current.h;
      switch (kind) {
        case "steam":
          return {
            x: w * 0.15 + Math.random() * w * 0.7,
            y: h + 20,
            vx: (Math.random() - 0.5) * 0.15,
            vy: -0.25 - Math.random() * 0.35,
            size: 30 + Math.random() * 80,
            rot: Math.random() * Math.PI,
            rotV: (Math.random() - 0.5) * 0.002,
            hue: colors[Math.floor(Math.random() * colors.length)],
            life: 1,
            maxLife: 1,
            seed: Math.random() * 1000,
          };
        case "bubbles":
          return {
            x: Math.random() * w,
            y: h + 20,
            vx: (Math.random() - 0.5) * 0.4,
            vy: -0.4 - Math.random() * 0.6,
            size: 4 + Math.random() * 18,
            rot: 0,
            rotV: 0,
            hue: colors[Math.floor(Math.random() * colors.length)],
            life: 1,
            maxLife: 1,
            seed: Math.random() * 1000,
          };
        case "hearts":
          return {
            x: Math.random() * w,
            y: h + 20,
            vx: (Math.random() - 0.5) * 0.3,
            vy: -0.35 - Math.random() * 0.5,
            size: 6 + Math.random() * 10,
            rot: (Math.random() - 0.5) * 0.4,
            rotV: (Math.random() - 0.5) * 0.01,
            hue: colors[Math.floor(Math.random() * colors.length)],
            life: 1,
            maxLife: 1,
            seed: Math.random() * 1000,
          };
        case "fireflies":
          return {
            x: Math.random() * w,
            y: Math.random() * h,
            vx: (Math.random() - 0.5) * 0.25,
            vy: (Math.random() - 0.5) * 0.25,
            size: 1.5 + Math.random() * 2.5,
            rot: Math.random() * Math.PI * 2,
            rotV: 0.02 + Math.random() * 0.04,
            hue: colors[Math.floor(Math.random() * colors.length)],
            life: 1,
            maxLife: 1,
            seed: Math.random() * 1000,
          };
        case "petals":
          return {
            x: Math.random() * w,
            y: -20,
            vx: 0.15 + Math.random() * 0.35,
            vy: 0.35 + Math.random() * 0.55,
            size: 8 + Math.random() * 10,
            rot: Math.random() * Math.PI * 2,
            rotV: (Math.random() - 0.5) * 0.025,
            hue: colors[Math.floor(Math.random() * colors.length)],
            life: 1,
            maxLife: 1,
            seed: Math.random() * 1000,
          };
      }
    };

    // Pre-populate so the screen doesn't start empty.
    while (driftersRef.current.length < targetCount) {
      const d = spawn();
      d.y = Math.random() * dimsRef.current.h;
      driftersRef.current.push(d);
    }

    let frame = 0;
    const tick = () => {
      frame++;
      const { w, h } = dimsRef.current;
      ctx.clearRect(0, 0, w, h);

      const items = driftersRef.current;
      for (const d of items) {
        d.x += d.vx;
        d.y += d.vy;
        d.rot += d.rotV;

        switch (kind) {
          case "hearts":
          case "bubbles":
          case "petals":
            d.vx += Math.sin((frame + d.seed) * 0.015) * 0.004;
            break;
          case "fireflies":
            d.vx += (Math.random() - 0.5) * 0.04;
            d.vy += (Math.random() - 0.5) * 0.04;
            d.vx = Math.max(-0.6, Math.min(0.6, d.vx));
            d.vy = Math.max(-0.6, Math.min(0.6, d.vy));
            break;
          case "steam":
            d.vx += Math.sin((frame + d.seed) * 0.008) * 0.003;
            d.vy *= 1.001;
            break;
        }

        drawDrifter(ctx, d, kind, frame);
      }

      // Cull off-screen + respawn
      driftersRef.current = items.filter((d) => {
        if (kind === "petals") return d.y < h + 40 && d.x < w + 40;
        if (kind === "fireflies") {
          if (d.x < -30) d.x = w + 30;
          if (d.x > w + 30) d.x = -30;
          if (d.y < -30) d.y = h + 30;
          if (d.y > h + 30) d.y = -30;
          return true;
        }
        return d.y > -120;
      });

      while (driftersRef.current.length < targetCount) {
        driftersRef.current.push(spawn());
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [theme.id, theme.ambient.kind, theme.ambient.density, theme.ambient.colors]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  );
}

function drawDrifter(
  ctx: CanvasRenderingContext2D,
  d: Drifter,
  kind: string,
  frame: number
) {
  ctx.save();
  ctx.translate(d.x, d.y);
  ctx.rotate(d.rot);

  switch (kind) {
    case "hearts": {
      ctx.globalAlpha = 0.55;
      drawHeart(ctx, d.size, d.hue);
      break;
    }
    case "bubbles": {
      ctx.globalAlpha = 0.45;
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, d.size);
      grad.addColorStop(0, withAlpha(d.hue, 0.15));
      grad.addColorStop(0.7, withAlpha(d.hue, 0.35));
      grad.addColorStop(1, withAlpha(d.hue, 0));
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, d.size, 0, Math.PI * 2);
      ctx.fill();
      // Bright spot
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.beginPath();
      ctx.arc(-d.size * 0.3, -d.size * 0.3, d.size * 0.18, 0, Math.PI * 2);
      ctx.fill();
      // Ring
      ctx.strokeStyle = withAlpha(d.hue, 0.5);
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(0, 0, d.size, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }
    case "steam": {
      const pulse = 0.18 + 0.04 * Math.sin((frame + d.seed) * 0.02);
      ctx.globalAlpha = pulse;
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, d.size);
      grad.addColorStop(0, withAlpha(d.hue, 0.9));
      grad.addColorStop(0.6, withAlpha(d.hue, 0.5));
      grad.addColorStop(1, withAlpha(d.hue, 0));
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, d.size, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "fireflies": {
      const flicker = 0.5 + 0.5 * Math.sin((frame + d.seed) * 0.05);
      const r = d.size * (0.8 + 0.4 * flicker);
      // Halo
      const halo = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 5);
      halo.addColorStop(0, withAlpha(d.hue, 0.55 * flicker));
      halo.addColorStop(0.5, withAlpha(d.hue, 0.1 * flicker));
      halo.addColorStop(1, withAlpha(d.hue, 0));
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(0, 0, r * 5, 0, Math.PI * 2);
      ctx.fill();
      // Core
      ctx.globalAlpha = 0.9 * flicker;
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "petals": {
      ctx.globalAlpha = 0.65;
      ctx.fillStyle = d.hue;
      // 5-petal flower silhouette - here a single petal (teardrop)
      ctx.beginPath();
      ctx.ellipse(0, 0, d.size, d.size * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      // Inner shading
      ctx.fillStyle = "rgba(255,255,255,0.25)";
      ctx.beginPath();
      ctx.ellipse(-d.size * 0.2, -d.size * 0.1, d.size * 0.5, d.size * 0.18, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
  }

  ctx.restore();
}

function drawHeart(ctx: CanvasRenderingContext2D, size: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  const s = size / 10;
  ctx.moveTo(0, -2 * s);
  ctx.bezierCurveTo(0, -5 * s, -5 * s, -5 * s, -5 * s, -1.5 * s);
  ctx.bezierCurveTo(-5 * s, 1.5 * s, 0, 4 * s, 0, 6 * s);
  ctx.bezierCurveTo(0, 4 * s, 5 * s, 1.5 * s, 5 * s, -1.5 * s);
  ctx.bezierCurveTo(5 * s, -5 * s, 0, -5 * s, 0, -2 * s);
  ctx.closePath();
  ctx.fill();
  // Glossy highlight
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.beginPath();
  ctx.ellipse(-2 * s, -2 * s, 1.5 * s, 1 * s, -0.5, 0, Math.PI * 2);
  ctx.fill();
}

function withAlpha(hex: string, alpha: number): string {
  // Accepts #RGB / #RRGGBB / rgb(a)
  if (hex.startsWith("rgb")) return hex;
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
