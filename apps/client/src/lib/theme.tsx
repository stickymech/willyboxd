import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

export const THEMES = ["amber", "spotify", "runway", "linear"] as const;

export type ThemeId = (typeof THEMES)[number];

const THEME_STORAGE_KEY = "willyboxd-theme";
const DEFAULT_THEME: ThemeId = "amber";

interface ThemeContextValue {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function isThemeId(value: string | null): value is ThemeId {
  return !!value && (THEMES as readonly string[]).includes(value);
}

function readStoredTheme(): ThemeId {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  const theme = isThemeId(stored) ? stored : DEFAULT_THEME;
  document.documentElement.dataset.theme = theme;
  return theme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(readStoredTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const setTheme = (next: ThemeId) => {
    localStorage.setItem(THEME_STORAGE_KEY, next);
    setThemeState(next);
  };

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}
