function isMacOS() {
  return navigator.userAgent.toLowerCase().includes("mac");
}

export function isMultiSelectKey(event: PointerEvent): boolean {
  return isMacOS() ? event.metaKey : event.ctrlKey;
}
