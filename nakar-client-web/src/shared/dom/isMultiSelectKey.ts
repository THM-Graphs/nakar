import { MouseEvent } from "react";
import { isMacOS } from "./isMacOS.ts";

export function isMultiSelectKey(event: PointerEvent | MouseEvent): boolean {
  return isMacOS() ? event.metaKey : event.ctrlKey;
}
