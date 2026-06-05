import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { SMap } from './Map';

void describe('SMap', (): void => {
  void describe('fromRecord', (): void => {
    void it('creates map entries from record', (): void => {
      const base: SMap<string, number> = SMap.fromRecord<string, number>({
        a: 1,
        b: 2,
        c: 3,
      });
      assert.deepEqual(base.toRecord(), { a: 1, b: 2, c: 3 });
    });
  });

  void describe('filter', (): void => {
    void it('keeps matching entries', (): void => {
      const base: SMap<string, number> = new SMap<string, number>([
        ['a', 1],
        ['b', 2],
        ['c', 3],
      ]);
      const filtered: SMap<string, number> = base.filter(
        (value: number): boolean => {
          return value >= 2;
        },
      );
      assert.deepEqual(filtered.toRecord(), { b: 2, c: 3 });
    });
  });

  void describe('map', (): void => {
    void it('transforms each entry and passes index', (): void => {
      const base: SMap<string, number> = new SMap<string, number>([
        ['a', 1],
        ['b', 2],
        ['c', 3],
      ]);
      const mapped: SMap<string, string> = base.map(
        (value: number, key: string, index: number): string => {
          return `${key}-${index.toString()}-${(value * 10).toString()}`;
        },
      );
      assert.deepEqual(mapped.toRecord(), {
        a: 'a-0-10',
        b: 'b-1-20',
        c: 'c-2-30',
      });
    });
  });

  void describe('reduce', (): void => {
    void it('aggregates across entries', (): void => {
      const base: SMap<string, number> = new SMap<string, number>([
        ['a', 1],
        ['b', 2],
        ['c', 3],
      ]);
      const reduced: number = base.reduce(
        (akku: number, key: string, value: number): number => {
          return akku + key.length + value;
        },
        0,
      );
      assert.equal(reduced, 9);
    });
  });

  void describe('toRecord', (): void => {
    void it('returns record representation', (): void => {
      const base: SMap<string, number> = new SMap<string, number>([
        ['x', 7],
        ['y', 8],
      ]);
      assert.deepEqual(base.toRecord(), { x: 7, y: 8 });
    });
  });

  void describe('toArray', (): void => {
    void it('returns tuple entries in insertion order', (): void => {
      const base: SMap<string, number> = new SMap<string, number>([
        ['x', 7],
        ['y', 8],
      ]);
      assert.deepEqual(base.toArray(), [
        ['x', 7],
        ['y', 8],
      ]);
    });
  });

  void describe('toValueArray', (): void => {
    void it('returns values in insertion order', (): void => {
      const base: SMap<string, number> = new SMap<string, number>([
        ['x', 7],
        ['y', 8],
      ]);
      assert.deepEqual(base.toValueArray(), [7, 8]);
    });
  });

  void describe('toKeyArray', (): void => {
    void it('returns keys in insertion order', (): void => {
      const base: SMap<string, number> = new SMap<string, number>([
        ['x', 7],
        ['y', 8],
      ]);
      assert.deepEqual(base.toKeyArray(), ['x', 'y']);
    });
  });

  void describe('copy', (): void => {
    void it('returns a distinct map with same entries', (): void => {
      const base: SMap<string, number> = new SMap<string, number>([
        ['x', 7],
        ['y', 8],
      ]);
      const copied: SMap<string, number> = base.copy();
      assert.notEqual(copied, base);
      assert.deepEqual(copied.toRecord(), { x: 7, y: 8 });
    });
  });

  void describe('bySetting', (): void => {
    void it('returns updated copy and keeps original unchanged', (): void => {
      const base: SMap<string, number> = new SMap<string, number>([
        ['x', 7],
        ['y', 8],
      ]);
      const changed: SMap<string, number> = base.bySetting('z', 42);
      assert.deepEqual(changed.toRecord(), { x: 7, y: 8, z: 42 });
      assert.deepEqual(base.toRecord(), { x: 7, y: 8 });
    });

    void it('overwrites existing value', (): void => {
      const base: SMap<string, number> = new SMap<string, number>([
        ['x', 7],
        ['y', 8],
      ]);
      const changed: SMap<string, number> = base.bySetting('y', 42);
      assert.deepEqual(changed.toRecord(), { x: 7, y: 42 });
      assert.deepEqual(base.toRecord(), { x: 7, y: 8 });
    });
  });

  void describe('find', (): void => {
    void it('returns matching entry', (): void => {
      const base: SMap<string, number> = new SMap<string, number>([
        ['a', 1],
        ['b', 2],
      ]);
      const found: [string, number] | null = base.find(
        (entry: [string, number]): boolean => {
          return entry[1] === 2;
        },
      );
      assert.deepEqual(found, ['b', 2]);
    });

    void it('returns null when no entry matches', (): void => {
      const base: SMap<string, number> = new SMap<string, number>([
        ['a', 1],
        ['b', 2],
      ]);
      const found: [string, number] | null = base.find(
        (entry: [string, number]): boolean => {
          return entry[0] === 'z';
        },
      );
      assert.equal(found, null);
    });
  });

  void describe('asyncMap', (): void => {
    void it('resolves mapped values into new map', async (): Promise<void> => {
      const base: SMap<string, number> = new SMap<string, number>([
        ['a', 1],
        ['b', 2],
      ]);
      const asyncMapped: SMap<string, string> = await base.asyncMap(
        async (key: string, value: number): Promise<string> => {
          await Promise.resolve();
          return `${key}:${value.toString()}`;
        },
      );
      assert.deepEqual(asyncMapped.toRecord(), { a: 'a:1', b: 'b:2' });
    });
  });

  void describe('asyncFlatMap', (): void => {
    void it('resolves mapped values into array', async (): Promise<void> => {
      const base: SMap<string, number> = new SMap<string, number>([
        ['a', 1],
        ['b', 2],
      ]);
      const asyncFlatMapped: string[] = await base.asyncFlatMap(
        async (key: string, value: number): Promise<string> => {
          await Promise.resolve();
          return `${key}-${value.toString()}`;
        },
      );
      assert.deepEqual(asyncFlatMapped, ['a-1', 'b-2']);
    });
  });

  void describe('byMergingAndOverwritingWith', (): void => {
    void it('overwrites duplicate keys with other map', (): void => {
      const base: SMap<string, number> = new SMap<string, number>([
        ['a', 1],
        ['b', 2],
      ]);
      const other: SMap<string, number> = new SMap<string, number>([
        ['b', 99],
        ['c', 3],
      ]);
      const merged: SMap<string, number> =
        base.byMergingAndOverwritingWith(other);
      assert.deepEqual(merged.toRecord(), { a: 1, b: 99, c: 3 });
    });
  });
});
