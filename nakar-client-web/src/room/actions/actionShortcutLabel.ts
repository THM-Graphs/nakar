import { isMacOS } from "../../shared/dom/isMacOS.ts";
import { Action, ActionShortcut } from "./Action.ts";

const macTokenMap: Record<string, string> = {
  $mod: "⌘",
  alt: "⌥",
  backspace: "⌫",
  enter: "↵",
  escape: "Esc",
  shift: "⇧",
};

const defaultTokenMap: Record<string, string> = {
  $mod: "Ctrl",
  alt: "Alt",
  backspace: "Backspace",
  enter: "Enter",
  escape: "Esc",
  shift: "Shift",
};

function formatShortcutToken(token: string): string {
  const normalizedToken = token.trim().toLowerCase();
  const tokenMap = isMacOS() ? macTokenMap : defaultTokenMap;
  const mappedToken = tokenMap[normalizedToken];
  if (mappedToken) {
    return mappedToken;
  }
  if (/^key[a-z]$/i.test(token)) {
    return token.slice(-1).toUpperCase();
  }
  if (token.length === 1) {
    return token.toUpperCase();
  }
  return token.charAt(0).toUpperCase() + token.slice(1);
}

export function formatActionShortcut(shortcut: ActionShortcut): string {
  const formattedPresses = shortcut.keys.split(" ").map((press) => {
    const formattedTokens = press
      .split("+")
      .map((token) => formatShortcutToken(token));
    return isMacOS() ? formattedTokens.join("") : formattedTokens.join("+");
  });
  return formattedPresses.join(" ");
}

export function getActionShortcutLabel<T>(
  action: Action<T>,
  input: T,
): string | null {
  const shortcut = action.shortcut(input);
  if (shortcut == null) {
    return null;
  }
  return formatActionShortcut(shortcut);
}
