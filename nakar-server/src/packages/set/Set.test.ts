import assert from 'node:assert/strict';
import test from 'node:test';
import { SSet } from './Set';

void test('upgrade creates an SSet from an existing set-like value', (): void => {
  const upgraded: SSet<number> = SSet.upgrade(new SSet<number>([1, 2]));
  assert.deepEqual(upgraded.toArray(), [1, 2]);
});

void test('toArray returns values in insertion order', (): void => {
  const base: SSet<number> = new SSet<number>([3, 1, 2]);
  assert.deepEqual(base.toArray(), [3, 1, 2]);
});

void test('copy returns a distinct set with same values', (): void => {
  const base: SSet<number> = new SSet<number>([1, 2, 3]);
  const copied: SSet<number> = base.copy();
  assert.notEqual(copied, base);
  assert.deepEqual(copied.toArray(), [1, 2, 3]);
});

void test('byMerging includes values from both sets', (): void => {
  const left: SSet<number> = new SSet<number>([1, 2]);
  const merged: SSet<number> = left.byMerging(new SSet<number>([2, 3]));
  assert.deepEqual(merged.toArray(), [1, 2, 3]);
});

void test('reduce aggregates all values', (): void => {
  const base: SSet<number> = new SSet<number>([1, 2, 3]);
  const reduced: number = base.reduce(
    (accumulator: number, next: number): number => {
      return accumulator + next;
    },
    0,
  );
  assert.equal(reduced, 6);
});

void test('filter keeps matching values', (): void => {
  const base: SSet<number> = new SSet<number>([1, 2, 3]);
  const filtered: SSet<number> = base.filter((element: number): boolean => {
    return element >= 2;
  });
  assert.deepEqual(filtered.toArray(), [2, 3]);
});

void test('asyncMap transforms values asynchronously', async (): Promise<void> => {
  const base: SSet<number> = new SSet<number>([1, 2, 3]);
  const mapped: SSet<number> = await base.asyncMap(
    async (element: number): Promise<number> => {
      await Promise.resolve();
      return element + 1;
    },
  );
  assert.deepEqual(mapped.toArray(), [2, 3, 4]);
});

void test('byAdding returns a new set with extra value', (): void => {
  const base: SSet<number> = new SSet<number>([1, 2]);
  const added: SSet<number> = base.byAdding(3);
  assert.deepEqual(added.toArray(), [1, 2, 3]);
  assert.deepEqual(base.toArray(), [1, 2]);
});

void test('asyncFlatMap returns mapped array asynchronously', async (): Promise<void> => {
  const base: SSet<number> = new SSet<number>([1, 2, 3]);
  const values: string[] = await base.asyncFlatMap(
    async (value: number): Promise<string> => {
      await Promise.resolve();
      return `a-${value.toString()}`;
    },
  );
  assert.deepEqual(values, ['a-1', 'a-2', 'a-3']);
});

void test('flatMap returns mapped array', (): void => {
  const base: SSet<number> = new SSet<number>([1, 2, 3]);
  const values: string[] = base.flatMap((value: number): string => {
    return `v-${value.toString()}`;
  });
  assert.deepEqual(values, ['v-1', 'v-2', 'v-3']);
});

void test('find returns first matching value', (): void => {
  const base: SSet<number> = new SSet<number>([1, 2, 3]);
  const found: number | null = base.find((element: number): boolean => {
    return element === 2;
  });
  assert.equal(found, 2);
});

void test('find returns null when no value matches', (): void => {
  const base: SSet<number> = new SSet<number>([1, 2, 3]);
  const found: number | null = base.find((element: number): boolean => {
    return element === 99;
  });
  assert.equal(found, null);
});

void test('map transforms values into a new set', (): void => {
  const base: SSet<number> = new SSet<number>([1, 2, 3]);
  const mapped: SSet<number> = base.map((element: number): number => {
    return element * 10;
  });
  assert.deepEqual(mapped.toArray(), [10, 20, 30]);
});

void test('intersection keeps shared values only', (): void => {
  const base: SSet<number> = new SSet<number>([1, 2, 3]);
  const other: SSet<number> = new SSet<number>([2, 3, 4]);
  const intersection: SSet<number> = base.intersection(other);
  assert.deepEqual(intersection.toArray(), [2, 3]);
});

void test('isEqual returns true for same values in different order', (): void => {
  const base: SSet<number> = new SSet<number>([1, 2, 3]);
  const sameValuesDifferentOrder: SSet<number> = new SSet<number>([3, 2, 1]);
  assert.equal(base.isEqual(sameValuesDifferentOrder), true);
});

void test('isEqual returns false for different values', (): void => {
  const base: SSet<number> = new SSet<number>([1, 2, 3]);
  const differentValues: SSet<number> = new SSet<number>([1, 2, 4]);
  assert.equal(base.isEqual(differentValues), false);
});
