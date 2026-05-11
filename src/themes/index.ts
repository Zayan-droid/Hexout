import type { ThemeTokens } from "@/types/theme";

const strawberryMarshmallow: ThemeTokens = {
  id: "strawberry-marshmallow",
  name: "Strawberry Marshmallow",
  tagline: "Fluffy, sweet, daydreamy.",
  mood: ["fluffy", "sweet", "dessert"],

  bg: {
    base: "#FFF5F7",
    gradient:
      "radial-gradient(120% 80% at 18% 12%, #FFE7EE 0%, #FFF1F4 38%, #FFE5EC 100%)",
    grainOpacity: 0.05,
  },
  board: {
    fill: "linear-gradient(160deg, #FADADD 0%, #FFE5EC 60%, #FFD7E3 100%)",
    stroke: "rgba(255, 143, 171, 0.32)",
    innerShadow: "inset 0 1px 0 rgba(255,255,255,0.65), inset 0 -20px 40px rgba(255,143,171,0.10)",
    outerShadow: "0 28px 56px rgba(255, 93, 115, 0.16), 0 6px 16px rgba(255, 143, 171, 0.10)",
    cellFill: "rgba(255, 232, 240, 0.55)",
    cellStroke: "rgba(255, 143, 171, 0.22)",
    cellInner: "rgba(255, 184, 205, 0.18)",
  },
  fg: {
    primary: "#5A3B47",
    secondary: "#8C5A6C",
    muted: "#B98C9B",
    onAccent: "#FFFFFF",
  },
  accent: {
    primary: "#FF8FAB",
    secondary: "#FF5D73",
    tertiary: "#FFB3C6",
    success: "#7FCEA0",
    danger: "#E26B83",
    star: "#FFC857",
  },
  tiles: [
    "#FF8FAB", // strawberry pink
    "#FFB3C6", // marshmallow pink
    "#FFD2A8", // cream peach
    "#F4C8E3", // bubblegum
    "#FFE5A8", // butter
    "#E8AED1", // sweet pea
    "#FFA6B8", // sakura
    "#FFC4D2", // cotton candy
  ],
  tile: {
    arrowColor: "#4A2A36",
    arrowHighlight: "rgba(255,255,255,0.55)",
    borderColor: "rgba(255,255,255,0.85)",
    innerHighlight: "rgba(255,255,255,0.55)",
    shadowColor: "rgba(230, 100, 130, 0.30)",
    bloomOpacity: 0.18,
    glossOpacity: 0.55,
  },
  surface: {
    background: "rgba(255, 255, 255, 0.55)",
    border: "rgba(255, 143, 171, 0.20)",
    backdropBlur: "blur(18px) saturate(140%)",
    raised: "linear-gradient(160deg, rgba(255,255,255,0.85), rgba(255,229,236,0.60))",
    raisedBorder: "rgba(255, 143, 171, 0.30)",
  },
  shadow: {
    soft: "0 12px 28px rgba(255, 93, 115, 0.12)",
    raised: "0 24px 48px rgba(255, 93, 115, 0.18), 0 4px 10px rgba(255, 93, 115, 0.10)",
    primaryGlow: "0 0 28px rgba(255, 143, 171, 0.45)",
  },
  ambient: {
    kind: "hearts",
    colors: ["#FF8FAB", "#FFB3C6", "#FFD2A8"],
    density: 0.7,
  },
  particle: {
    accents: ["#FF8FAB", "#FFB3C6", "#FFE5A8", "#FFFFFF"],
    shape: "heart",
  },
  audio: {
    waveform: "sine",
    masterGain: 0.35,
    clearA: 1175,
    clearB: 1568,
    slideStart: 880,
    slideEnd: 660,
    winNotes: [659, 784, 988, 1175, 1397],
    tap: 1320,
  },
};

