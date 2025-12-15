import { MouseEvent } from "react";

function isMacOS() {
  return navigator.userAgent.toLowerCase().includes("mac");
}

export function isMultiSelectKey(event: PointerEvent | MouseEvent): boolean {
  return isMacOS() ? event.metaKey : event.ctrlKey;
}
