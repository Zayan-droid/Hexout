// Synthesized audio via Web Audio API — no static files required.
// Tones flex per theme; the synthesis layers each sound for punch and shimmer.

import { useThemeStore } from "@/store/themeStore";
import { getTheme } from "@/themes";
import type { ThemeTokens } from "@/types/theme";

let ctx: AudioContext | null = null;
let muted = false;
let masterGain: GainNode | null = null;

function getCtx(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.4;
    masterGain.connect(ctx.destination);
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function getMaster(): GainNode {
  getCtx();
  return masterGain!;
}

function currentTheme(): ThemeTokens {
  return getTheme(useThemeStore.getState().themeId);
}

type WaveType = OscillatorType;

// Route a source through an optional stereo panner, then to master.
function routeOut(c: AudioContext, pan?: number): AudioNode {
  if (pan === undefined || typeof c.createStereoPanner !== "function") {
    return getMaster();
  }
  const p = c.createStereoPanner();
  p.pan.value = Math.max(-1, Math.min(1, pan));
  p.connect(getMaster());
  return p;
}

function tone(
  freq: number,
  duration: number,
  wave: WaveType = "sine",
  gainPeak = 0.6,
  freqEnd?: number,
  pan?: number
) {
  if (muted) return;
  const c = getCtx();
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.connect(g);
  g.connect(routeOut(c, pan));

  osc.type = wave;
  osc.frequency.setValueAtTime(freq, c.currentTime);
  if (freqEnd !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(freqEnd, c.currentTime + duration);
  }

  g.gain.setValueAtTime(0, c.currentTime);
  g.gain.linearRampToValueAtTime(gainPeak, c.currentTime + 0.005);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);

  osc.start(c.currentTime);
  osc.stop(c.currentTime + duration + 0.01);
}

// Bell-like pluck: stack overtones for a richer, more satisfying ping.
function pluck(
  freq: number,
  duration: number,
  gainPeak = 0.4,
  opts: { harmonics?: number[]; wave?: WaveType; detune?: number; pan?: number } = {}
) {
  if (muted) return;
  const c = getCtx();
  const harmonics = opts.harmonics ?? [1, 2.005];
  const wave = opts.wave ?? "triangle";
  const detune = opts.detune ?? 0;
  const out = routeOut(c, opts.pan);

  harmonics.forEach((h, i) => {
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = wave;
    osc.frequency.value = freq * h;
    osc.detune.value = detune * (i + 1);
    osc.connect(g);
    g.connect(out);

    const peak = gainPeak / (i + 1);
    g.gain.setValueAtTime(0, c.currentTime);
    g.gain.linearRampToValueAtTime(peak, c.currentTime + 0.005);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);

    osc.start(c.currentTime);
    osc.stop(c.currentTime + duration + 0.01);
  });
}

// Filtered noise burst — used for clicks, scrapes, and air.
function noise(duration: number, gainPeak = 0.08, filterHz = 4000, q = 0.8) {
  if (muted) return;
  const c = getCtx();
  const bufLen = Math.max(1, Math.floor(c.sampleRate * duration));
  const buf = c.createBuffer(1, bufLen, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufLen; i++) data[i] = (Math.random() * 2 - 1) * 0.3;
  const src = c.createBufferSource();
  src.buffer = buf;
  const g = c.createGain();
  const filter = c.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = filterHz;
  filter.Q.value = q;
  src.connect(filter);
  filter.connect(g);
  g.connect(getMaster());
  g.gain.setValueAtTime(gainPeak, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
  src.start();
  src.stop(c.currentTime + duration + 0.01);
}

// Filter-swept noise — gives a "whoosh" that scales pitch over time.
function whoosh(duration: number, gainPeak = 0.06, fromHz = 600, toHz = 3200, q = 1.2) {
  if (muted) return;
  const c = getCtx();
  const bufLen = Math.max(1, Math.floor(c.sampleRate * duration));
  const buf = c.createBuffer(1, bufLen, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;

  const src = c.createBufferSource();
  src.buffer = buf;
  const filter = c.createBiquadFilter();
  filter.type = "bandpass";
  filter.Q.value = q;
  filter.frequency.setValueAtTime(fromHz, c.currentTime);
  filter.frequency.exponentialRampToValueAtTime(Math.max(50, toHz), c.currentTime + duration);

  const g = c.createGain();
  g.gain.setValueAtTime(0, c.currentTime);
  g.gain.linearRampToValueAtTime(gainPeak, c.currentTime + duration * 0.2);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);

  src.connect(filter);
  filter.connect(g);
  g.connect(getMaster());
  src.start();
  src.stop(c.currentTime + duration + 0.02);
}

// Sub-bass thump with a fast downward pitch ramp — the "impact" layer.
function kick(freq = 110, duration = 0.18, gainPeak = 0.5) {
  if (muted) return;
  const c = getCtx();
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq * 2.6, c.currentTime);
  osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq * 0.5), c.currentTime + duration);
  osc.connect(g);
  g.connect(getMaster());
  g.gain.setValueAtTime(0, c.currentTime);
  g.gain.linearRampToValueAtTime(gainPeak, c.currentTime + 0.005);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
  osc.start(c.currentTime);
  osc.stop(c.currentTime + duration + 0.01);
}

