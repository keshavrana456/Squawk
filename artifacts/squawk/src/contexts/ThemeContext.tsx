import { createContext, useContext, useState, useEffect } from "react";

type Theme = "dark" | "light";

interface ThemeCtx {
  theme: Theme;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeCtx>({ theme: "dark", toggle: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const saved = (localStorage.getItem("squawk-theme") as Theme) || "dark";
      const root = document.documentElement;
      if (saved === "dark") { root.classList.add("dark"); root.classList.remove("light"); }
      else { root.classList.add("light"); root.classList.remove("dark"); }
      return saved;
    } catch {
      document.documentElement.classList.add("dark");
      return "dark";
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.remove("dark");
      root.classList.add("light");
    }
    try { localStorage.setItem("squawk-theme", theme); } catch {}
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggle: () => setTheme(t => t === "dark" ? "light" : "dark") }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
