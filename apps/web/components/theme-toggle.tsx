"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import * as React from "react";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Zamedzenie hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={`w-9 h-9 rounded-xl border border-[var(--page-border)] bg-[var(--page-card-bg)] opacity-50 ${className}`}
        aria-hidden="true"
      />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Prepnúť na svetlý motív" : "Prepnúť na tmavý motív"}
      className={`relative inline-flex items-center justify-center w-9 h-9 rounded-xl border border-[var(--page-border)] bg-[var(--page-card-bg)] backdrop-blur-md text-[var(--page-fg)] hover:opacity-90 active:scale-95 transition-all shadow-sm ${className}`}
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-transform duration-300 dark:-rotate-90 dark:scale-0 text-amber-500" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-transform duration-300 dark:rotate-0 dark:scale-100 text-sky-400" />
      <span className="sr-only">Prepnúť motív</span>
    </button>
  );
}

export default ThemeToggle;
