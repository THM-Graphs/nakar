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
    const result: SSet<T> = this.copy();
    for (const value of other) {
      result.add(value);
    }
    return result;
  }

  public reduce<U>(callback: (akku: U, next: T) => U, start: U): U {
    let accumulator: U = start;
    for (const value of this) {
      accumulator = callback(accumulator, value);
    }
    return accumulator;
  }

  public filter(callback: (element: T) => boolean): SSet<T> {
    const result: SSet<T> = new SSet<T>();
    for (const value of this) {
      if (callback(value)) {
        result.add(value);
      }
    }
    return result;
  }

  public async asyncMap<U>(cb: (element: T) => Promise<U>): Promise<SSet<U>> {
    const n: SSet<U> = new SSet<U>();
    for (const el of this) {
      n.add(await cb(el));
    }
    return n;
  }

  public byAdding(value: T): SSet<T> {
    const result: SSet<T> = this.copy();
    for (const oldValues of this) {
      result.add(oldValues);
    }
    result.add(value);
    return result;
  }

  public async asyncFlatMap<V>(mapper: (value: T) => Promise<V>): Promise<V[]> {
    const n: V[] = [];
    for (const el of this) {
      n.push(await mapper(el));
    }
    return n;
  }

  public flatMap<V>(mapper: (value: T) => V): V[] {
    const n: V[] = [];
    for (const el of this) {
      n.push(mapper(el));
    }
    return n;
  }

  public find(filter: (element: T) => boolean): T | null {
    for (const value of this) {
      if (filter(value)) {
        return value;
      }
    }
    return null;
  }

  public map<U>(cb: (element: T) => U): SSet<U> {
    const n: SSet<U> = new SSet<U>();
    for (const el of this) {
      n.add(cb(el));
    }
    return n;
  }
}
