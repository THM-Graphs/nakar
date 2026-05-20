import { ActionShortcut } from "./Action.ts";

export function createAppShortcut(keys: string): ActionShortcut {
  return {
    keys,
    preventDefault: true,
  };
}
