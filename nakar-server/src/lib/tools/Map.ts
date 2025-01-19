interface Map<K, V> {
  filter(callback: (value: V, key: K) => boolean): Map<K, V>;
  map<U>(callback: (value: V, key: K) => U): Map<K, U>;
  reduce<U>(callback: (akku: U, key: K, value: V) => U, start: U): U;
  toRecord(): Record<string, V>;
  toArray(): [K, V][];
  copy(): Map<K, V>;
  bySetting(key: K, value: V): Map<K, V>;
  find(search: (entry: [K, V]) => boolean): [K, V] | null;
}

Map.prototype.filter = function <K, V>(
  this: Map<K, V>,
  callback: (value: V, key: K) => boolean,
): Map<K, V> {
  const filteredMap = new Map<K, V>();
  for (const [key, value] of this) {
    if (callback(value, key)) {
      filteredMap.set(key, value);
    }
  }
  return filteredMap;
};

Map.prototype.map = function <K, V, U>(
  this: Map<K, V>,
  callback: (value: V, key: K) => U,
): Map<K, U> {
  const mappedMap = new Map<K, U>();
  for (const [key, value] of this.entries()) {
    mappedMap.set(key, callback(value, key));
  }
  return mappedMap;
};

Map.prototype.reduce = function <K, V, U>(
  this: Map<K, V>,
  callback: (akku: U, key: K, value: V) => U,
  start: U,
): U {
  let s = start;
  for (const [key, value] of this.entries()) {
    s = callback(s, key, value);
  }
  return s;
};

Map.prototype.toRecord = function <K, V>(this: Map<K, V>): Record<string, V> {
  return this.reduce<Record<string, V>>((akku, key, value) => {
    return {
      ...akku,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-type-assertion
      [key as any]: value,
    };
  }, {});
};

Map.prototype.copy = function <K, V>(this: Map<K, V>): Map<K, V> {
  const newMap = new Map<K, V>();
  for (const [k, v] of this.entries()) {
    newMap.set(k, v);
  }
  return newMap;
};

Map.prototype.bySetting = function <K, V>(
  this: Map<K, V>,
  key: K,
  value: V,
): Map<K, V> {
  const newMap = this.copy();
  newMap.set(key, value);
  return newMap;
};

Map.prototype.toArray = function <K, V>(this: Map<K, V>): [K, V][] {
  return this.reduce<[K, V][]>(
    (akku, key, value) => [...akku, [key, value]],
    [],
  );
};

Map.prototype.find = function <K, V>(
  this: Map<K, V>,
  search: (entry: [K, V]) => boolean,
): [K, V] | null {
  for (const entry of this.entries()) {
    if (search(entry)) {
      return entry;
    }
  }
  return null;
};
