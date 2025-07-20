/**
 * Platziert große Werte maximal weit auseinander in einem Kreis.
 * Je größer der Wert, desto weiter sollen die Elemente voneinander entfernt sein.
 */
export function circularWeightedSpread<T>(
  arr: T[],
  getValue: (item: T) => number,
): T[] {
  const n: number = arr.length;
  const sorted: T[] = [...arr].sort(
    (a: T, b: T): number => getValue(b) - getValue(a),
  ); // Absteigend
  const result: (T | null)[] = new Array<T | null>(n).fill(null);

  // Anzahl "wichtiger" (großer) Elemente – heuristisch: oberes Drittel
  const k: number = Math.ceil(n / 3);
  const top: T[] = sorted.slice(0, k);
  const rest: T[] = sorted.slice(k);

  // Verteile die Top-Werte gleichmäßig im Kreis
  for (let i: number = 0; i < top.length; i++) {
    const pos: number = Math.round((i * n) / k) % n;
    result[pos] = top[i];
  }

  // Fülle die übrigen Plätze
  let fillIndex: number = 0;
  for (const item of rest) {
    while (result[fillIndex] !== null) {
      fillIndex++;
    }
    result[fillIndex] = item;
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  return result as T[];
}
