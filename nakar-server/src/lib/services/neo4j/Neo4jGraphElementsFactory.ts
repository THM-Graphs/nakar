import {
  isInt,
  isNode,
  isPath,
  isRelationship,
  Node,
  QueryResult,
  RecordShape,
  Relationship,
} from 'neo4j-driver';
import { SMap } from '../../tools/Map';
import { Neo4jNode } from './Neo4jNode';
import { Neo4jRelationship } from './Neo4jRelationship';
import { LoggerService } from '../logger/LoggerService';
import { PathSegment, Record as Neo4jRecord } from 'neo4j-driver-core';
import { match, P } from 'ts-pattern';
import { Neo4jGraphElements } from './Neo4jGraphElements';
import { Neo4jDatabaseInfo } from './Neo4jDatabaseInfo';

export class Neo4jGraphElementsFactory {
  public constructor(private readonly _logger: LoggerService) {}

  public mergeMultiple(
    ...graphElements: Neo4jGraphElements[]
  ): Neo4jGraphElements {
    return graphElements.reduce(
      (
        akku: Neo4jGraphElements,
        next: Neo4jGraphElements,
      ): Neo4jGraphElements => akku.byMergingWith(next),
      Neo4jGraphElements.empty(),
    );
  }

  public fromRawNode(
    node: Node,
    key: string | null,
    source: Neo4jDatabaseInfo,
  ): Neo4jGraphElements {
    return new Neo4jGraphElements({
      nodes: new SMap([
        [node.elementId, Neo4jNode.fromRawNode(node, key, source)],
      ]),
      relationships: new SMap(),
      tableData: [],
    });
  }

  public fromRawRelationship(
    relationship: Relationship,
    key: string | null,
    source: Neo4jDatabaseInfo,
  ): Neo4jGraphElements {
    return new Neo4jGraphElements({
      relationships: new SMap([
        [
          relationship.elementId,
          Neo4jRelationship.fromRawRelationship(relationship, key, source),
        ],
      ]),
      nodes: new SMap(),
      tableData: [],
    });
  }

  public fromTableData(tableData: SMap<string, unknown>[]): Neo4jGraphElements {
    return new Neo4jGraphElements({
      nodes: new SMap(),
      relationships: new SMap(),
      tableData: tableData,
    });
  }

  public fromField(
    key: string,
    field: unknown,
    source: Neo4jDatabaseInfo,
  ): Neo4jGraphElements {
    if (isNode(field)) {
      return this.fromRawNode(field, key, source);
    } else if (isRelationship(field)) {
      return this.fromRawRelationship(field, key, source);
    } else if (isPath(field)) {
      return this.mergeMultiple(
        ...field.segments.map((segment: PathSegment): Neo4jGraphElements => {
          return this.mergeMultiple(
            this.fromRawNode(segment.start, null, source),
            this.fromRawNode(segment.end, null, source),
            this.fromRawRelationship(segment.relationship, null, source),
          );
        }),
      );
    } else {
      // TODO: match everything
      return match(field)
        .with(
          P.array(),
          (a: unknown[]): Neo4jGraphElements => this.fromFields(key, a, source),
        )
        .otherwise((): Neo4jGraphElements => {
          return Neo4jGraphElements.empty();
        });
    }
  }

  public fromFields(
    key: string,
    fields: unknown[],
    source: Neo4jDatabaseInfo,
  ): Neo4jGraphElements {
    return this.mergeMultiple(
      ...fields.map(
        (subField: unknown): Neo4jGraphElements =>
          this.fromField(key, subField, source),
      ),
    );
  }

  public fromQueryResult(
    queryResult: QueryResult<RecordShape<string, unknown>>,
    source: Neo4jDatabaseInfo,
  ): Neo4jGraphElements {
    return this.mergeMultiple(
      ...queryResult.records.map(
        (
          record: Neo4jRecord<RecordShape<string, unknown>>,
        ): Neo4jGraphElements => this.fromRecord(record, source),
      ),
    );
  }

  public fromRecord(
    record: Neo4jRecord<RecordShape<string, unknown>>,
    source: Neo4jDatabaseInfo,
  ): Neo4jGraphElements {
    const results: Neo4jGraphElements[] = record.keys.map(
      (key: string): Neo4jGraphElements =>
        this.fromField(key, record.get(key), source),
    );

    const tableDataEntry: SMap<string, unknown> = record.keys.reduce<
      SMap<string, unknown>
    >((akku: SMap<string, unknown>, next: string): SMap<string, unknown> => {
      const value: unknown = record.get(next);
      if (isInt(value)) {
        return akku.bySetting(next, value.toString());
      } else {
        // todo: match everything
        return akku.bySetting(next, value);
      }
    }, new SMap());

    return this.mergeMultiple(...results, this.fromTableData([tableDataEntry]));
  }
}
