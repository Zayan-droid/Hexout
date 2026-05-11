import { useEffect, useRef } from "react";
import { usePowerUpStore } from "@/store/powerupStore";
import { hexToPixel } from "@/game/grid/hex";
import type { PowerUpEffect } from "@/types/powerup";

interface Props {
  width: number;
  height: number;
  size: number;
  offsetX: number;
  offsetY: number;
}

/**
 * Imperative canvas overlay that choreographs every power-up's VFX.
 * Subscribes to powerupStore.lastEffect — when it changes, a new mini-timeline
 * is spawned. Multiple effects can coexist; each owns its own state.
 */
export function PowerUpEffects({ width, height, size, offsetX, offsetY }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Active animation jobs
  const jobsRef = useRef<Array<(ctx: CanvasRenderingContext2D, dt: number, now: number) => boolean>>([]);
  const lastTsRef = useRef(0);

  // Subscribe imperatively so we don't re-render the canvas on every effect.
  useEffect(() => {
    return usePowerUpStore.subscribe((state, prev) => {
      if (state.lastEffect && state.lastEffect !== prev.lastEffect) {
        scheduleEffect(state.lastEffect);
      }
    });
  }, [size, offsetX, offsetY]);

  function project(q: number, r: number): { x: number; y: number } {
    const p = hexToPixel({ q, r }, size);
    return { x: offsetX + p.x, y: offsetY + p.y };
  }

  function hexPath(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 180) * (60 * i - 30);
      const x = cx + s * Math.cos(a);
      const y = cy + s * Math.sin(a);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }

  function scheduleEffect(eff: PowerUpEffect) {
    const t0 = performance.now();
    switch (eff.kind) {
      case "hammer": {
        const c = project(eff.tile.q, eff.tile.r);
        // Crack flash + radial impact particles, soft and tactile
        const particles: Array<{
          x: number; y: number; vx: number; vy: number; life: number; size: number; tint: string;
        }> = [];
        for (let i = 0; i < 18; i++) {
          const a = Math.random() * Math.PI * 2;
          const sp = 1.5 + Math.random() * 3.4;
          particles.push({
            x: c.x, y: c.y,
            vx: Math.cos(a) * sp,
            vy: Math.sin(a) * sp - 1.4,
            life: 1,
            size: 2 + Math.random() * 3.5,
            tint: i % 3 === 0 ? "#FFE7C7" : eff.tile.color,
          });
        }
        const shakeAmp = 6;
        const root = document.documentElement;

        jobsRef.current.push((ctx, _dt, now) => {
          const t = (now - t0) / 1000;
          if (t > 0.95) {
            root.style.removeProperty("--gb-shake-x");
            root.style.removeProperty("--gb-shake-y");
            return false;
          }

          // Screen shake (only first 320ms)
          if (t < 0.32) {
            const k = 1 - t / 0.32;
            root.style.setProperty("--gb-shake-x", `${(Math.random() - 0.5) * shakeAmp * k}px`);
            root.style.setProperty("--gb-shake-y", `${(Math.random() - 0.5) * shakeAmp * k}px`);
          } else {
            root.style.removeProperty("--gb-shake-x");
            root.style.removeProperty("--gb-shake-y");
          }

          // Pop ring (expanding, fading)
          const ringT = Math.min(1, t / 0.5);
          ctx.save();
          ctx.globalAlpha = (1 - ringT) * 0.5;
          ctx.strokeStyle = "rgba(255,236,196,0.95)";
          ctx.lineWidth = 3 * (1 - ringT) + 1;
          hexPath(ctx, c.x, c.y, size * (0.92 + ringT * 0.6));
          ctx.stroke();
          ctx.restore();

          // Crack lines (early flash)
          if (t < 0.28) {
            ctx.save();
            ctx.globalAlpha = 1 - t / 0.28;
            ctx.strokeStyle = "rgba(255,255,255,0.9)";
            ctx.lineWidth = 1.4;
            for (let i = 0; i < 5; i++) {
              const a = (i / 5) * Math.PI * 2 + 0.4;
              ctx.beginPath();
              ctx.moveTo(c.x, c.y);
              ctx.lineTo(c.x + Math.cos(a) * size * 0.7, c.y + Math.sin(a) * size * 0.7);
              ctx.stroke();
            }
            ctx.restore();
          }

          // Particles
          for (const p of particles) {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.18;
            p.vx *= 0.97;
            p.life -= 0.024;
            if (p.life <= 0) continue;
            ctx.save();
            ctx.globalAlpha = Math.max(0, p.life);
            ctx.fillStyle = p.tint;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
          return true;
        });
        break;
      }

      case "swap": {
        const a = project(eff.a.q, eff.a.r);
        const b = project(eff.b.q, eff.b.r);
        const dur = 0.62;
        jobsRef.current.push((ctx, _dt, now) => {
          const t = (now - t0) / 1000;
          if (t > dur) return false;
          const k = t / dur;

          // Glowing connection trail — shimmering line that pulses out
          const cx = (a.x + b.x) / 2;
          const cy = (a.y + b.y) / 2;
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const len = Math.hypot(dx, dy) || 1;
          const nx = -dy / len;
          const ny = dx / len;
          const wobble = Math.sin(t * 14) * 6 * (1 - k);

          ctx.save();
          // Soft halo line
          const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
          grad.addColorStop(0, "rgba(122,199,255,0)");
          grad.addColorStop(0.5, "rgba(122,199,255,0.85)");
          grad.addColorStop(1, "rgba(122,199,255,0)");
          ctx.strokeStyle = grad;
          ctx.lineWidth = 7 * (1 - k * 0.6);
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.quadraticCurveTo(cx + nx * wobble, cy + ny * wobble, b.x, b.y);
          ctx.stroke();

          // Inner bright core
          ctx.strokeStyle = "rgba(255,255,255,0.9)";
          ctx.lineWidth = 2 * (1 - k * 0.6);
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.quadraticCurveTo(cx + nx * wobble, cy + ny * wobble, b.x, b.y);
          ctx.stroke();

          // Shimmer travel pucks
          for (let i = 0; i < 6; i++) {
            const tk = ((t * 1.6 + i / 6) % 1);
            const xx = a.x + dx * tk + nx * wobble * Math.sin(tk * Math.PI);
            const yy = a.y + dy * tk + ny * wobble * Math.sin(tk * Math.PI);
            ctx.fillStyle = "rgba(255,255,255,0.85)";
            ctx.beginPath();
            ctx.arc(xx, yy, 2.5 * (1 - k * 0.5), 0, Math.PI * 2);
            ctx.fill();
          }

          // Endpoint rings
          [a, b].forEach((p) => {
            ctx.strokeStyle = `rgba(122,199,255,${(1 - k) * 0.7})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(p.x, p.y, size * (0.65 + k * 0.35), 0, Math.PI * 2);
            ctx.stroke();
          });
          ctx.restore();
          return true;
        });
        break;
      }

      case "colorClear": {
        // Calming wave that radiates from the board center, plus
        // staggered pulse + dissolve at each matching tile.
        const cx = width / 2;
        const cy = height / 2;
        const targets = eff.tiles.map((t) => project(t.q, t.r));
        const dur = 1.0;
        const particles: Array<{
          x: number; y: number; vx: number; vy: number; life: number; size: number;
        }> = [];

        jobsRef.current.push((ctx, _dt, now) => {
          const t = (now - t0) / 1000;
          if (t > dur && particles.every((p) => p.life <= 0)) return false;

          // Concentric wave
          ctx.save();
          for (let r = 0; r < 3; r++) {
            const tt = Math.min(1, t / dur + r * 0.1);
            const radius = tt * Math.max(width, height) * 0.6;
            ctx.globalAlpha = (1 - tt) * 0.30;
            ctx.strokeStyle = eff.color;
            ctx.lineWidth = 3 * (1 - tt) + 0.6;
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.stroke();
          }
          ctx.restore();

          // Per-tile pulse rings (staggered)
          targets.forEach((p, i) => {
            const local = t - i * 0.04;
            if (local < 0 || local > 0.7) return;
            const lk = local / 0.7;
            ctx.save();
            ctx.globalAlpha = (1 - lk) * 0.8;
            ctx.strokeStyle = "rgba(255,255,255,0.95)";
            ctx.lineWidth = 2 * (1 - lk) + 0.8;
            hexPath(ctx, p.x, p.y, size * (0.88 + lk * 0.5));
            ctx.stroke();
            ctx.strokeStyle = eff.color;
            ctx.globalAlpha = (1 - lk) * 0.55;
            ctx.lineWidth = 4 * (1 - lk);
            hexPath(ctx, p.x, p.y, size * (0.88 + lk * 0.5));
            ctx.stroke();
            ctx.restore();

            // Particle puff at peak
            if (Math.abs(local - 0.45) < 0.04) {
              for (let n = 0; n < 6; n++) {
                const a = Math.random() * Math.PI * 2;
                particles.push({
                  x: p.x,
                  y: p.y,
                  vx: Math.cos(a) * (1.2 + Math.random() * 1.6),
                  vy: Math.sin(a) * (1.2 + Math.random() * 1.6) - 0.8,
                  life: 1,
                  size: 1.4 + Math.random() * 2.4,
                });
              }
            }
          });

          // Particles
          for (const p of particles) {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.05;
            p.vx *= 0.96;
            p.life -= 0.02;
            if (p.life <= 0) continue;
            ctx.save();
            ctx.globalAlpha = p.life * 0.85;
            ctx.fillStyle = eff.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
          return true;
        });
        break;
      }

      case "shuffle": {
        // Floating dust + soft swirl. The tiles themselves move via the
        // store update; this layer adds airy magic.
        const dur = 1.1;
        const points = eff.before.map((t) => project(t.q, t.r));
        const particles: Array<{
          x: number; y: number; angle: number; r: number; speed: number; life: number;
        }> = points.map((p) => ({
          x: p.x, y: p.y, angle: Math.random() * Math.PI * 2, r: 4 + Math.random() * 12, speed: 1 + Math.random() * 1.4, life: 1,
        }));

        jobsRef.current.push((ctx, _dt, now) => {
          const t = (now - t0) / 1000;
          if (t > dur) return false;
          const k = t / dur;

          ctx.save();
          for (const p of particles) {
            p.angle += 0.06 * p.speed;
            p.r += 0.4;
            p.life = 1 - k;
            const x = p.x + Math.cos(p.angle) * p.r;
            const y = p.y + Math.sin(p.angle) * p.r - k * 18;
            ctx.globalAlpha = p.life * 0.65;
            ctx.fillStyle = "rgba(255,210,122,0.85)";
            ctx.beginPath();
            ctx.arc(x, y, 2.2 * p.life, 0, Math.PI * 2);
            ctx.fill();
          }

          // Soft global vignette glow that breathes once
          const pulse = Math.sin(k * Math.PI);
          ctx.globalAlpha = pulse * 0.18;
          const grad = ctx.createRadialGradient(width / 2, height / 2, 10, width / 2, height / 2, Math.max(width, height) * 0.6);
          grad.addColorStop(0, "rgba(255,210,122,0.8)");
          grad.addColorStop(1, "rgba(255,210,122,0)");
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, width, height);
          ctx.restore();
          return true;
        });
        break;
      }

      case "lineBlast": {
        const start = project(eff.from.q, eff.from.r);
        const last = eff.path[eff.path.length - 1];
        const end = project(last.q, last.r);
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const dur = 0.7;

        jobsRef.current.push((ctx, _dt, now) => {
          const t = (now - t0) / 1000;
          if (t > dur) return false;
          const k = Math.min(1, t / dur);

          ctx.save();
          // Beam trail — a tapering glow along the directional ray
          const segs = 22;
          for (let i = 0; i < segs; i++) {
            const ts = i / segs;
            // Reveal expands outward
            if (ts > k) break;
            const x = start.x + dx * ts;
            const y = start.y + dy * ts;
            const alpha = (1 - ts) * (1 - k * 0.3);
            ctx.globalAlpha = alpha * 0.6;
            ctx.fillStyle = "#88E6C8";
            ctx.beginPath();
            ctx.arc(x, y, size * 0.35 * (1 - ts * 0.4), 0, Math.PI * 2);
            ctx.fill();

            ctx.globalAlpha = alpha;
            ctx.fillStyle = "rgba(255,255,255,0.85)";
            ctx.beginPath();
            ctx.arc(x, y, size * 0.14 * (1 - ts * 0.5), 0, Math.PI * 2);
            ctx.fill();
          }

          // Leading head — bright orb
          const hx = start.x + dx * k;
          const hy = start.y + dy * k;
          const headGlow = ctx.createRadialGradient(hx, hy, 0, hx, hy, size * 0.9);
          headGlow.addColorStop(0, "rgba(255,255,255,1)");
          headGlow.addColorStop(0.4, "rgba(136,230,200,0.8)");
          headGlow.addColorStop(1, "rgba(136,230,200,0)");
          ctx.globalAlpha = 1 - k * 0.4;
          ctx.fillStyle = headGlow;
          ctx.beginPath();
          ctx.arc(hx, hy, size * 0.9, 0, Math.PI * 2);
          ctx.fill();

          // Spark trails behind head
          for (let i = 0; i < 4; i++) {
            const sx = hx - (dx / Math.hypot(dx, dy) || 0) * (i * 6 + 4) + (Math.random() - 0.5) * 4;
            const sy = hy - (dy / Math.hypot(dx, dy) || 0) * (i * 6 + 4) + (Math.random() - 0.5) * 4;
            ctx.globalAlpha = (1 - i / 4) * (1 - k);
            ctx.fillStyle = "#E4FFF4";
            ctx.beginPath();
            ctx.arc(sx, sy, 1.8, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
          return true;
        });
        break;
      }

      case "undo": {
        const c = project(eff.restored.q, eff.restored.r);
        const dur = 0.9;
        const particles: Array<{ x: number; y: number; a: number; rad: number; life: number }> = [];
        for (let i = 0; i < 14; i++) {
          particles.push({
            x: c.x,
            y: c.y,
            a: Math.random() * Math.PI * 2,
            rad: 30 + Math.random() * 40,
            life: 1,
          });
        }
        jobsRef.current.push((ctx, _dt, now) => {
          const t = (now - t0) / 1000;
          if (t > dur) return false;
          const k = t / dur;

          ctx.save();
          // Reverse-rewinding ring
          ctx.strokeStyle = "rgba(168,181,255,0.85)";
          ctx.lineWidth = 2;
          ctx.globalAlpha = 1 - k;
          ctx.beginPath();
          const angle = -k * Math.PI * 2;
          ctx.arc(c.x, c.y, size * 1.0, -Math.PI / 2, -Math.PI / 2 + angle, true);
          ctx.stroke();

          // Inward-falling particles (reversed motion)
          for (const p of particles) {
            p.life -= 0.02;
            if (p.life <= 0) continue;
            const r = p.rad * p.life;
            const x = p.x + Math.cos(p.a + k * 4) * r;
            const y = p.y + Math.sin(p.a + k * 4) * r;
            ctx.globalAlpha = p.life * 0.85;
            ctx.fillStyle = "rgba(168,181,255,0.9)";
            ctx.beginPath();
            ctx.arc(x, y, 1.8 * p.life, 0, Math.PI * 2);
            ctx.fill();
          }

          // Faint motion-trail to the restored tile
          ctx.globalAlpha = (1 - k) * 0.4;
          ctx.strokeStyle = "rgba(168,181,255,0.7)";
          ctx.lineWidth = 1.4;
          for (let i = 0; i < 5; i++) {
            const aOff = i * 0.2;
            ctx.beginPath();
            ctx.arc(c.x, c.y, size * (0.8 + aOff), 0, Math.PI * 0.7);
            ctx.stroke();
          }
          ctx.restore();
          return true;
        });
        break;
      }

      case "bomb": {
        const c = project(eff.center.q, eff.center.r);
        const dur = 1.0;
        const neighborPts = eff.cleared.map((t) => project(t.q, t.r));

        jobsRef.current.push((ctx, _dt, now) => {
          const t = (now - t0) / 1000;
          if (t > dur) return false;

          // Phase A: charge (0 → 0.32s)
          if (t < 0.32) {
            const k = t / 0.32;
            ctx.save();
            ctx.globalAlpha = 0.4 + Math.sin(t * 28) * 0.25;
            const r = size * (0.7 + k * 0.5);
            const grad = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, r);
            grad.addColorStop(0, "rgba(255,217,206,0.85)");
            grad.addColorStop(1, "rgba(255,143,168,0)");
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            return true;
          }

          // Phase B: shockwave + soft bloom (0.32 → 1.0)
          const k = (t - 0.32) / (dur - 0.32);
          ctx.save();
          // Expanding ring (soft pink)
          ctx.globalAlpha = (1 - k) * 0.85;
          ctx.strokeStyle = "rgba(255,143,168,0.95)";
          ctx.lineWidth = 3 * (1 - k) + 1;
          ctx.beginPath();
          ctx.arc(c.x, c.y, size * (0.8 + k * 2.4), 0, Math.PI * 2);
          ctx.stroke();

          // Inner soft burst
          const ig = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, size * 2);
          ig.addColorStop(0, `rgba(255,217,206,${(1 - k) * 0.7})`);
          ig.addColorStop(0.6, `rgba(255,143,168,${(1 - k) * 0.3})`);
          ig.addColorStop(1, "rgba(255,143,168,0)");
          ctx.fillStyle = ig;
          ctx.beginPath();
          ctx.arc(c.x, c.y, size * 2, 0, Math.PI * 2);
          ctx.fill();

          // Neighbor flash + bounce dot (suggest the bounce)
          neighborPts.forEach((p) => {
            const lk = Math.min(1, k * 1.4);
            ctx.globalAlpha = (1 - lk) * 0.85;
            hexPath(ctx, p.x, p.y, size * (0.9 + lk * 0.3));
            ctx.strokeStyle = "rgba(255,255,255,0.9)";
            ctx.lineWidth = 2 * (1 - lk);
            ctx.stroke();
          });
          ctx.restore();
          return true;
        });
        break;
      }
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;

    const tick = (ts: number) => {
      const dt = lastTsRef.current ? ts - lastTsRef.current : 16;
      lastTsRef.current = ts;
      ctx.clearRect(0, 0, width, height);
      jobsRef.current = jobsRef.current.filter((job) => job(ctx, dt, ts));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
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
        zIndex: 7,
      }}
    />
  );
}

