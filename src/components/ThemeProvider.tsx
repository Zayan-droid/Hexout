import { useEffect } from "react";
import { useThemeStore, applyThemeToDocument } from "@/store/themeStore";
import { getTheme } from "@/themes";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const themeId = useThemeStore((s) => s.themeId);

  useEffect(() => {
    applyThemeToDocument(getTheme(themeId));
  }, [themeId]);

  return <>{children}</>;
}

export function useTheme() {
  const themeId = useThemeStore((s) => s.themeId);
  return getTheme(themeId);
}
