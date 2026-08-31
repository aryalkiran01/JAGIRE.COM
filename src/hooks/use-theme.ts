import { useEffect, useState, useCallback } from "react";
import { applyTheme, toggleTheme, type Theme } from "@/lib/theme";

export function useTheme() {
  // Read from actual DOM state instead of hardcoding "light"
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      return document.documentElement.classList.contains("dark") ? "dark" : "light";
    }
    return "light";
  });

  useEffect(() => {
    // Force light theme if no stored preference
    const stored = localStorage.getItem("jagire-theme");
    if (!stored) {
      applyTheme("light");
      setTheme("light");
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem("jagire-theme")) {
        const newTheme: Theme = e.matches ? "dark" : "light";
        applyTheme(newTheme);
        setTheme(newTheme);
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
