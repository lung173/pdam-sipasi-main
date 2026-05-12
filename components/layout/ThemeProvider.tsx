/**
 * @file components/layout/ThemeProvider.tsx
 * @description Provider untuk mengelola tema (Dark/Light) aplikasi.
 */
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Ambil tema dari localStorage, default ke terang jika belum ada
    const savedTheme = localStorage.getItem("theme") as Theme;
    const initialTheme = savedTheme || "light";
    setTheme(initialTheme);
    applyTheme(initialTheme);
    setMounted(true);
  }, []);

  const applyTheme = (t: Theme) => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(t);
    localStorage.setItem("theme", t);
  };

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    applyTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
