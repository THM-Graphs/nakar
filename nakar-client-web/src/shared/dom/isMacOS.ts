export function isMacOS(): boolean {
  return navigator.userAgent.toLowerCase().includes("mac");
}