// High-frequency stochastic shimmer — adds excitement on top of clears/wins.
function sparkle(center = 2400, count = 5, gainPeak = 0.16, spreadMs = 25) {
  if (muted) return;
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      if (muted) return;
      const c = getCtx();
      const f = center * (0.65 + Math.random() * 1.25);
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = "triangle";
      osc.frequency.value = f;
      osc.connect(g);
      g.connect(routeOut(c, (Math.random() * 2 - 1) * 0.7));
      g.gain.setValueAtTime(0, c.currentTime);
      g.gain.linearRampToValueAtTime(gainPeak, c.currentTime + 0.005);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.13);
      osc.start(c.currentTime);
      osc.stop(c.currentTime + 0.15);
    }, i * spreadMs);
  }
}

// Update master gain whenever theme changes.
useThemeStore.subscribe((s, prev) => {
  if (s.themeId !== prev.themeId && masterGain && !muted) {
    masterGain.gain.value = getTheme(s.themeId).audio.masterGain;
  }
});

export const AudioManager = {
  setMuted(val: boolean) {
    muted = val;
    if (masterGain) masterGain.gain.value = val ? 0 : currentTheme().audio.masterGain;
  },
  isMuted: () => muted,

  // Crisp confirmation tick when a tile is touched.
  tap() {
    const t = currentTheme();
    tone(t.audio.tap, 0.06, t.audio.waveform, 0.22);
    noise(0.018, 0.05, 5200, 1.4);
  },

  // Tile launches off the board — pitched whoosh + air movement.
  slide() {
    const t = currentTheme();
    tone(t.audio.slideStart, 0.14, t.audio.waveform, 0.24, t.audio.slideEnd);
    whoosh(0.18, 0.07, 700, 3200, 1.4);
  },

  // Successful clear — layered bell with two pitches and a tiny sparkle.
  clear() {
    const t = currentTheme();
    pluck(t.audio.clearA, 0.38, 0.42, {
      harmonics: [1, 2.005, 3.01],
      wave: t.audio.waveform,
    });
    pluck(t.audio.clearB, 0.30, 0.28, {
      harmonics: [1, 2.01],
      wave: t.audio.waveform,
    });
    sparkle(2600, 2, 0.13, 30);
  },

  // Combo chain — ascending bell run that pans L/R, with sparkle finale.
  combo(count: number) {
    const t = currentTheme();
    const base = t.audio.clearA;
    const steps = Math.min(count, 6);

    // Impact layer grows with the streak.
    kick(82, 0.14, 0.22 + Math.min(count, 6) * 0.04);

    for (let i = 0; i < steps; i++) {
      setTimeout(() => {
        if (muted) return;
        const freq = base * Math.pow(1.18, i);
        const pan = i % 2 === 0 ? -0.45 : 0.45;
        pluck(freq, 0.22, 0.36, {
          harmonics: [1, 2.005, 3.01],
          wave: t.audio.waveform,
          pan,
        });
      }, i * 58);
    }
    // Sparkle finale once the combo is real.
    if (count >= 2) {
      setTimeout(() => sparkle(2400 + count * 120, 3 + Math.min(count, 5), 0.18, 22),
        steps * 58);
    }
  },

  // Invalid move — gritty downward buzz + thump.
  blocked() {
    if (!muted) {
      const c = getCtx();
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(240, c.currentTime);
      osc.frequency.exponentialRampToValueAtTime(95, c.currentTime + 0.16);
      osc.connect(g);
      g.connect(getMaster());
      g.gain.setValueAtTime(0, c.currentTime);
      g.gain.linearRampToValueAtTime(0.26, c.currentTime + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.16);
      osc.start(c.currentTime);
      osc.stop(c.currentTime + 0.17);
    }
    noise(0.09, 0.05, 1200, 0.6);
    kick(72, 0.12, 0.22);
  },

  // Level cleared — kick, arpeggio, chord pad, finale sparkle.
  win() {
    const t = currentTheme();
    const notes = t.audio.winNotes;

    kick(notes[0] ? notes[0] * 0.5 : 110, 0.34, 0.45);

    notes.forEach((f, i) => {
      setTimeout(() => {
        pluck(f, 0.46, 0.40, {
          harmonics: [1, 2.005, 3.02],
          wave: t.audio.waveform,
          pan: i % 2 === 0 ? -0.35 : 0.35,
        });
      }, i * 92);
    });

    const tailStart = notes.length * 92;
    setTimeout(() => {
      // Chord pad: root + fifth + octave layered as sustained sines.
      const root = notes[notes.length - 1] ?? notes[0];
      pluck(root, 0.9, 0.24, { harmonics: [1, 1.5, 2], wave: "sine" });
    }, tailStart + 40);

    setTimeout(() => sparkle(3000, 9, 0.18, 28), tailStart + 80);
  },

  // Level failed — heavy descending dirge with sub-bass.
  lost() {
    kick(58, 0.42, 0.38);
    [392, 311, 247, 196].forEach((f, i) => {
      setTimeout(() => {
        pluck(f, 0.36, 0.24, { harmonics: [1, 2.01], wave: "sine" });
      }, i * 130);
    });
    noise(0.22, 0.04, 600, 0.6);
  },

  /* ---------------------------- Power-ups ---------------------------- */

  powerupTick() {
    const t = currentTheme();
    pluck(t.audio.tap * 1.2, 0.10, 0.22, {
      harmonics: [1, 2.005],
      wave: t.audio.waveform,
    });
  },

  hammerCharge() {
    const t = currentTheme();
    tone(520, 0.12, t.audio.waveform, 0.22, 820);
    whoosh(0.12, 0.04, 800, 2600, 1.8);
  },

  hammerHit() {
    tone(180, 0.10, "triangle", 0.32, 80);
    noise(0.10, 0.08, 1800, 0.9);
    kick(95, 0.14, 0.34);
  },

  swapShimmer() {
    const t = currentTheme();
    [0, 90, 170].forEach((d, i) => {
      setTimeout(() => {
        pluck(820 + i * 240, 0.20, 0.24, {
          harmonics: [1, 2.005],
          wave: t.audio.waveform,
          pan: i % 2 === 0 ? -0.4 : 0.4,
        });
      }, d);
    });
    sparkle(3200, 4, 0.14, 30);
  },

  colorWave() {
    const t = currentTheme();
    tone(440, 0.34, t.audio.waveform, 0.24, 1100);
    setTimeout(() => tone(660, 0.30, t.audio.waveform, 0.20, 1320), 80);
    whoosh(0.32, 0.05, 500, 2600, 1.0);
  },

  lineBlast() {
    const t = currentTheme();
    tone(380, 0.32, t.audio.waveform, 0.30, 1500);
    whoosh(0.30, 0.10, 400, 4200, 1.0);
    kick(78, 0.16, 0.28);
  },

  bombCharge() {
    const t = currentTheme();
    tone(220, 0.36, t.audio.waveform, 0.22, 560);
    whoosh(0.30, 0.04, 400, 1800, 2.0);
  },

  bombBoom() {
    kick(64, 0.34, 0.55);
    tone(140, 0.30, "sine", 0.30, 70);
    tone(280, 0.22, "triangle", 0.18, 150);
    noise(0.20, 0.10, 800, 0.5);
    sparkle(2200, 5, 0.16, 35);
  },

  shuffleLift() {
    const t = currentTheme();
    tone(660, 0.30, t.audio.waveform, 0.22, 990);
    whoosh(0.26, 0.06, 800, 3400, 1.2);
    sparkle(2800, 3, 0.14, 40);
  },

  rewindChime() {
    const t = currentTheme();
    [0, 85, 170, 255].forEach((d, i) => {
      setTimeout(() => {
        pluck(1480 - i * 220, 0.22, 0.24, {
          harmonics: [1, 2.005],
          wave: t.audio.waveform,
          pan: i % 2 === 0 ? 0.35 : -0.35,
        });
      }, d);
    });
  },
};
