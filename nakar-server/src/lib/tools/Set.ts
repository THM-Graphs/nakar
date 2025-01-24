// eslint-disable-next-line no-restricted-globals
export class SSet<T> extends Set<T> {
  // eslint-disable-next-line no-restricted-globals
  public static upgrade<T>(old: Set<T>): SSet<T> {
    const s: SSet<T> = new SSet<T>();

    for (const entry of old.values()) {
      s.add(entry);
    }

    return s;
  }

  public toArray(): T[] {
    return [...this.values()];
  }

  public copy(): SSet<T> {
    return new SSet<T>(this);
  }

  public byMerging(other: SSet<T>): SSet<T> {
    const result = this.copy();
    for (const value of other) {
      result.add(value);
    }
    return result;
  }

  public reduce<U>(callback: (akku: U, next: T) => U, start: U): U {
    let accumulator = start;
    for (const value of this) {
      accumulator = callback(accumulator, value);
    }
    return accumulator;
  }

  public filter(callback: (element: T) => boolean): SSet<T> {
    const result = new SSet<T>();
    for (const value of this) {
      if (callback(value)) {
        result.add(value);
      }
    }
    return result;
  }
}
