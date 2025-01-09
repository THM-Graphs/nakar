export function getStringValueOfFirstProperty(
  properties: Record<string, unknown>,
): string | null {
  const firstProp = Object.values(properties)[0];
  if (typeof firstProp !== 'string') {
    return null;
  }
  return firstProp;
}
