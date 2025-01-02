import { BehaviorSubject } from "rxjs";
import { UserTheme } from "./UserTheme.ts";
import { Theme } from "./Theme.ts";

export class ThemeManager {
  private readonly localStorageKey = "user_theme";

  public readonly $userTheme: BehaviorSubject<UserTheme>;

  constructor() {
    this.$userTheme = new BehaviorSubject(this.loadUserTheme());

    this.$userTheme.subscribe((userTheme: UserTheme): void => {
      this.saveUserTheme(userTheme);
      this.bootstrapTheme();
    });
  }

  public loadUserTheme(): UserTheme {
    return localStorage.getItem(this.localStorageKey) as UserTheme;
  }

  private saveUserTheme(theme: UserTheme): void {
    if (theme == null) {
      localStorage.removeItem(this.localStorageKey);
    } else {
      localStorage.setItem(this.localStorageKey, theme);
    }
  }

  public loadSystemTheme(): Theme {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  private applyTheme(theme: Theme): void {
    document.documentElement.setAttribute("data-bs-theme", theme);
  }

  public bootstrapTheme(): void {
    this.applyTheme(this.loadUserTheme() ?? this.loadSystemTheme());
  }
}
