import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { SMap } from './Map';

void describe('SMap', (): void => {
  void describe('fromRecord', (): void => {
    void it('creates map entries from record', (): void => {
      // when
      const base: SMap<string, number> = SMap.fromRecord<string, number>({
        a: 1,
        b: 2,
        c: 3,
      });

      // then
      assert.deepEqual(base.toRecord(), { a: 1, b: 2, c: 3 });
    });
  });

  void describe('filter', (): void => {
    void it('keeps matching entries', (): void => {
      // given
      const base: SMap<string, number> = new SMap<string, number>([
        ['a', 1],
        ['b', 2],
        ['c', 3],
      ]);

      // when
      const filtered: SMap<string, number> = base.filter(
        (value: number): boolean => {
          return value >= 2;
        },
      );

      // then
      assert.deepEqual(filtered.toRecord(), { b: 2, c: 3 });
    });
  });

  void describe('map', (): void => {
    void it('transforms each entry and passes index', (): void => {
      // given
      const base: SMap<string, number> = new SMap<string, number>([
        ['a', 1],
        ['b', 2],
        ['c', 3],
      ]);

      // when
      const mapped: SMap<string, string> = base.map(
        (value: number, key: string, index: number): string => {
          return `${key}-${index.toString()}-${(value * 10).toString()}`;
        },
      );

      // then
      assert.deepEqual(mapped.toRecord(), {
        a: 'a-0-10',
        b: 'b-1-20',
        c: 'c-2-30',
      });
    });
  });

  void describe('reduce', (): void => {
    void it('aggregates across entries', (): void => {
      // given
      const base: SMap<string, number> = new SMap<string, number>([
        ['a', 1],
        ['b', 2],
        ['c', 3],
      ]);

      // when
      const reduced: number = base.reduce(
        (akku: number, key: string, value: number): number => {
          return akku + key.length + value;
        },
        0,
      );

      // then
      assert.equal(reduced, 9);
    });
  });

  void describe('toRecord', (): void => {
    void it('returns record representation', (): void => {
      // given
      const base: SMap<string, number> = new SMap<string, number>([
        ['x', 7],
        ['y', 8],
      ]);

      // when
      const actual: Record<string, number> = base.toRecord();

      // then
      assert.deepEqual(actual, { x: 7, y: 8 });
    });
  });

  void describe('toArray', (): void => {
    void it('returns tuple entries in insertion order', (): void => {
      // given
      const base: SMap<string, number> = new SMap<string, number>([
        ['x', 7],
        ['y', 8],
      ]);

      // when
      const actual: [string, number][] = base.toArray();

      // then
      assert.deepEqual(actual, [
        ['x', 7],
        ['y', 8],
      ]);
    });
  });

  void describe('toValueArray', (): void => {
    void it('returns values in insertion order', (): void => {
      // given
      const base: SMap<string, number> = new SMap<string, number>([
        ['x', 7],
        ['y', 8],
      ]);

      // when
      const actual: number[] = base.toValueArray();

      // then
      assert.deepEqual(actual, [7, 8]);
    });
  });

  void describe('toKeyArray', (): void => {
    void it('returns keys in insertion order', (): void => {
      // given
      const base: SMap<string, number> = new SMap<string, number>([
        ['x', 7],
        ['y', 8],
      ]);

      // when
      const actual: string[] = base.toKeyArray();

      // then
      assert.deepEqual(actual, ['x', 'y']);
    });
  });

  void describe('copy', (): void => {
    void it('returns a distinct map with same entries', (): void => {
      // given
      const base: SMap<string, number> = new SMap<string, number>([
        ['x', 7],
        ['y', 8],
      ]);

      // when
      const copied: SMap<string, number> = base.copy();

      // then
      assert.notEqual(copied, base);
      assert.deepEqual(copied.toRecord(), { x: 7, y: 8 });
    });
  });

  void describe('bySetting', (): void => {
    void it('returns updated copy and keeps original unchanged', (): void => {
      // given
      const base: SMap<string, number> = new SMap<string, number>([
        ['x', 7],
        ['y', 8],
      ]);

      // when
      const changed: SMap<string, number> = base.bySetting('z', 42);

      // then
      assert.deepEqual(changed.toRecord(), { x: 7, y: 8, z: 42 });
      assert.deepEqual(base.toRecord(), { x: 7, y: 8 });
    });

    void it('overwrites existing value', (): void => {
      // given
      const base: SMap<string, number> = new SMap<string, number>([
        ['x', 7],
        ['y', 8],
      ]);

      // when
      const changed: SMap<string, number> = base.bySetting('y', 42);

      // then
      assert.deepEqual(changed.toRecord(), { x: 7, y: 42 });
      assert.deepEqual(base.toRecord(), { x: 7, y: 8 });
    });
  });

  void describe('find', (): void => {
    void it('returns matching entry', (): void => {
      // given
      const base: SMap<string, number> = new SMap<string, number>([
        ['a', 1],
        ['b', 2],
      ]);

      // when
      const found: [string, number] | null = base.find(
        (entry: [string, number]): boolean => {
          return entry[1] === 2;
        },
      );

      // then
      assert.deepEqual(found, ['b', 2]);
    });

    void it('returns null when no entry matches', (): void => {
      // given
      const base: SMap<string, number> = new SMap<string, number>([
        ['a', 1],
        ['b', 2],
      ]);

      // when
      const found: [string, number] | null = base.find(
        (entry: [string, number]): boolean => {
          return entry[0] === 'z';
        },
      );

      // then
      assert.equal(found, null);
    });
  });

  void describe('asyncMap', (): void => {
    void it('resolves mapped values into new map', async (): Promise<void> => {
      // given
      const base: SMap<string, number> = new SMap<string, number>([
        ['a', 1],
        ['b', 2],
      ]);

      // when
      const asyncMapped: SMap<string, string> = await base.asyncMap(
        async (key: string, value: number): Promise<string> => {
          await Promise.resolve();
          return `${key}:${value.toString()}`;
        },
      );

      // then
      assert.deepEqual(asyncMapped.toRecord(), { a: 'a:1', b: 'b:2' });
    });
  });

  void describe('asyncToArray', (): void => {
    void it('resolves mapped values into array', async (): Promise<void> => {
      // given
      const base: SMap<string, number> = new SMap<string, number>([
        ['a', 1],
        ['b', 2],
      ]);

      // when
      const asyncFlatMapped: string[] = await base.asyncToArray(
        async (key: string, value: number): Promise<string> => {
          await Promise.resolve();
          return `${key}-${value.toString()}`;
        },
      );

      // then
      assert.deepEqual(asyncFlatMapped, ['a-1', 'b-2']);
    });
  });

  void describe('byMergingAndOverwritingWith', (): void => {
    void it('overwrites duplicate keys with other map', (): void => {
      // given
      const base: SMap<string, number> = new SMap<string, number>([
        ['a', 1],
        ['b', 2],
      ]);
      const other: SMap<string, number> = new SMap<string, number>([
        ['b', 99],
        ['c', 3],
      ]);

      // when
      const merged: SMap<string, number> =
        base.byMergingAndOverwritingWith(other);

      // then
      assert.deepEqual(merged.toRecord(), { a: 1, b: 99, c: 3 });
    });
  });
});