const matchaCafe: ThemeTokens = {
  id: "matcha-cafe",
  name: "Matcha Cafe",
  tagline: "Earthy, calm, slow afternoon.",
  mood: ["calm", "earthy", "cozy cafe"],

  bg: {
    base: "#F3F0E8",
    gradient:
      "radial-gradient(120% 80% at 78% 18%, #EFE6D5 0%, #F3F0E8 42%, #E9E3D0 100%)",
    grainOpacity: 0.07,
  },
  board: {
    fill: "linear-gradient(160deg, #DDE5D3 0%, #E6EBDB 55%, #D4DEC6 100%)",
    stroke: "rgba(124, 154, 109, 0.32)",
    innerShadow: "inset 0 1px 0 rgba(255,255,255,0.45), inset 0 -22px 44px rgba(139, 107, 78, 0.10)",
    outerShadow: "0 28px 56px rgba(83, 100, 65, 0.18), 0 6px 16px rgba(139, 107, 78, 0.12)",
    cellFill: "rgba(239, 230, 213, 0.50)",
    cellStroke: "rgba(124, 154, 109, 0.20)",
    cellInner: "rgba(124, 154, 109, 0.10)",
  },
  fg: {
    primary: "#3B4530",
    secondary: "#6B7A5A",
    muted: "#9AA683",
    onAccent: "#FFFFFF",
  },
  accent: {
    primary: "#7C9A6D",
    secondary: "#8B6B4E",
    tertiary: "#C8B89B",
    success: "#7C9A6D",
    danger: "#C7714F",
    star: "#E5B96B",
  },
  tiles: [
    "#7C9A6D", // matcha
    "#9DB58A", // young leaf
    "#C8B89B", // raw biscuit
    "#8B6B4E", // brown sugar
    "#D9C8A3", // honey
    "#A8B895", // sage
    "#B89A7A", // caramel
    "#6F8A60", // forest tea
  ],
  tile: {
    arrowColor: "#2F3A26",
    arrowHighlight: "rgba(255,250,235,0.45)",
    borderColor: "rgba(255,250,235,0.80)",
    innerHighlight: "rgba(255,250,235,0.40)",
    shadowColor: "rgba(83, 100, 65, 0.35)",
    bloomOpacity: 0.12,
    glossOpacity: 0.38,
  },
  surface: {
    background: "rgba(239, 230, 213, 0.55)",
    border: "rgba(139, 107, 78, 0.20)",
    backdropBlur: "blur(16px) saturate(120%)",
    raised: "linear-gradient(160deg, rgba(255,250,235,0.85), rgba(221,229,211,0.60))",
    raisedBorder: "rgba(139, 107, 78, 0.30)",
  },
  shadow: {
    soft: "0 12px 28px rgba(83, 100, 65, 0.16)",
    raised: "0 24px 48px rgba(83, 100, 65, 0.22), 0 4px 10px rgba(83, 100, 65, 0.12)",
    primaryGlow: "0 0 28px rgba(124, 154, 109, 0.40)",
  },
  ambient: {
    kind: "steam",
    colors: ["#EFE6D5", "#DDE5D3", "#C8B89B"],
    density: 0.55,
  },
  particle: {
    accents: ["#7C9A6D", "#C8B89B", "#EFE6D5", "#8B6B4E"],
    shape: "leaf",
  },
  audio: {
    waveform: "sine",
    masterGain: 0.32,
    clearA: 880,
    clearB: 1175,
    slideStart: 520,
    slideEnd: 390,
    winNotes: [392, 494, 587, 698, 880],
    tap: 740,
  },
};

const blueberryMilk: ThemeTokens = {
  id: "blueberry-milk",
  name: "Blueberry Milk",
  tagline: "Dreamy, sleepy, drifting clouds.",
  mood: ["dreamy", "sleepy", "soft"],

  bg: {
    base: "#EEF4FF",
    gradient:
      "radial-gradient(120% 80% at 30% 16%, #E4ECFF 0%, #EEF4FF 42%, #DEE9FF 100%)",
    grainOpacity: 0.05,
  },
  board: {
    fill: "linear-gradient(160deg, #D9E6FF 0%, #E6EEFF 55%, #CFDDFA 100%)",
    stroke: "rgba(123, 154, 204, 0.32)",
    innerShadow: "inset 0 1px 0 rgba(255,255,255,0.75), inset 0 -22px 44px rgba(123, 154, 204, 0.10)",
    outerShadow: "0 28px 56px rgba(80, 110, 170, 0.18), 0 6px 16px rgba(123, 154, 204, 0.10)",
    cellFill: "rgba(228, 236, 255, 0.55)",
    cellStroke: "rgba(123, 154, 204, 0.22)",
    cellInner: "rgba(184, 184, 255, 0.15)",
  },
  fg: {
    primary: "#2E3C5A",
    secondary: "#5A6B8A",
    muted: "#8A99B5",
    onAccent: "#FFFFFF",
  },
  accent: {
    primary: "#7B9ACC",
    secondary: "#B8B8FF",
    tertiary: "#A8C2E5",
    success: "#92C5C5",
    danger: "#E08AA8",
    star: "#FFD27F",
  },
  tiles: [
    "#7B9ACC", // blueberry
    "#B8B8FF", // lavender milk
    "#A8C2E5", // sky milk
    "#C8B8FF", // periwinkle
    "#FFFFFF", // milk
    "#A8D8E5", // mist
    "#94A8E0", // cornflower
    "#D8C8FF", // dawn
  ],
  tile: {
    arrowColor: "#1F2A45",
    arrowHighlight: "rgba(255,255,255,0.60)",
    borderColor: "rgba(255,255,255,0.92)",
    innerHighlight: "rgba(255,255,255,0.60)",
    shadowColor: "rgba(80, 110, 170, 0.30)",
    bloomOpacity: 0.20,
    glossOpacity: 0.62,
  },
  surface: {
    background: "rgba(255, 255, 255, 0.55)",
    border: "rgba(123, 154, 204, 0.22)",
    backdropBlur: "blur(20px) saturate(140%)",
    raised: "linear-gradient(160deg, rgba(255,255,255,0.85), rgba(217,230,255,0.60))",
    raisedBorder: "rgba(123, 154, 204, 0.30)",
  },
  shadow: {
    soft: "0 12px 28px rgba(80, 110, 170, 0.12)",
    raised: "0 24px 48px rgba(80, 110, 170, 0.20), 0 4px 10px rgba(80, 110, 170, 0.10)",
    primaryGlow: "0 0 32px rgba(184, 184, 255, 0.50)",
  },
  ambient: {
    kind: "bubbles",
    colors: ["#B8B8FF", "#A8C2E5", "#FFFFFF", "#D8C8FF"],
    density: 0.75,
  },
  particle: {
    accents: ["#B8B8FF", "#A8C2E5", "#FFFFFF", "#7B9ACC"],
    shape: "bubble",
  },
  audio: {
    waveform: "sine",
    masterGain: 0.30,
    clearA: 1318,
    clearB: 1760,
    slideStart: 988,
    slideEnd: 740,
    winNotes: [523, 659, 784, 988, 1175],
    tap: 1480,
  },
};

