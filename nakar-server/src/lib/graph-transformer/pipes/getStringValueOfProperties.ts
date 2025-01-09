export function getStringValueOfProperties(
  properties: Record<string, unknown>,
  key: string,
): string | null {
  const value = properties[key];
  if (typeof value !== 'string') {
    return null;
  }
  return value;
}
