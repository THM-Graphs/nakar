import type {
  Node,
  Record as Neo4jRecord,
  RecordShape,
  Relationship,
} from 'neo4j-driver';
import { isInt, isNode, isPath, isRelationship } from 'neo4j-driver';
import { SMap } from '../map/Map';
import { Neo4jNode } from './Neo4jNode';
import { Neo4jRelationship } from './Neo4jRelationship';
import { match, P } from 'ts-pattern';
import { Neo4jGraphElements } from './Neo4jGraphElements';
import type { Neo4jDatabaseInfo } from './Neo4jDatabaseInfo';
import type { Neo4jLimitConfig } from './Neo4jLimitConfig';
import { Logger } from '@strapi/logger';
import { createChildLogger } from '../logger/createChildLogger';

export class Neo4jGraphElementsFactory {
  private readonly _result: Neo4jGraphElements;
  private readonly _logger: Logger = createChildLogger(this);

  public constructor(private readonly _limit: Neo4jLimitConfig) {
    this._result = new Neo4jGraphElements({
      nodes: new SMap(),
      relationships: new SMap(),
      tableData: [],
      limitReached: false,
    });
  }

  public get limitReached(): boolean {
    return this._result.limitReached;
  }

  public addNode(
    node: Node,
    key: string | null,
    source: Neo4jDatabaseInfo,
  ): void {
    const existingNode: Neo4jNode | undefined = this._result.nodes.get(
      node.elementId,
    );
    const newNode: Neo4jNode = Neo4jNode.fromRawNode(node, key, source);
    this._result.nodes.set(
      node.elementId,
      existingNode ? existingNode.byMergingWith(newNode) : newNode,
    );
    this._checkLimit();
  }

  public addRelationship(
    relationship: Relationship,
    key: string | null,
    source: Neo4jDatabaseInfo,
  ): void {
    const existingRelationship: Neo4jRelationship | undefined =
      this._result.relationships.get(relationship.elementId);
    const newRelationship: Neo4jRelationship =
      Neo4jRelationship.fromRawRelationship(relationship, key, source);
    this._result.relationships.set(
      relationship.elementId,
      existingRelationship
        ? existingRelationship.byMergingWith(newRelationship)
        : newRelationship,
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

  public collectRecord(
    record: Neo4jRecord<RecordShape<string, unknown>>,
    source: Neo4jDatabaseInfo,
  ): void {
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

  public getResult(): Neo4jGraphElements {
    return this._result;
  }

  private _checkLimit(): void {
    if (this._result.size >= this._limit.getLimit()) {
      this._result.limitReached = true;
      this._logger.warn('Neo4j Result limit reached.');
      this._logger.warn(`  nodes: ${this._result.nodes.size.toFixed()}`);
      this._logger.warn(
        `  relationships: ${this._result.relationships.size.toFixed()}`,
      );
      this._logger.warn(
        `  tableData: ${this._result.tableData.length.toFixed()}`,
      );
      this._logger.warn(`    sum: ${this._result.size.toFixed()}`);
    }
  }
}
