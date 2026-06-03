import assert from 'node:assert/strict';
import test from 'node:test';
import { SMap } from './Map';

void test('fromRecord creates map entries from record', (): void => {
  const base: SMap<string, number> = SMap.fromRecord<string, number>({
    a: 1,
    b: 2,
    c: 3,
  });
  assert.deepEqual(base.toRecord(), { a: 1, b: 2, c: 3 });
});

void test('filter keeps matching entries', (): void => {
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

void test('map transforms each entry and passes index', (): void => {
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

void test('reduce aggregates across entries', (): void => {
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

void test('toRecord returns record representation', (): void => {
  const base: SMap<string, number> = new SMap<string, number>([
    ['x', 7],
    ['y', 8],
  ]);
  assert.deepEqual(base.toRecord(), { x: 7, y: 8 });
});

void test('toArray returns tuple entries in insertion order', (): void => {
  const base: SMap<string, number> = new SMap<string, number>([
    ['x', 7],
    ['y', 8],
  ]);
  assert.deepEqual(base.toArray(), [
    ['x', 7],
    ['y', 8],
  ]);
});

void test('toValueArray returns values in insertion order', (): void => {
  const base: SMap<string, number> = new SMap<string, number>([
    ['x', 7],
    ['y', 8],
  ]);
  assert.deepEqual(base.toValueArray(), [7, 8]);
});

void test('toKeyArray returns keys in insertion order', (): void => {
  const base: SMap<string, number> = new SMap<string, number>([
    ['x', 7],
    ['y', 8],
  ]);
  assert.deepEqual(base.toKeyArray(), ['x', 'y']);
});

void test('copy returns a distinct map with same entries', (): void => {
  const base: SMap<string, number> = new SMap<string, number>([
    ['x', 7],
    ['y', 8],
  ]);
  const copied: SMap<string, number> = base.copy();
  assert.notEqual(copied, base);
  assert.deepEqual(copied.toRecord(), { x: 7, y: 8 });
});

void test('bySetting returns updated copy and keeps original unchanged', (): void => {
  const base: SMap<string, number> = new SMap<string, number>([
    ['x', 7],
    ['y', 8],
  ]);
  const changed: SMap<string, number> = base.bySetting('y', 42);
  assert.deepEqual(changed.toRecord(), { x: 7, y: 42 });
  assert.deepEqual(base.toRecord(), { x: 7, y: 8 });
});

void test('find returns matching entry', (): void => {
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

void test('find returns null when no entry matches', (): void => {
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

void test('asyncMap resolves mapped values into new map', async (): Promise<void> => {
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

void test('asyncFlatMap resolves mapped values into array', async (): Promise<void> => {
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

void test('byMergingAndOverwritingWith overwrites duplicate keys with other map', (): void => {
  const base: SMap<string, number> = new SMap<string, number>([
    ['a', 1],
    ['b', 2],
  ]);
  const other: SMap<string, number> = new SMap<string, number>([
    ['b', 99],
    ['c', 3],
  ]);
  const merged: SMap<string, number> = base.byMergingAndOverwritingWith(other);
  assert.deepEqual(merged.toRecord(), { a: 1, b: 99, c: 3 });
});
