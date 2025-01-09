import { QueryResult, RecordShape, Record as Neo4jRecord } from 'neo4j-driver';
import { GraphElements } from '../types/GraphElements';
import { mergeGraphElements } from './mergeGraphElements';
import { collectGraphElementsFromRecord } from './collectGraphElementsFromRecord';

export function collectGraphElementsFromQueryResult(
  queryResult: QueryResult<RecordShape<string, unknown>>,
): GraphElements {
  return mergeGraphElements(
    ...queryResult.records.map(
      (record: Neo4jRecord<RecordShape<string>>): GraphElements =>
        collectGraphElementsFromRecord(record),
    ),
  );
}
