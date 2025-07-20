export function zigZagMedianSort<T>(
  arr: T[],
  getValue: (item: T) => number,
): T[] {
  const sorted: T[] = [...arr].sort(
    (a: T, b: T): number => getValue(a) - getValue(b),
  );
  const result: T[] = [];

  let left: number = 0;
  let right: number = sorted.length - 1;

  for (let i: number = 0; i < sorted.length; i++) {
    if (i % 2 === 0) {
      result.push(sorted[left++]);
    } else {
      result.push(sorted[right--]);
    }
  }

  return result;
}
