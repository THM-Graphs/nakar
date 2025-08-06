import { UserTheme } from "./UserTheme.ts";
import { Theme } from "./Theme.ts";
import { match } from "ts-pattern";
import { useBearStore } from "../state/useBearStore.ts";

const localStorageKey = "user_theme";

export function loadUserTheme(): UserTheme {
  return match(localStorage.getItem(localStorageKey))
    .returnType<UserTheme>()
    .with("dark", () => "dark")
    .with("light", () => "light")
    .otherwise(() => null);
}

export function saveUserTheme(theme: UserTheme): void {
  if (theme == null) {
    localStorage.removeItem(localStorageKey);
  } else {
    localStorage.setItem(localStorageKey, theme);
  }
}

export function loadSystemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute("data-bs-theme", theme);
}

export function bootstrapTheme(): void {
  applyTheme(
    useBearStore.getState().global.theme.user ??
      useBearStore.getState().global.theme.system,
  );

  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", (event) => {
      const theme: Theme = event.matches ? "dark" : "light";
      useBearStore.getState().global.theme.setSystemTheme(theme);
    });
}
