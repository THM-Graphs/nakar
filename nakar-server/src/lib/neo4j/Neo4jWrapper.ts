import neo4j, {
  auth,
  driver as createDriver,
  Driver,
  Integer,
  Node,
  Path,
  QueryResult,
  RecordShape,
  Relationship,
  Session,
} from 'neo4j-driver';
import { Neo4jGraph } from './types/Neo4jGraph';
import { Neo4jStats } from './types/Neo4jStats';
import { Neo4jStatsLabel } from './types/Neo4jStatsLabel';
import { Neo4jStatsRelType } from './types/Neo4jStatsRelType';
import { Neo4jNode } from './types/Neo4jNode';
import { Neo4jEdge } from './types/Neo4jEdge';
import { Neo4JProperty } from './types/Neo4JProperty';
import { Neo4jWrapperErrorNoLoginData } from './errors/Neo4jWrapperErrorNoLoginData';

export class Neo4jWrapper {
  private url: string;
  private username: string;
  private password: string;

  constructor(
    database?: {
      url?: string | null;
      username?: string | null;
      password?: string | null;
    } | null,
  ) {
    if (database?.url == null) {
      throw new Neo4jWrapperErrorNoLoginData('url');
    }
    if (database.username == null) {
      throw new Neo4jWrapperErrorNoLoginData('username');
    }
    if (database.password == null) {
      throw new Neo4jWrapperErrorNoLoginData('password');
    }
    this.url = database.url;
    this.username = database.username;
    this.password = database.password;
  }

  public async executeQueryRaw(
    query?: string | null,
    parameters?: Record<string, unknown>,
  ): Promise<QueryResult> {
    if (!query) {
      throw new Error('No cypher query configured.');
    }

    const driver: Driver = createDriver(
      this.url,
      auth.basic(this.username, this.password),
    );
    try {
      const session: Session = driver.session({
        defaultAccessMode: neo4j.session.READ,
      });
      try {
        const result: QueryResult = await session.run<
          RecordShape<string, string>
        >(query, parameters);
        return result;
      } catch (error) {
        await session.close();
        throw error;
      }
    } catch (error) {
      await driver.close();
      throw error;
    }
  }

  public async executeQuery(
    query?: string | null,
    parameters?: Record<string, unknown>,
  ): Promise<Neo4jGraph> {
    const result = await this.executeQueryRaw(query, parameters);
    const dto: Neo4jGraph = this.transform(result);
    return dto;
  }

  public async getStats(): Promise<Neo4jStats> {
    const result = await this.executeQueryRaw('CALL apoc.meta.stats');
    const firstRecord = result.records[0];

    return {
      labelCount: (firstRecord.get('labelCount') as Integer).toString(),
      relTypeCount: (firstRecord.get('relTypeCount') as Integer).toString(),
      propertyKeyCount: (
        firstRecord.get('propertyKeyCount') as Integer
      ).toString(),
      nodeCount: (firstRecord.get('nodeCount') as Integer).toString(),
      relCount: (firstRecord.get('relCount') as Integer).toString(),
      labels: Object.entries(
        firstRecord.get('labels') as Record<string, Integer>,
      ).map(([key, integer]): Neo4jStatsLabel => {
        return {
          label: key,
          count: integer.toString(),
        };
      }),
      relTypes: Object.entries(
        firstRecord.get('relTypes') as Record<string, Integer>,
      ).map(([key, integer]): Neo4jStatsRelType => {
        return {
          relationship: key,
          count: integer.toString(),
        };
      }),
      relTypesCount: Object.entries(
        firstRecord.get('relTypesCount') as Record<string, Integer>,
      ).map(([key, integer]): Neo4jStatsRelType => {
        return {
          relationship: key,
          count: integer.toString(),
        };
      }),
    };
  }

  public async loadAndMergeConnectingRelationships(
    graph: Neo4jGraph,
  ): Promise<void> {
    const nodesIds = [...graph.nodes.keys()];
    const additional = await this.executeQuery(
      'MATCH (a)-[r]->(b) WHERE elementId(a) IN $existingNodeIds AND elementId(b) IN $existingNodeIds RETURN r;',
      { existingNodeIds: nodesIds },
    );
    for (const [edgeId, edge] of additional.edges.entries()) {
      graph.edges.set(edgeId, edge);
    }
  }

