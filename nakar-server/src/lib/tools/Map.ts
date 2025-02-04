// eslint-disable-next-line no-restricted-globals
export class SMap<K extends string | number | symbol, V> extends Map<K, V> {
  public static fromRecord<K extends string | number | symbol, V>(record: Record<K, V>): SMap<K, V> {
    const map: SMap<K, V> = new SMap<K, V>();
    for (const key in record) {
      map.set(key as K, record[key]);
    }
    return map;
  }

  public filter(callback: (value: V, key: K) => boolean): SMap<K, V> {
    const filteredMap: SMap<K, V> = new SMap<K, V>();
    for (const [key, value] of this) {
      if (callback(value, key)) {
        filteredMap.set(key, value);
      }
    }
    return filteredMap;
  }

  public map<U>(callback: (value: V, key: K, index: number) => U): SMap<K, U> {
    const mappedMap: SMap<K, U> = new SMap<K, U>();
    let index: number = 0;
    for (const [key, value] of this.entries()) {
      mappedMap.set(key, callback(value, key, index));
      index += 1;
    }
    return mappedMap;
  }

  public reduce<U>(callback: (akku: U, key: K, value: V) => U, start: U): U {
    let s: U = start;
    for (const [key, value] of this.entries()) {
      s = callback(s, key, value);
    }
    return s;
  }

  public toRecord(): Record<K, V> {
    return this.reduce<Record<K, V>>(
      (akku: Record<K, V>, key: K, value: V): Record<K, V> => {
        return {
          ...akku,
          [key]: value,
        };
      },
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      {} as Record<K, V>,
    );
  }

  public toArray(): [K, V][] {
    return Array.from(this.entries());
  }

  public copy(): SMap<K, V> {
    return new SMap<K, V>(this);
  }

  public bySetting(key: K, value: V): SMap<K, V> {
    const newMap: SMap<K, V> = this.copy();
    newMap.set(key, value);
    return newMap;
  }

  public find(search: (entry: [K, V]) => boolean): [K, V] | null {
    for (const entry of this.entries()) {
      if (search(entry)) {
        return entry;
      }
    }
    return null;
  }
}
