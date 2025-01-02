import { createContext } from "react";
import { ThemeManager } from "./ThemeManager.ts";

export const ThemeManagerContext = createContext(new ThemeManager());