const lavenderHoney: ThemeTokens = {
  id: "lavender-honey",
  name: "Lavender Honey",
  tagline: "Golden hour, warm and quiet.",
  mood: ["warm", "elegant", "twilight"],

  bg: {
    base: "#F7F0FF",
    gradient:
      "radial-gradient(120% 80% at 70% 18%, #FFE9C7 0%, #F7F0FF 45%, #EBDDFF 100%)",
    grainOpacity: 0.06,
  },
  board: {
    fill: "linear-gradient(160deg, #E5D5FF 0%, #F2E5FF 55%, #DDC8FA 100%)",
    stroke: "rgba(160, 132, 210, 0.30)",
    innerShadow: "inset 0 1px 0 rgba(255,255,255,0.65), inset 0 -22px 44px rgba(160, 132, 210, 0.12)",
    outerShadow: "0 28px 56px rgba(130, 95, 180, 0.18), 0 6px 16px rgba(160, 132, 210, 0.12)",
    cellFill: "rgba(245, 235, 255, 0.55)",
    cellStroke: "rgba(160, 132, 210, 0.22)",
    cellInner: "rgba(195, 165, 230, 0.18)",
  },
  fg: {
    primary: "#3D2D5A",
    secondary: "#6B5A8A",
    muted: "#9C8DBC",
    onAccent: "#FFFFFF",
  },
  accent: {
    primary: "#A084D2",
    secondary: "#E8B86D",
    tertiary: "#C8B0E8",
    success: "#A8C58A",
    danger: "#D88A9F",
    star: "#FFC857",
  },
  tiles: [
    "#A084D2", // lavender
    "#C8B0E8", // lilac
    "#E8B86D", // honey gold
    "#FFD7A8", // pale honey
    "#B89AE0", // wisteria
    "#FFE5C2", // butter cream
    "#9D7DC8", // dusk violet
    "#E0C898", // wheat
  ],
  tile: {
    arrowColor: "#2E1F4A",
    arrowHighlight: "rgba(255,250,235,0.55)",
    borderColor: "rgba(255,250,235,0.85)",
    innerHighlight: "rgba(255,250,235,0.55)",
    shadowColor: "rgba(95, 65, 145, 0.30)",
    bloomOpacity: 0.20,
    glossOpacity: 0.55,
  },
  surface: {
    background: "rgba(255, 250, 245, 0.55)",
    border: "rgba(160, 132, 210, 0.22)",
    backdropBlur: "blur(18px) saturate(135%)",
    raised: "linear-gradient(160deg, rgba(255,250,245,0.85), rgba(232,220,255,0.60))",
    raisedBorder: "rgba(160, 132, 210, 0.30)",
  },
  shadow: {
    soft: "0 12px 28px rgba(95, 65, 145, 0.14)",
    raised: "0 24px 48px rgba(95, 65, 145, 0.22), 0 4px 10px rgba(95, 65, 145, 0.12)",
    primaryGlow: "0 0 30px rgba(232, 184, 109, 0.45)",
  },
  ambient: {
    kind: "fireflies",
    colors: ["#E8B86D", "#FFD7A8", "#C8B0E8", "#FFE5C2"],
    density: 0.6,
  },
  particle: {
    accents: ["#A084D2", "#E8B86D", "#FFD7A8", "#FFFFFF"],
    shape: "spark",
  },
  audio: {
    waveform: "sine",
    masterGain: 0.34,
    clearA: 1109,
    clearB: 1480,
    slideStart: 698,
    slideEnd: 523,
    winNotes: [466, 587, 698, 880, 1109],
    tap: 1244,
  },
};

