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
import { match, P } from 'ts-pattern';
import { Neo4jGraphElements } from './Neo4jGraphElements';
import { Neo4jDatabaseInfo } from './Neo4jDatabaseInfo';
import { Neo4jLimitConfig } from './Neo4jLimitConfig';

export class Neo4jGraphElementsFactory {
  private readonly _result: Neo4jGraphElements;

  public constructor(
    private readonly _logger: LoggerService,
    private readonly _limit: Neo4jLimitConfig,
  ) {
    this._result = new Neo4jGraphElements({
      nodes: new SMap(),
      relationships: new SMap(),
      tableData: [],
      limitReached: false,
    });
  }

  public addNode(
    node: Node,
    key: string | null,
    source: Neo4jDatabaseInfo,
  ): void {
    this._result.nodes.set(
      node.elementId,
      Neo4jNode.fromRawNode(node, key, source),
    );
    this._checkLimit();
  }

  public addRelationship(
    relationship: Relationship,
    key: string | null,
    source: Neo4jDatabaseInfo,
  ): void {
    this._result.relationships.set(
      relationship.elementId,
      Neo4jRelationship.fromRawRelationship(relationship, key, source),
    );
    this._checkLimit();
  }

  public addTableRow(tableDataRow: SMap<string, unknown>): void {
    this._result.tableData.push(tableDataRow);
    this._checkLimit();
  }

  public collectField(
    key: string,
    field: unknown,
    source: Neo4jDatabaseInfo,
  ): void {
    if (isNode(field)) {
      this.addNode(field, key, source);
    } else if (isRelationship(field)) {
      this.addRelationship(field, key, source);
    } else if (isPath(field)) {
      for (const segment of field.segments) {
        this.addNode(segment.start, null, source);
        this.addNode(segment.end, null, source);
        this.addRelationship(segment.relationship, null, source);
      }
    } else {
      match(field)
        .with(P.array(), (fields: unknown[]): void => {
          for (const innerField of fields) {
            this.collectField(key, innerField, source);
            if (this._result.limitReached) {
              return;
            }
          }
        })
        .otherwise((): void => {
          /* */
        });
    }
  }

  public collectQueryResult(
    queryResult: QueryResult<RecordShape<string, unknown>>,
    source: Neo4jDatabaseInfo,
  ): void {
    for (const record of queryResult.records) {
      const tableDataRow: SMap<string, unknown> = new SMap<string, unknown>();
      for (const key of record.keys) {
        // Collect Graph Elements
        if (this._limit.shouldCollectGraphElements()) {
          this.collectField(key, record.get(key), source);
        }

        // Collect Table Data
        if (this._limit.shouldCollectTableData()) {
          const value: unknown = record.get(key);
          if (isInt(value)) {
            tableDataRow.set(key, value.toString());
          } else {
            tableDataRow.set(key, value);
          }
        }

        if (this._result.limitReached) {
          return;
        }
      }

      if (this._limit.shouldCollectTableData()) {
        this.addTableRow(tableDataRow);
      }
    }
  }

  public getResult(): Neo4jGraphElements {
    return this._result;
  }

  private _checkLimit(): void {
    if (this._result.size >= this._limit.getLimit()) {
      this._result.limitReached = true;
      this._logger.warn(this, 'Neo4j Result limit reached.');
      this._logger.warn(this, `  nodes: ${this._result.nodes.size.toFixed()}`);
      this._logger.warn(
        this,
        `  relationships: ${this._result.relationships.size.toFixed()}`,
      );
      this._logger.warn(
        this,
        `  tableData: ${this._result.tableData.length.toFixed()}`,
      );
      this._logger.warn(this, `    sum: ${this._result.size.toFixed()}`);
    }
  }
}
