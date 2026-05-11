import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_THEME_ID, getTheme, THEMES } from "@/themes";
import type { ThemeTokens } from "@/types/theme";

interface ThemeState {
  themeId: string;
  setTheme: (id: string) => void;
  current: () => ThemeTokens;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      themeId: DEFAULT_THEME_ID,
      setTheme: (id: string) => {
        if (!THEMES.find((t) => t.id === id)) return;
        set({ themeId: id });
      },
      current: () => getTheme(get().themeId),
    }),
    { name: "hexout-theme" }
  )
);

export function applyThemeToDocument(t: ThemeTokens) {
  const root = document.documentElement;
  const s = root.style;

  // Background
  s.setProperty("--bg-base", t.bg.base);
  s.setProperty("--bg-gradient", t.bg.gradient);
  s.setProperty("--bg-grain-opacity", String(t.bg.grainOpacity));

  // Board
  s.setProperty("--board-fill", t.board.fill);
  s.setProperty("--board-stroke", t.board.stroke);
  s.setProperty("--board-inner-shadow", t.board.innerShadow);
  s.setProperty("--board-outer-shadow", t.board.outerShadow);
  s.setProperty("--cell-fill", t.board.cellFill);
  s.setProperty("--cell-stroke", t.board.cellStroke);
  s.setProperty("--cell-inner", t.board.cellInner);

  // Foreground
  s.setProperty("--fg-primary", t.fg.primary);
  s.setProperty("--fg-secondary", t.fg.secondary);
  s.setProperty("--fg-muted", t.fg.muted);
  s.setProperty("--fg-on-accent", t.fg.onAccent);

  // Accent
  s.setProperty("--accent-primary", t.accent.primary);
  s.setProperty("--accent-secondary", t.accent.secondary);
  s.setProperty("--accent-tertiary", t.accent.tertiary);
  s.setProperty("--accent-success", t.accent.success);
  s.setProperty("--accent-danger", t.accent.danger);
  s.setProperty("--accent-star", t.accent.star);

  // Surface
  s.setProperty("--surface-bg", t.surface.background);
  s.setProperty("--surface-border", t.surface.border);
  s.setProperty("--surface-blur", t.surface.backdropBlur);
  s.setProperty("--surface-raised", t.surface.raised);
  s.setProperty("--surface-raised-border", t.surface.raisedBorder);

  // Shadows
  s.setProperty("--shadow-soft", t.shadow.soft);
  s.setProperty("--shadow-raised", t.shadow.raised);
  s.setProperty("--shadow-primary-glow", t.shadow.primaryGlow);

  // Tile finish
  s.setProperty("--tile-arrow", t.tile.arrowColor);
  s.setProperty("--tile-arrow-hl", t.tile.arrowHighlight);
  s.setProperty("--tile-border", t.tile.borderColor);
  s.setProperty("--tile-inner-hl", t.tile.innerHighlight);
  s.setProperty("--tile-shadow", t.tile.shadowColor);

  // Set body background directly because gradient is needed there
  document.body.style.background = t.bg.gradient;
}
