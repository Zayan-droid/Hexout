// Synthesized audio via Web Audio API — no static files required.
// All sounds are ASMR-soft: short, high-frequency, with gentle decay.

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

type WaveType = OscillatorType;

function tone(
  freq: number,
  duration: number,
  wave: WaveType = "sine",
  gainPeak = 0.6,
  freqEnd?: number
) {
  if (muted) return;
  const c = getCtx();
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.connect(g);
  g.connect(getMaster());

  osc.type = wave;
  osc.frequency.setValueAtTime(freq, c.currentTime);
  if (freqEnd !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(freqEnd, c.currentTime + duration);
  }

  g.gain.setValueAtTime(0, c.currentTime);
  g.gain.linearRampToValueAtTime(gainPeak, c.currentTime + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);

  osc.start(c.currentTime);
  osc.stop(c.currentTime + duration + 0.01);
}

function noise(duration: number, gainPeak = 0.08) {
  if (muted) return;
  const c = getCtx();
  const bufLen = c.sampleRate * duration;
  const buf = c.createBuffer(1, bufLen, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufLen; i++) data[i] = (Math.random() * 2 - 1) * 0.3;
  const src = c.createBufferSource();
  src.buffer = buf;
  const g = c.createGain();
  const filter = c.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 4000;
  filter.Q.value = 0.8;
  src.connect(filter);
  filter.connect(g);
  g.connect(getMaster());
  g.gain.setValueAtTime(gainPeak, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
  src.start();
  src.stop(c.currentTime + duration + 0.01);
}

export const AudioManager = {
  setMuted(val: boolean) {
    muted = val;
    if (masterGain) masterGain.gain.value = val ? 0 : 0.4;
  },
  isMuted: () => muted,

  tap() {
    tone(880, 0.08, "sine", 0.3);
  },

  slide() {
    tone(660, 0.12, "sine", 0.25, 440);
    noise(0.1, 0.05);
  },

  clear() {
    // Bright ding: two tones a fifth apart
    tone(1046, 0.22, "sine", 0.4);
    tone(1568, 0.18, "sine", 0.25);
  },

  combo(count: number) {
    // Ascending chime series for consecutive clears
    const base = 880;
    const multiplier = Math.min(count, 5);
    for (let i = 0; i < multiplier; i++) {
      setTimeout(() => {
        tone(base * Math.pow(1.2, i), 0.18, "sine", 0.35);
      }, i * 55);
    }
  },

  blocked() {
    // Soft dull thud
    tone(160, 0.14, "triangle", 0.3, 90);
    noise(0.1, 0.04);
  },

  win() {
    // Ascending arpeggiated chord
    const notes = [523, 659, 784, 1047, 1319];
    notes.forEach((f, i) => {
      setTimeout(() => tone(f, 0.4, "sine", 0.35), i * 80);
    });
  },

  lost() {
    tone(330, 0.18, "sawtooth", 0.2, 200);
    setTimeout(() => tone(220, 0.22, "sine", 0.15, 150), 140);
  },
};
