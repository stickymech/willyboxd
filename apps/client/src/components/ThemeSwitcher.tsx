import { useState } from "react";
import { THEMES, useTheme } from "../lib/theme";
import type { ThemeId } from "../lib/theme";

const THEME_LABELS: Record<ThemeId, string> = {
  amber: "Classic Amber",
  spotify: "Spotify",
  runway: "Runway",
  linear: "Linear",
};

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-center w-8 h-8 rounded-full text-text-subtle hover:text-text transition-colors"
        aria-label="Change theme"
        aria-expanded={open}
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          viewBox="0 0 24 24"
        >
          <circle cx="12" cy="12" r="3" />
          <path
            strokeLinecap="round"
            d="M12 1v4m0 14v4M4.2 4.2l2.8 2.8m10 10 2.8 2.8M1 12h4m14 0h4M4.2 19.8l2.8-2.8m10-10 2.8-2.8"
          />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-44 py-1 bg-surface border border-border rounded-lg shadow-card">
            {THEMES.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setTheme(id);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${
                  theme === id ? "text-accent" : "text-text-muted hover:text-text"
                }`}
              >
                <span
                  className="inline-block w-3 h-3 rounded-full"
                  data-theme-preview={id}
                />
                <span>{THEME_LABELS[id]}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
