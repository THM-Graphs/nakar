import { createContext } from "react";
import { ThemeManager } from "./ThemeManager.ts";

export const themeManager = new ThemeManager();
export const ThemeManagerContext = createContext(themeManager);
