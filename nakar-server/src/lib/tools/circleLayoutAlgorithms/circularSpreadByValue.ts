/**
 * Rearranges an array so that large values are spread out in a circular sense.
 * @param arr - The input array of generic items.
 * @param getValue - A function that extracts a numeric value from each item.
 * @returns A new array with items spread out so that large values are distant.
 */
export function circularSpreadByValue<T>(
  arr: T[],
  getValue: (item: T) => number,
): T[] {
  const sorted: T[] = [...arr].sort(
    (a: T, b: T): number => getValue(b) - getValue(a),
  ); // Descending order
  const n: number = sorted.length;
  const result: (T | null)[] = new Array<T | null>(n).fill(null);

  let index: number = 0;
  const step: number = Math.floor(n / 2) || 1;

  // Spread out values using round-robin stepping
  for (const item of sorted) {
    while (result[index] !== null) {
      index = (index + 1) % n;
    }
    result[index] = item;
    index = (index + step) % n;
  }

  // Fallback: Fill any remaining nulls (edge case for some array lengths)
  for (let i: number = 0; i < n; i++) {
    if (result[i] == null) {
      result[i] = sorted.pop() ?? null;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  return result as T[];
}
