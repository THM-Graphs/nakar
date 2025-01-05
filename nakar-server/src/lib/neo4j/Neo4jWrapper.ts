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

  private transform(queryResult: QueryResult): Neo4jGraph {
    const nodes: Map<string, Neo4jNode> = new Map();
    const edges: Map<string, Neo4jEdge> = new Map();
    const tableData: Record<string, string>[] = [];

    for (const record of queryResult.records) {
      const tableEntry: Record<string, string> = {};
      for (const key of record.keys as string[]) {
        const field: unknown = record.get(key);
        const results = this.transformField(field, false);
        results.nodes.forEach((v, k) => nodes.set(k, v));
        results.edges.forEach((v, k) => edges.set(k, v));
        tableEntry[key] = results.tableEntry;
      }
      tableData.push(tableEntry);
    }

    return {
      nodes: Array.from(nodes.values()),
      edges: Array.from(edges.values()),
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
      const node: Neo4jNode = this.transformNode(field as Node);
      nodes.set(node.id, node);
      tableEntry = `[node, id=${node.id}, labels=${node.labels.join(',')}]`;
    } else if (field instanceof Relationship) {
      const edge: Neo4jEdge = this.tranformRelationship(field as Relationship);
      edges.set(edge.id, edge);
      tableEntry = `[edge, id=${edge.id}, type=${edge.type}]`;
    } else if (field instanceof Path) {
      const nodePath: Neo4jNode[] = [];
      for (const segment of field.segments) {
        const startNode: Neo4jNode = this.transformNode(segment.start as Node);
        nodes.set(startNode.id, startNode);
        nodePath.push(startNode);

        const endNode: Neo4jNode = this.transformNode(segment.end as Node);
        nodes.set(endNode.id, endNode);
        if (segment.end.elementId === field.end.elementId) {
          nodePath.push(endNode);
        }

        const edge = this.tranformRelationship(
          segment.relationship as Relationship,
        );
        edges.set(edge.id, edge);
      }

      const pathElementIds = nodePath.map((n) => n.id);

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
  ): Neo4JProperty[] {
    return Object.entries(properties).map<Neo4JProperty>(
      ([slug, value]: [string, unknown]): Neo4JProperty => {
        return { slug, value: this.getDisplayStringOfField(value, true) };
      },
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

  private transformNode(node: Node): Neo4jNode {
    const id: string = node.elementId;
    const labels: string[] = node.labels;
    const properties = this.transformProperties(node.properties);

    return { id, labels, properties };
  }

  private tranformRelationship(relationship: Relationship): Neo4jEdge {
    const id: string = relationship.elementId;
    const startNodeId: string = relationship.startNodeElementId;
    const endNodeId: string = relationship.endNodeElementId;
    const type: string = relationship.type;
    const properties = this.transformProperties(relationship.properties);

    return { id, startNodeId, endNodeId, type, properties };
  }
}
