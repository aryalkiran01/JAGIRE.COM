import { useEffect, useState, useCallback } from "react";
import { initTheme, toggleTheme, type Theme } from "@/lib/theme";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>("light"); // Default to light

  useEffect(() => {
    // Initialize theme and get the actual applied theme
    const currentTheme = document.documentElement.classList.contains("dark") ? "dark" : "light";
    setTheme(currentTheme);

    // Listen for system theme changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      // Only update if no stored preference
      if (!localStorage.getItem("jagire-theme")) {
        setTheme(e.matches ? "dark" : "light");
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const toggle = useCallback(() => {
    const next = toggleTheme();
    setTheme(next);
  }, []);

  return { theme, toggle };
}
