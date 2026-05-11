export type AmbientKind = "hearts" | "steam" | "bubbles" | "fireflies" | "petals";
export type ParticleShape = "petal" | "heart" | "bubble" | "spark" | "leaf";

export interface ThemeTokens {
  id: string;
  name: string;
  tagline: string;
  mood: string[];

  // Page background
  bg: {
    base: string;
    gradient: string;
    grainOpacity: number;
  };

  // Board surface
  board: {
    fill: string;
    stroke: string;
    innerShadow: string;
    outerShadow: string;
    cellFill: string;
    cellStroke: string;
    cellInner: string;
  };

  // Foreground / text
  fg: {
    primary: string;
    secondary: string;
    muted: string;
    onAccent: string;
  };

  // Accents
  accent: {
    primary: string;
    secondary: string;
    tertiary: string;
    success: string;
    danger: string;
    star: string;
  };

  // Tile palette — used round-robin for tile colors
  tiles: string[];

  // Tile finish
  tile: {
    arrowColor: string;
    arrowHighlight: string;
    borderColor: string;
    innerHighlight: string;
    shadowColor: string;
    bloomOpacity: number;
    glossOpacity: number;
  };

  // UI surface (glass / paper)
  surface: {
    background: string;
    border: string;
    backdropBlur: string;
    raised: string;
    raisedBorder: string;
  };

  // Shadows
  shadow: {
    soft: string;
    raised: string;
    primaryGlow: string;
  };

  // Ambient drifting layer
  ambient: {
    kind: AmbientKind;
    colors: string[];
    density: number; // 0-1
  };

  // Particle burst (clear)
  particle: {
    accents: string[];
    shape: ParticleShape;
  };

  // Audio mood
  audio: {
    waveform: OscillatorType;
    masterGain: number;
    clearA: number;
    clearB: number;
    slideStart: number;
    slideEnd: number;
    winNotes: number[];
    tap: number;
  };
}
