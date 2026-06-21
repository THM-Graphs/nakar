import type {
  Node,
  Record as Neo4jRecord,
  RecordShape,
  Relationship,
} from 'neo4j-driver';
import { isInt, isNode, isPath, isRelationship } from 'neo4j-driver';
import { SMap } from '../../../../packages/map/Map';
import { Neo4jNode } from './Neo4jNode';
import { Neo4jRelationship } from './Neo4jRelationship';
import { match, P } from 'ts-pattern';
import type { ExternalGraphDatabaseCredentials } from '../../data/ExternalGraphDatabaseCredentials';
import { ExternalGraphDatabaseQueryResult } from '../../data/ExternalGraphDatabaseQueryResult';
import type { ExternalGraphDatabaseQueryLimitConfig } from '../../data/ExternalGraphDatabaseQueryLimitConfig';
import type { ExternalGraphDatabaseNode } from '../../data/ExternalGraphDatabaseNode';
import type { ExternalGraphDatabaseRelationship } from '../../data/ExternalGraphDatabaseRelationship';
import type { Logger } from '@strapi/logger';
import { createChildLogger } from '../../../logger/createChildLogger';

export class Neo4jGraphElementsFactory {
  private readonly _nodes: SMap<string, Neo4jNode>;
  private readonly _relationships: SMap<string, Neo4jRelationship>;
  private readonly _tableData: SMap<string, unknown>[];
  private _limitReached: boolean;
  private readonly _logger: Logger = createChildLogger(this);

  public constructor(
    private readonly _limit: ExternalGraphDatabaseQueryLimitConfig,
  ) {
    this._nodes = new SMap();
    this._relationships = new SMap();
    this._tableData = [];
    this._limitReached = false;
  }

  public get limitReached(): boolean {
    return this._limitReached;
  }

  public addNode(
    node: Node,
    key: string | null,
    source: ExternalGraphDatabaseCredentials,
  ): void {
    const existingNode: Neo4jNode | undefined = this._nodes.get(node.elementId);
    const newNode: Neo4jNode = Neo4jNode.fromRawNode(node, key, source);
    this._nodes.set(
      node.elementId,
      existingNode ? existingNode.byMergingWith(newNode) : newNode,
    );
    this._checkLimit();
  }

  public addRelationship(
    relationship: Relationship,
    key: string | null,
    source: ExternalGraphDatabaseCredentials,
  ): void {
    const existingRelationship: Neo4jRelationship | undefined =
      this._relationships.get(relationship.elementId);
    const newRelationship: Neo4jRelationship =
      Neo4jRelationship.fromRawRelationship(relationship, key, source);
    this._relationships.set(
      relationship.elementId,
      existingRelationship
        ? existingRelationship.byMergingWith(newRelationship)
        : newRelationship,
    );
    this._checkLimit();
  }

  public addTableRow(tableDataRow: SMap<string, unknown>): void {
    this._tableData.push(tableDataRow);
    this._checkLimit();
  }

  public collectField(
    key: string,
    field: unknown,
    source: ExternalGraphDatabaseCredentials,
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
            if (this._limitReached) {
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
    source: ExternalGraphDatabaseCredentials,
  ): void {
    const tableDataRow: SMap<string, unknown> = new SMap<string, unknown>();
    for (const key of record.keys) {
      if (this._limit.shouldCollectGraphElements()) {
        this.collectField(key, record.get(key), source);
      }

      if (this._limit.shouldCollectTableData()) {
        const value: unknown = record.get(key);
        if (isInt(value)) {
          tableDataRow.set(key, value.toString());
        } else {
          tableDataRow.set(key, value);
        }
      }

      if (this._limitReached) {
        return;
      }
    }

    if (this._limit.shouldCollectTableData()) {
      this.addTableRow(tableDataRow);
    }
  }

  public getResult(): ExternalGraphDatabaseQueryResult {
    const nodes: SMap<string, ExternalGraphDatabaseNode> = new SMap<
      string,
      ExternalGraphDatabaseNode
    >();
    for (const node of this._nodes.toValueArray()) {
      nodes.set(node.node.elementId, {
        nativeId: node.node.elementId,
        labels: [...node.node.labels],
        properties: this._convertProperties(node.node.properties),
        keys: node.keys,
        source: node.source,
      });
    }

    const relationships: SMap<string, ExternalGraphDatabaseRelationship> =
      new SMap<string, ExternalGraphDatabaseRelationship>();
    for (const rel of this._relationships.toValueArray()) {
      relationships.set(rel.relationship.elementId, {
        nativeId: rel.relationship.elementId,
        type: rel.relationship.type,
        startNodeId: rel.relationship.startNodeElementId,
        endNodeId: rel.relationship.endNodeElementId,
        properties: this._convertProperties(rel.relationship.properties),
        keys: rel.keys,
        source: rel.source,
      });
    }

    return new ExternalGraphDatabaseQueryResult(
      nodes,
      relationships,
      this._tableData,
      this._limitReached,
    );
  }

  private _convertProperties(
    properties: Record<string, unknown>,
  ): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(properties)) {
      if (isInt(value)) {
        result[key] = value.toNumber();
      } else {
        result[key] = value;
      }
    }
    return result;
  }

  private _checkLimit(): void {
    const size: number =
      this._nodes.size + this._relationships.size + this._tableData.length;
    if (size >= this._limit.getLimit()) {
      this._limitReached = true;
      this._logger.warn('Neo4j Result limit reached.');
      this._logger.warn(`  nodes: ${this._nodes.size.toFixed()}`);
      this._logger.warn(
        `  relationships: ${this._relationships.size.toFixed()}`,
      );
      this._logger.warn(`  tableData: ${this._tableData.length.toFixed()}`);
      this._logger.warn(`    sum: ${size.toFixed()}`);
    }
  }
}
