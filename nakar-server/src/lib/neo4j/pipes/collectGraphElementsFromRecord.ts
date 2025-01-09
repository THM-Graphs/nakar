import { RecordShape, Record as Neo4jRecord } from 'neo4j-driver';
import { GraphElements } from '../types/GraphElements';
import { collectGraphElementsFromField } from './collectGraphElementsFromField';
import { mergeGraphElements } from './mergeGraphElements';

export function collectGraphElementsFromRecord(
  record: Neo4jRecord<RecordShape<string>>,
): GraphElements {
  const results = record.keys.map((key) => {
    const field: unknown = record.get(key);
    return collectGraphElementsFromField(key, field);
  });

  const tableDataEntry = record.keys.reduce<Record<string, unknown>>(
    (akku, next): Record<string, unknown> => ({
      ...akku,
      [next]: record.get(next) as unknown,
    }),
    {},
  );

  return mergeGraphElements(...results, {
    nodes: [],
    relationships: [],
    tableData: [tableDataEntry],
  });
}
