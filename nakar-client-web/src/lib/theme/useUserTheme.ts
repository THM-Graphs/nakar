import { useContext, useEffect, useState } from "react";
import { Subscription } from "rxjs";
import { UserTheme } from "./UserTheme.ts";
import { ThemeManagerContext } from "./ThemeManagerContext.ts";

export function useUserTheme(): [UserTheme, (newTheme: UserTheme) => void] {
  const themeManager = useContext(ThemeManagerContext);
  const [theme, setTheme] = useState<UserTheme>(themeManager.loadUserTheme());

  useEffect((): (() => void) => {
    const subscription: Subscription = themeManager.$userTheme.subscribe(
      (value: UserTheme): void => {
        setTheme(value);
      },
    );
    return (): void => {
      subscription.unsubscribe();
    };
  }, [themeManager]);

  return [
    theme,
    (newTheme: UserTheme) => {
      themeManager.$userTheme.next(newTheme);
    },
  ];
}
