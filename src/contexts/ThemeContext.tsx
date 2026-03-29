import { createContext, useState, useEffect, useCallback, useMemo, useRef, type ReactNode } from "react";
import { STORAGE_KEYS } from "@/lib/storageKeys";

type Theme = "dark" | "light";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME);
    return (saved as Theme) || "light";
  });
  const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
    
    // Apply theme class to document
    const root = document.documentElement;
    if (theme === "light") {
      root.classList.add("light");
      root.classList.remove("dark");
    } else {
      root.classList.add("dark");
      root.classList.remove("light");
    }
  }, [theme]);

  const setTheme = useCallback((newTheme: Theme) => {
    // Add transition class for smooth theme change
    document.documentElement.classList.add("theme-transitioning");
    setThemeState(newTheme);
    
    // Clear any existing timeout
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
    }
    
    // Remove transition class after animation
    transitionTimeoutRef.current = setTimeout(() => {
      document.documentElement.classList.remove("theme-transitioning");
    }, 200);
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

