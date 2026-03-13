"use client";

import { useCallback, useEffect } from "react";

type ThemeVars = Record<string, string>;

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const applyTheme = useCallback((theme: ThemeVars) => {
    const root = document.documentElement;
    for (const [key, value] of Object.entries(theme)) {
      if (value) {
        root.style.setProperty(`--${key}`, value);
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchTheme() {
      try {
        const res = await fetch("/api/tenant-settings");
        if (!res.ok || cancelled) return;
        const { theme } = await res.json();
        if (theme && typeof theme === "object") {
          applyTheme(theme);
        }
      } catch {
        // Varsayılan tema (globals.css) kullanılır
      }
    }

    fetchTheme();
    return () => {
      cancelled = true;
    };
  }, [applyTheme]);

  return <>{children}</>;
}
