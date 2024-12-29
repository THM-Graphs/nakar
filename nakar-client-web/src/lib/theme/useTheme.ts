import { useUserTheme } from "./useUserTheme.ts";
import { Theme } from "./Theme.ts";
import { useContext } from "react";
import { ThemeManagerContext } from "./ThemeManagerContext.ts";

export function useTheme(): Theme {
  const [userTheme] = useUserTheme();
  const themeManager = useContext(ThemeManagerContext);

  return userTheme ?? themeManager.loadSystemTheme();
}
