/**
 * @file components/layout/ThemeToggle.tsx
 * @description Tombol toggle untuk beralih antara Dark Mode dan Light Mode.
 */
"use client";

import { useEffect, useState } from "react";
import { useTheme } from "./ThemeProvider";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="p-2 w-9 h-9" /> // Placeholder to avoid layout shift
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700 transition-all duration-300"
      title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
      suppressHydrationWarning
    >
      {theme === "light" ? (
        <Moon className="w-5 h-5" />
      ) : (
        <Sun className="w-5 h-5 text-yellow-400" />
      )}
    </button>
  );
}
