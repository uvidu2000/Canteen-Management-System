import { useEffect, useMemo, useState } from "react";
import { STORAGE_KEYS } from "@/constants/storage";
import { getStorageItem, setStorageItem } from "@/utils/storage";

export type Theme = "light" | "dark";

const DEFAULT_THEME: Theme = "light";

function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    return getStorageItem<Theme>(STORAGE_KEYS.theme) ?? DEFAULT_THEME;
  });

  useEffect(() => {
    applyTheme(theme);
    setStorageItem(STORAGE_KEYS.theme, theme);
  }, [theme]);

  return useMemo(
    () => ({
      theme,
      setTheme: setThemeState,
      toggleTheme: () => setThemeState((current) => (current === "dark" ? "light" : "dark"))
    }),
    [theme]
  );
}