const peachSorbet: ThemeTokens = {
  id: "peach-sorbet",
  name: "Peach Sorbet",
  tagline: "Sunset on a slow Sunday.",
  mood: ["warm", "soft", "summer"],

  bg: {
    base: "#FFF3EC",
    gradient:
      "radial-gradient(120% 80% at 22% 12%, #FFE0CC 0%, #FFF3EC 42%, #FFD8C0 100%)",
    grainOpacity: 0.06,
  },
  board: {
    fill: "linear-gradient(160deg, #FFD2B8 0%, #FFE0CC 55%, #FFC4A3 100%)",
    stroke: "rgba(240, 140, 105, 0.30)",
    innerShadow: "inset 0 1px 0 rgba(255,255,255,0.60), inset 0 -22px 44px rgba(240, 140, 105, 0.12)",
    outerShadow: "0 28px 56px rgba(220, 110, 80, 0.18), 0 6px 16px rgba(240, 140, 105, 0.12)",
    cellFill: "rgba(255, 232, 218, 0.55)",
    cellStroke: "rgba(240, 140, 105, 0.22)",
    cellInner: "rgba(255, 180, 145, 0.18)",
  },
  fg: {
    primary: "#5A3322",
    secondary: "#8C5A40",
    muted: "#BC8E72",
    onAccent: "#FFFFFF",
  },
  accent: {
    primary: "#F08C69",
    secondary: "#E5A87A",
    tertiary: "#FFB89A",
    success: "#9CC58A",
    danger: "#DD6F6B",
    star: "#FFC857",
  },
  tiles: [
    "#F08C69", // peach
    "#FFB89A", // sorbet
    "#FFD2A8", // apricot cream
    "#E5A87A", // golden peach
    "#FFC8B8", // coral cream
    "#F4D7A8", // butter cream
    "#FFA988", // tangerine soft
    "#E8C4A0", // tan beige
  ],
  tile: {
    arrowColor: "#4A2418",
    arrowHighlight: "rgba(255,250,235,0.55)",
    borderColor: "rgba(255,250,235,0.85)",
    innerHighlight: "rgba(255,250,235,0.55)",
    shadowColor: "rgba(200, 90, 60, 0.32)",
    bloomOpacity: 0.18,
    glossOpacity: 0.55,
  },
  surface: {
    background: "rgba(255, 250, 245, 0.55)",
    border: "rgba(240, 140, 105, 0.22)",
    backdropBlur: "blur(18px) saturate(135%)",
    raised: "linear-gradient(160deg, rgba(255,250,245,0.85), rgba(255,224,204,0.60))",
    raisedBorder: "rgba(240, 140, 105, 0.30)",
  },
  shadow: {
    soft: "0 12px 28px rgba(220, 110, 80, 0.14)",
    raised: "0 24px 48px rgba(220, 110, 80, 0.22), 0 4px 10px rgba(220, 110, 80, 0.12)",
    primaryGlow: "0 0 28px rgba(240, 140, 105, 0.45)",
  },
  ambient: {
    kind: "petals",
    colors: ["#FFB89A", "#F08C69", "#FFD2A8", "#F4D7A8"],
    density: 0.65,
  },
  particle: {
    accents: ["#F08C69", "#FFB89A", "#FFD2A8", "#FFFFFF"],
    shape: "petal",
  },
  audio: {
    waveform: "sine",
    masterGain: 0.34,
    clearA: 988,
    clearB: 1318,
    slideStart: 740,
    slideEnd: 554,
    winNotes: [523, 622, 740, 880, 1109],
    tap: 1175,
  },
};

export const THEMES: ThemeTokens[] = [
  strawberryMarshmallow,
  matchaCafe,
  blueberryMilk,
  lavenderHoney,
  peachSorbet,
];

export const THEME_MAP: Record<string, ThemeTokens> = Object.fromEntries(
  THEMES.map((t) => [t.id, t])
);

export const DEFAULT_THEME_ID = "strawberry-marshmallow";

export function getTheme(id: string): ThemeTokens {
  return THEME_MAP[id] ?? THEME_MAP[DEFAULT_THEME_ID];
}
