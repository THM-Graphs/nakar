interface Set<T> {
  toArray(): T[];
  copy(): Set<T>;
  byMerging(other: Set<T>): Set<T>;
  reduce<U>(callback: (akku: U, next: T) => U, start: U): U;
}

Set.prototype.toArray = function <T>(this: Set<T>): T[] {
  return [...this.values()];
};

Set.prototype.reduce = function <T, U>(
  this: Set<T>,
  callback: (akku: U, next: T) => U,
  start: U,
): U {
  let s = start;
  for (const value of this.values()) {
    s = callback(s, value);
  }
  return s;
};

Set.prototype.copy = function <T>(this: Set<T>): Set<T> {
  const s = new Set<T>();
  for (const value of this.values()) {
    s.add(value);
  }
  return s;
};

Set.prototype.byMerging = function <T>(this: Set<T>, other: Set<T>): Set<T> {
  const s = this.copy();
  for (const value of other.values()) {
    s.add(value);
  }
  return s;
};
