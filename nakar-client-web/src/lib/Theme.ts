import { useState } from "react";

const localStorageKey = "user_theme";

function getUserTheme() {
  return localStorage.getItem(localStorageKey) as "dark" | "light" | null;
}

function setUserTheme(theme: "dark" | "light" | null) {
  if (theme == null) {
    localStorage.removeItem(localStorageKey);
  } else {
    localStorage.setItem(localStorageKey, theme);
  }
}

function getSystemTheme(): "dark" | "light" {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(theme: "dark" | "light") {
  document.documentElement.setAttribute("data-bs-theme", theme);
}

export const useTheme = (): [
  "dark" | "light",
  (newTheme: "dark" | "light" | null) => void,
] => {
  const [theme, setTheme] = useState<"dark" | "light">(
    getUserTheme() ?? getSystemTheme(),
  );

  return [
    theme,
    (newTheme: "dark" | "light" | null) => {
      setUserTheme(newTheme);
      setTheme(getUserTheme() ?? getSystemTheme());
      applyTheme(getUserTheme() ?? getSystemTheme());
    },
  ];
};
