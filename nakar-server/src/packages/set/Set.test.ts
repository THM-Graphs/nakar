import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { SSet } from './Set';

void describe('SSet', (): void => {
  void describe('upgrade', (): void => {
    void it('creates an SSet from an existing set-like value', (): void => {
      // when
      const upgraded: SSet<number> = SSet.upgrade(new SSet<number>([1, 2]));

      // then
      assert.deepEqual(upgraded.toArray(), [1, 2]);
    });
  });

  void describe('toArray', (): void => {
    void it('returns values in insertion order', (): void => {
      // given
      const base: SSet<number> = new SSet<number>([3, 1, 2]);

      // when
      const actual: number[] = base.toArray();

      // then
      assert.deepEqual(actual, [3, 1, 2]);
    });
  });

  void describe('copy', (): void => {
    void it('returns a distinct set with same values', (): void => {
      // given
      const base: SSet<number> = new SSet<number>([1, 2, 3]);

      // when
      const copied: SSet<number> = base.copy();

      // then
      assert.notEqual(copied, base);
      assert.deepEqual(copied.toArray(), [1, 2, 3]);
    });
  });

  void describe('byMerging', (): void => {
    void it('includes values from both sets', (): void => {
      // given
      const left: SSet<number> = new SSet<number>([1, 2]);

      // when
      const merged: SSet<number> = left.byMerging(new SSet<number>([2, 3]));

      // then
      assert.deepEqual(merged.toArray(), [1, 2, 3]);
    });
  });

  void describe('reduce', (): void => {
    void it('aggregates all values', (): void => {
      // given
      const base: SSet<number> = new SSet<number>([1, 2, 3]);

      // when
      const reduced: number = base.reduce(
        (accumulator: number, next: number): number => {
          return accumulator + next;
        },
        0,
      );

      // then
      assert.equal(reduced, 6);
    });
  });

  void describe('filter', (): void => {
    void it('keeps matching values', (): void => {
      // given
      const base: SSet<number> = new SSet<number>([1, 2, 3]);

      // when
      const filtered: SSet<number> = base.filter((element: number): boolean => {
        return element >= 2;
      });

      // then
      assert.deepEqual(filtered.toArray(), [2, 3]);
    });
  });

  void describe('asyncMap', (): void => {
    void it('transforms values asynchronously', async (): Promise<void> => {
      // given
      const base: SSet<number> = new SSet<number>([1, 2, 3]);

      // when
      const mapped: SSet<number> = await base.asyncMap(
        async (element: number): Promise<number> => {
          await Promise.resolve();
          return element + 1;
        },
      );

      // then
      assert.deepEqual(mapped.toArray(), [2, 3, 4]);
    });
  });

  void describe('byAdding', (): void => {
    void it('returns a new set with extra value', (): void => {
      // given
      const base: SSet<number> = new SSet<number>([1, 2]);

      // when
      const added: SSet<number> = base.byAdding(3);

      // then
      assert.deepEqual(added.toArray(), [1, 2, 3]);
      assert.deepEqual(base.toArray(), [1, 2]);
    });

    void it('ignores value already present in the set', (): void => {
      // given
      const base: SSet<number> = new SSet<number>([1, 2]);

      // when
      const added: SSet<number> = base.byAdding(2);

      // then
      assert.deepEqual(added.toArray(), [1, 2]);
      assert.deepEqual(base.toArray(), [1, 2]);
    });
  });

  void describe('asyncFlatMap', (): void => {
    void it('returns mapped array asynchronously', async (): Promise<void> => {
      // given
      const base: SSet<number> = new SSet<number>([1, 2, 3]);

      // when
      const values: string[] = await base.asyncFlatMap(
        async (value: number): Promise<string> => {
          await Promise.resolve();
          return `a-${value.toString()}`;
        },
      );

      // then
      assert.deepEqual(values, ['a-1', 'a-2', 'a-3']);
    });
  });

  void describe('toArrayBy', (): void => {
    void it('returns mapped array', (): void => {
      // given
      const base: SSet<number> = new SSet<number>([1, 2, 3]);

      // when
      const values: string[] = base.toArrayBy((value: number): string => {
        return `v-${value.toString()}`;
      });

      // then
      assert.deepEqual(values, ['v-1', 'v-2', 'v-3']);
    });
  });

  void describe('find', (): void => {
    void it('returns first matching value', (): void => {
      // given
      const base: SSet<number> = new SSet<number>([1, 2, 3]);

      // when
      const found: number | null = base.find((element: number): boolean => {
        return element === 2;
      });

      // then
      assert.equal(found, 2);
    });

    void it('returns null when no value matches', (): void => {
      // given
      const base: SSet<number> = new SSet<number>([1, 2, 3]);

      // when
      const found: number | null = base.find((element: number): boolean => {
        return element === 99;
      });

      // then
      assert.equal(found, null);
    });
  });

  void describe('map', (): void => {
    void it('transforms values into a new set', (): void => {
      // given
      const base: SSet<number> = new SSet<number>([1, 2, 3]);

      // when
      const mapped: SSet<number> = base.map((element: number): number => {
        return element * 10;
      });

      // then
      assert.deepEqual(mapped.toArray(), [10, 20, 30]);
    });
  });

  void describe('toIntersection', (): void => {
    void it('keeps shared values only', (): void => {
      // given
      const base: SSet<number> = new SSet<number>([1, 2, 3]);
      const other: SSet<number> = new SSet<number>([2, 3, 4]);

      // when
      const intersection: SSet<number> = base.toIntersection(other);

      // then
      assert.deepEqual(intersection.toArray(), [2, 3]);
    });
  });

  void describe('isEqual', (): void => {
    void it('returns true for same values in different order', (): void => {
      // given
      const base: SSet<number> = new SSet<number>([1, 2, 3]);
      const sameValuesDifferentOrder: SSet<number> = new SSet<number>([
        3, 2, 1,
      ]);

      // when
      const actual: boolean = base.isEqual(sameValuesDifferentOrder);

      // then
      assert.equal(actual, true);
    });

    void it('returns false for different values', (): void => {
      // given
      const base: SSet<number> = new SSet<number>([1, 2, 3]);
      const differentValues: SSet<number> = new SSet<number>([1, 2, 4]);

      // when
      const actual: boolean = base.isEqual(differentValues);

      // then
      assert.equal(actual, false);
    });
  });
});
