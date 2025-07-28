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
import { SMap } from '../tools/Map';
import { Neo4jNode } from './Neo4jNode';
import { Neo4jRelationship } from './Neo4jRelationship';
import { LoggerService } from '../logger/LoggerService';
import { Record as Neo4jRecord } from 'neo4j-driver-core';
import { match, P } from 'ts-pattern';
import { Neo4jGraphElements } from './Neo4jGraphElements';
import { Neo4jDatabaseInfo } from './Neo4jDatabaseInfo';
import { ToManyElementsError } from './ToManyElementsError';

export class Neo4jGraphElementsFactory {
  private readonly _result: Neo4jGraphElements;

  public constructor(
    private readonly _logger: LoggerService,
    private readonly _limit: number | null,
  ) {
    this._result = new Neo4jGraphElements({
      nodes: new SMap(),
      relationships: new SMap(),
      tableData: [],
    });
  }

  public fromRawNode(
    node: Node,
    key: string | null,
    source: Neo4jDatabaseInfo,
  ): void {
    this._result.nodes.set(
      node.elementId,
      Neo4jNode.fromRawNode(node, key, source),
    );
    this._assertLimit();
  }

  public fromRawRelationship(
    relationship: Relationship,
    key: string | null,
    source: Neo4jDatabaseInfo,
  ): void {
    this._result.relationships.set(
      relationship.elementId,
      Neo4jRelationship.fromRawRelationship(relationship, key, source),
    );
    this._assertLimit();
  }

  public fromField(
    key: string,
    field: unknown,
    source: Neo4jDatabaseInfo,
  ): void {
    if (isNode(field)) {
      this.fromRawNode(field, key, source);
    } else if (isRelationship(field)) {
      this.fromRawRelationship(field, key, source);
    } else if (isPath(field)) {
      for (const segment of field.segments) {
        this.fromRawNode(segment.start, null, source);
        this.fromRawNode(segment.end, null, source);
        this.fromRawRelationship(segment.relationship, null, source);
      }
    } else {
      match(field)
        .with(P.array(), (a: unknown[]): void => {
          this.fromFields(key, a, source);
        })
        .otherwise((): void => {
          /* */
        });
    }
    this._assertLimit();
  }

  public fromFields(
    key: string,
    fields: unknown[],
    source: Neo4jDatabaseInfo,
  ): void {
    for (const field of fields) {
      this.fromField(key, field, source);
      this._assertLimit();
    }
  }

  public fromQueryResult(
    queryResult: QueryResult<RecordShape<string, unknown>>,
    source: Neo4jDatabaseInfo,
  ): void {
    for (const record of queryResult.records) {
      this.fromRecord(record, source);
      this._assertLimit();
    }
  }

  public fromRecord(
    record: Neo4jRecord<RecordShape<string, unknown>>,
    source: Neo4jDatabaseInfo,
  ): void {
    const tableDataRow: SMap<string, unknown> = new SMap<string, unknown>();
    for (const key of record.keys) {
      // Collect Graph Elements
      this.fromField(key, record.get(key), source);

      // Collect Table Data
      const value: unknown = record.get(key);
      if (isInt(value)) {
        tableDataRow.set(key, value.toString());
      } else {
        tableDataRow.set(key, value);
      }
    }
    this._result.tableData.push(tableDataRow);
    this._assertLimit();
  }

  public getResult(): Neo4jGraphElements {
    return this._result;
  }

  private _assertLimit(): void {
    if (this._limit == null) {
      return;
    }
    if (this._result.nodes.size > this._limit) {
      throw new ToManyElementsError(this._result.nodes.size, this._limit);
    }
    if (this._result.relationships.size > this._limit) {
      throw new ToManyElementsError(
        this._result.relationships.size,
        this._limit,
      );
    }
    if (this._result.tableData.length > this._limit) {
      throw new ToManyElementsError(this._result.tableData.length, this._limit);
    }
  }
}
