import { Theme } from "./Theme.ts";
import { useBearStore } from "../../state/useBearStore.ts";

export function loadSystemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function applyTheme(theme: Theme): void {
  console.log(`Will apply theme to html: ${theme}`);
  document.documentElement.setAttribute("data-bs-theme", theme);
}

export function bootstrapTheme(): void {
  const theme =
    useBearStore.getState().global.theme.user ??
    useBearStore.getState().global.theme.system;

  applyTheme(theme);

  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", (event) => {
      const theme: Theme = event.matches ? "dark" : "light";
      useBearStore.getState().global.theme.setSystemTheme(theme);
    });
}
