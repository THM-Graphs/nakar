import { Neo4jNode } from './Neo4jNode';
import { Neo4jRelationship } from './Neo4jRelationship';
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
import { match, P } from 'ts-pattern';
import { Record as Neo4jRecord } from 'neo4j-driver-core';
import { JSONValue } from '../json/JSON';
import { SMap } from '../tools/Map';

export class Neo4jGraphElements {
  public readonly nodes: SMap<string, Neo4jNode>;
  public readonly relationships: SMap<string, Neo4jRelationship>;
  public readonly tableData: SMap<string, JSONValue>[];

  public constructor(data: {
    nodes: SMap<string, Neo4jNode>;
    relationships: SMap<string, Neo4jRelationship>;
    tableData: SMap<string, JSONValue>[];
  }) {
    this.nodes = data.nodes;
    this.relationships = data.relationships;
    this.tableData = data.tableData;
  }

  public static empty(): Neo4jGraphElements {
    return new Neo4jGraphElements({
      nodes: new SMap(),
      relationships: new SMap(),
      tableData: [],
    });
  }

  public static mergeMultiple(
    ...graphElements: Neo4jGraphElements[]
  ): Neo4jGraphElements {
    return graphElements.reduce(
      (akku, next) => akku.byMergingWith(next),
      Neo4jGraphElements.empty(),
    );
  }

  public static fromRawNode(
    node: Node,
    key: string | null,
  ): Neo4jGraphElements {
    return new Neo4jGraphElements({
      nodes: new SMap([[node.elementId, Neo4jNode.fromRawNode(node, key)]]),
      relationships: new SMap(),
      tableData: [],
    });
  }

  public static fromRawRelationship(
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

  public static fromTableData(
    tableData: SMap<string, JSONValue>[],
  ): Neo4jGraphElements {
    return new Neo4jGraphElements({
      nodes: new SMap(),
      relationships: new SMap(),
      tableData: tableData,
    });
  }

  public static fromField(key: string, field: unknown): Neo4jGraphElements {
    if (isNode(field)) {
      return Neo4jGraphElements.fromRawNode(field, key);
    } else if (isRelationship(field)) {
      return Neo4jGraphElements.fromRawRelationship(field, key);
    } else if (isPath(field)) {
      return Neo4jGraphElements.mergeMultiple(
        ...field.segments.map((segment) => {
          return Neo4jGraphElements.mergeMultiple(
            Neo4jGraphElements.fromRawNode(segment.start, null),
            Neo4jGraphElements.fromRawNode(segment.end, null),
            Neo4jGraphElements.fromRawRelationship(segment.relationship, null),
          );
        }),
      );
    } else {
      return match(field)
        .with(P.array(), (a) => Neo4jGraphElements.fromFields(key, a))
        .with(P.map(), (o) =>
          Neo4jGraphElements.fromFields(key, Object.values(o)),
        )
        .otherwise(() => {
          strapi.log.debug(
            `Unable to collect nodes and edges from field: ${JSON.stringify(field)}`,
          );
          return Neo4jGraphElements.empty();
        });
    }
  }

  public static fromFields(key: string, fields: unknown[]): Neo4jGraphElements {
    return Neo4jGraphElements.mergeMultiple(
      ...fields.map((subField) => Neo4jGraphElements.fromField(key, subField)),
    );
  }

  public static fromQueryResult(
    queryResult: QueryResult<RecordShape<string, unknown>>,
  ): Neo4jGraphElements {
    return Neo4jGraphElements.mergeMultiple(
      ...queryResult.records.map((record) =>
        Neo4jGraphElements.fromRecord(record),
      ),
    );
  }

  public static fromRecord(
    record: Neo4jRecord<RecordShape<string, unknown>>,
  ): Neo4jGraphElements {
    const results = record.keys.map((key) =>
      Neo4jGraphElements.fromField(key, record.get(key)),
    );

    const tableDataEntry = record.keys.reduce<SMap<string, JSONValue>>(
      (akku, next) => {
        const value: unknown = record.get(next);
        if (isInt(value)) {
          return akku.bySetting(next, value.toString());
        } else {
          // todo: match everything
          // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
          return akku.bySetting(next, value as JSONValue);
        }
      },
      new SMap(),
    );

    return Neo4jGraphElements.mergeMultiple(
      ...results,
      Neo4jGraphElements.fromTableData([tableDataEntry]),
    );
  }

  public byMergingWith(other: Neo4jGraphElements): Neo4jGraphElements {
    const nodes = new SMap<string, Neo4jNode>();
    const relationships = new SMap<string, Neo4jRelationship>();
    const tableData: SMap<string, JSONValue>[] = [];

    for (const [id, node] of this.nodes.entries()) {
      nodes.set(id, node);
    }
    for (const [id, rel] of this.relationships.entries()) {
      relationships.set(id, rel);
    }
    for (const entry of this.tableData) {
      tableData.push(entry);
    }

    for (const [otherId, otherNode] of other.nodes.entries()) {
      const existingNode = nodes.get(otherId);
      if (existingNode == null) {
        nodes.set(otherId, otherNode);
      } else {
        nodes.set(otherId, existingNode.byMergingWith(otherNode));
      }
    }
    for (const [otherId, otherRelationship] of other.relationships.entries()) {
      const existingRelationship = relationships.get(otherId);
      if (existingRelationship == null) {
        relationships.set(otherId, otherRelationship);
      } else {
        relationships.set(
          otherId,
          existingRelationship.byMergingWith(otherRelationship),
        );
      }
    }
    for (const tableDataEntry of other.tableData) {
      tableData.push(tableDataEntry);
    }

    return new Neo4jGraphElements({
      nodes: nodes,
      relationships: relationships,
      tableData: tableData,
    });
  }
}
