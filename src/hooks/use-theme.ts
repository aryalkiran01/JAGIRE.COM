import { useEffect, useState, useCallback } from "react";
import { initTheme, toggleTheme, type Theme } from "@/lib/theme";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    initTheme();
    const stored = document.documentElement.classList.contains("dark") ? "dark" : "light";
    setTheme(stored);
  }, []);

  const toggle = useCallback(() => {
    const next = toggleTheme();
    setTheme(next);
  }, []);

  return { theme, toggle };
}