  private transform(queryResult: QueryResult): Neo4jGraph {
    const nodes: Map<string, Neo4jNode> = new Map();
    const edges: Map<string, Neo4jEdge> = new Map();
    const tableData: Map<string, string>[] = [];

    for (const record of queryResult.records) {
      const tableEntry: Map<string, string> = new Map();
      for (const key of record.keys as string[]) {
        const field: unknown = record.get(key);
        const results = this.transformField(field, false);
        results.nodes.forEach((v, k) => nodes.set(k, v));
        results.edges.forEach((v, k) => edges.set(k, v));
        tableEntry.set(key, results.tableEntry);
      }
      tableData.push(tableEntry);
    }

    return {
      nodes: nodes,
      edges: edges,
      tableData,
    };
  }

  private transformField(
    field: unknown,
    raw: boolean,
  ): {
    nodes: Map<string, Neo4jNode>;
    edges: Map<string, Neo4jEdge>;
    tableEntry: string;
  } {
    const nodes: Map<string, Neo4jNode> = new Map();
    const edges: Map<string, Neo4jEdge> = new Map();
    let tableEntry: string = '';

    if (field instanceof Node) {
      const [nodeId, node] = this.transformNode(field as Node);
      nodes.set(nodeId, node);
      tableEntry = `[node, id=${nodeId}, labels=${[...node.labels.values()].join(',')}]`;
    } else if (field instanceof Relationship) {
      const [edgeId, edge] = this.tranformRelationship(field as Relationship);
      edges.set(edgeId, edge);
      tableEntry = `[edge, id=${edgeId}, type=${edge.type}]`;
    } else if (field instanceof Path) {
      const nodePath: [string, Neo4jNode][] = [];
      for (const segment of field.segments) {
        const [startNodeId, startNode] = this.transformNode(
          segment.start as Node,
        );
        nodes.set(startNodeId, startNode);
        nodePath.push([startNodeId, startNode]);

        const [endNodeId, endNode] = this.transformNode(segment.end as Node);
        nodes.set(endNodeId, endNode);
        if (segment.end.elementId === field.end.elementId) {
          nodePath.push([endNodeId, endNode]);
        }

        const [edgeId, edge] = this.tranformRelationship(
          segment.relationship as Relationship,
        );
        edges.set(edgeId, edge);
      }

      const pathElementIds: string[] = nodePath.map(([nodeId]) => nodeId);

      tableEntry = `[path elements=${pathElementIds.join(',')}]`;
    } else if (Array.isArray(field)) {
      const results = field.map((subField) =>
        this.transformField(subField, true),
      );
      results.forEach((r) => {
        r.nodes.forEach((v, k) => nodes.set(k, v));
      });
      results.forEach((r) => {
        r.edges.forEach((v, k) => edges.set(k, v));
      });
      tableEntry = JSON.stringify(results.map((r) => r.tableEntry));
    } else {
      tableEntry = this.getDisplayStringOfField(field, raw);
    }

    return { nodes, edges, tableEntry };
  }

  private transformProperties(
    properties: Record<string, unknown>,
  ): Map<string, Neo4JProperty> {
    return Object.entries(properties).reduce<Map<string, Neo4JProperty>>(
      (map, [key, value]) => {
        map.set(key, { value: this.getDisplayStringOfField(value, true) });
        return map;
      },
      new Map(),
    );
  }

  private getDisplayStringOfField(field: unknown, raw: boolean): string {
    if (field instanceof Integer) {
      return field.toString();
    } else if (typeof field == 'number') {
      return field.toString();
    } else if (typeof field == 'string') {
      return raw ? field : `"${field}"`;
    } else if (Array.isArray(field)) {
      return JSON.stringify(
        field.map((e: unknown) => this.getDisplayStringOfField(e, true)),
      );
    } else if (field == null) {
      return `null`;
    } else {
      return `WARNING: UNKNOWN RESULT TYPE: ${JSON.stringify(field)}`;
    }
  }

  private transformNode(node: Node): [string, Neo4jNode] {
    const id: string = node.elementId;
    const labels: Set<string> = new Set(node.labels);
    const properties = this.transformProperties(node.properties);

    return [id, { labels, properties }];
  }

  private tranformRelationship(
    relationship: Relationship,
  ): [string, Neo4jEdge] {
    const id: string = relationship.elementId;
    const startNodeId: string = relationship.startNodeElementId;
    const endNodeId: string = relationship.endNodeElementId;
    const type: string = relationship.type;
    const properties = this.transformProperties(relationship.properties);

    return [id, { startNodeId, endNodeId, type, properties }];
  }
}
