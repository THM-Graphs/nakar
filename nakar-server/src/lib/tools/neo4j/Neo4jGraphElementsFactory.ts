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
import { SMap } from '../Map';
import { Neo4jNode } from './Neo4jNode';
import { Neo4jRelationship } from './Neo4jRelationship';
import { LoggerService } from '../../services/logger/LoggerService';
import { PathSegment, Record as Neo4jRecord } from 'neo4j-driver-core';
import { match, P } from 'ts-pattern';
import { Neo4jGraphElements } from './Neo4jGraphElements';

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

  public fromRawNode(node: Node, key: string | null): Neo4jGraphElements {
    return new Neo4jGraphElements({
      nodes: new SMap([[node.elementId, Neo4jNode.fromRawNode(node, key)]]),
      relationships: new SMap(),
      tableData: [],
    });
  }

  public fromRawRelationship(
    relationship: Relationship,
    key: string | null,
  ): Neo4jGraphElements {
    return new Neo4jGraphElements({
      relationships: new SMap([
        [
          relationship.elementId,
          Neo4jRelationship.fromRawRelationship(relationship, key),
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

  public fromField(key: string, field: unknown): Neo4jGraphElements {
    if (isNode(field)) {
      return this.fromRawNode(field, key);
    } else if (isRelationship(field)) {
      return this.fromRawRelationship(field, key);
    } else if (isPath(field)) {
      return this.mergeMultiple(
        ...field.segments.map((segment: PathSegment): Neo4jGraphElements => {
          return this.mergeMultiple(
            this.fromRawNode(segment.start, null),
            this.fromRawNode(segment.end, null),
            this.fromRawRelationship(segment.relationship, null),
          );
        }),
      );
    } else {
      // TODO: match everything
      return match(field)
        .with(
          P.array(),
          (a: unknown[]): Neo4jGraphElements => this.fromFields(key, a),
        )
        .otherwise((): Neo4jGraphElements => {
          this._logger.debug(
            this,
            `Unable to collect nodes and edges from field: ${JSON.stringify(field)}`,
          );
          return Neo4jGraphElements.empty();
        });
    }
  }

  public fromFields(key: string, fields: unknown[]): Neo4jGraphElements {
    return this.mergeMultiple(
      ...fields.map(
        (subField: unknown): Neo4jGraphElements =>
          this.fromField(key, subField),
      ),
    );
  }

  public fromQueryResult(
    queryResult: QueryResult<RecordShape<string, unknown>>,
  ): Neo4jGraphElements {
    return this.mergeMultiple(
      ...queryResult.records.map(
        (
          record: Neo4jRecord<RecordShape<string, unknown>>,
        ): Neo4jGraphElements => this.fromRecord(record),
      ),
    );
  }

  public fromRecord(
    record: Neo4jRecord<RecordShape<string, unknown>>,
  ): Neo4jGraphElements {
    const results: Neo4jGraphElements[] = record.keys.map(
      (key: string): Neo4jGraphElements => this.fromField(key, record.get(key)),
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
