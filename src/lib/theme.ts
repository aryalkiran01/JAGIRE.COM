const STORAGE_KEY = "jagire-theme";

export type Theme = "light" | "dark";

export function getStoredTheme(): Theme | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    /* ignore */
  }
  return null;
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* ignore */
  }
}

export function initTheme() {
  const stored = getStoredTheme();
  if (stored) {
    applyTheme(stored);
    return;
  }
  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  if (prefersDark) applyTheme("dark");
}

export function toggleTheme(): Theme {
  const isDark = document.documentElement.classList.contains("dark");
  const next: Theme = isDark ? "light" : "dark";
  applyTheme(next);
  return next;
}
