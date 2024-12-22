import { BehaviorSubject } from "rxjs";

const localStorageKey = "user_theme";

export const userTheme = new BehaviorSubject<"dark" | "light" | null>(
  localStorage.getItem(localStorageKey) as "dark" | "light" | null,
);

function getSystemTheme(): "dark" | "light" {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function setTheme(theme: "dark" | "light") {
  document.documentElement.setAttribute("data-bs-theme", theme);
}

userTheme.asObservable().subscribe((theme) => {
  if (theme == null) {
    localStorage.removeItem(localStorageKey);
  } else {
    localStorage.setItem(localStorageKey, theme);
  }

  setTheme(theme ?? getSystemTheme());
});
