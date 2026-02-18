import { useBearStore } from "../../state/useBearStore.ts";

export function useTheme() {
  const userTheme = useBearStore((s) => s.global.theme.user);
  const systemTheme = useBearStore((s) => s.global.theme.system);

  return userTheme ?? systemTheme;
}
