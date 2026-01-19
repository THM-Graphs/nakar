import { useBearStore } from "./useBearStore.ts";

export function useIsLoggedIn(): boolean {
  const username = useBearStore((s) => s.global.auth.username);
  if (username == null) {
    return false;
  } else {
    return true;
  }
}
