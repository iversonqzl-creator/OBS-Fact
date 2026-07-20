import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const [dark, setDark] = useState(() => localStorage.getItem("w2e_theme") === "dark");

  useEffect(() => {
    const root = document.documentElement;
    if (dark) root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem("w2e_theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <button
      data-testid="theme-toggle-button"
      onClick={() => setDark((d) => !d)}
      className="grid h-10 w-10 place-items-center border border-border bg-surface text-foreground transition-colors hover:bg-muted"
      aria-label="Toggle theme"
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
