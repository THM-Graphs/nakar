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
import { Neo4jNode } from './types/Neo4jNode';
import { Neo4jEdge } from './types/Neo4jEdge';
import { Neo4JProperty } from './types/Neo4JProperty';
import { Neo4jWrapperErrorNoLoginData } from './errors/Neo4jWrapperErrorNoLoginData';
import { match, P } from 'ts-pattern';
import { Neo4jPropertyValue } from './types/Neo4jPropertyValue';

export class Neo4jWrapper {
  private url: string;
  private username: string;
  private password: string;

  public constructor(
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
    if (query == null) {
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
    const nodes = new Map<string, Neo4jNode>();
    const edges = new Map<string, Neo4jEdge>();
    const tableData: Map<string, string>[] = [];

    for (const record of queryResult.records) {
      const tableEntry = new Map<string, string>();
      for (const key of record.keys) {
        const field: unknown = record.get(key);
        const results = this.transformField(field);
        results.nodes.forEach((v, k) => nodes.set(k, v));
        results.edges.forEach((v, k) => edges.set(k, v));
        tableEntry.set(key.toString(), results.tableEntry);
      }
      tableData.push(tableEntry);
    }

    return {
      nodes: nodes,
      edges: edges,
      tableData,
    };
  }

  private transformField(field: unknown): {
    nodes: Map<string, Neo4jNode>;
    edges: Map<string, Neo4jEdge>;
    tableEntry: string;
  } {
    const nodes = new Map<string, Neo4jNode>();
    const edges = new Map<string, Neo4jEdge>();
    let tableEntry = 'null';

    if (this.isNode(field)) {
      const [nodeId, node] = this.transformNode(field);
      nodes.set(nodeId, node);
      tableEntry = `[node, id=${nodeId}, labels=${[...node.labels.values()].join(',')}]`;
    } else if (this.isRelationship(field)) {
      const [edgeId, edge] = this.tranformRelationship(field);
      edges.set(edgeId, edge);
      tableEntry = `[edge, id=${edgeId}, type=${edge.type}]`;
    } else if (this.isPath(field)) {
      const nodePath: [string, Neo4jNode][] = [];
      for (const segment of field.segments) {
        const [startNodeId, startNode] = this.transformNode(segment.start);
        nodes.set(startNodeId, startNode);
        nodePath.push([startNodeId, startNode]);

        const [endNodeId, endNode] = this.transformNode(segment.end);
        nodes.set(endNodeId, endNode);
        if (segment.end.elementId === field.end.elementId) {
          nodePath.push([endNodeId, endNode]);
        }

        const [edgeId, edge] = this.tranformRelationship(segment.relationship);
        edges.set(edgeId, edge);
      }

      const pathElementIds: string[] = nodePath.map(([nodeId]) => nodeId);

      tableEntry = `[path elements=${pathElementIds.join(',')}]`;
    } else if (Array.isArray(field)) {
      const results = field.map((subField) => this.transformField(subField));
      results.forEach((r) => {
        r.nodes.forEach((v, k) => nodes.set(k, v));
      });
      results.forEach((r) => {
        r.edges.forEach((v, k) => edges.set(k, v));
      });
      tableEntry = JSON.stringify(results.map((r) => r.tableEntry));
    } else {
      // TODO: Object
      tableEntry = JSON.stringify(this.getJSONValueOfField(field));
    }

    return { nodes, edges, tableEntry };
  }

  private transformProperties(
    properties: Record<string, Neo4jPropertyValue>,
  ): Map<string, Neo4JProperty> {
    return Object.entries(properties).reduce<Map<string, Neo4JProperty>>(
      (map, [key, value]) => {
        map.set(key, { value: this.getJSONValueOfProperty(value) });
        return map;
      },
      new Map(),
    );
  }

  private getJSONValueOfProperty(field: unknown): Neo4jPropertyValue {
    return match(field)
      .returnType<Neo4jPropertyValue>()
      .with(P.nullish, () => null)
      .with(P.string, (s: string): string => s)
      .with(P.instanceOf(Integer), (integer: Integer): string =>
        integer.toString(),
      )
      .with(P.number, (n: number): number => n)
      .with(P.boolean, (b: boolean): string => b.toString())
      .otherwise((f: unknown) => {
        console.error(`WARNING: UNKNOWN RESULT TYPE: ${JSON.stringify(f)}`);
        return JSON.stringify(f);
      });
  }

  private transformNode(node: Node): [string, Neo4jNode] {
    const id: string = node.elementId;
    const labels = new Set<string>(node.labels);
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

  // TODO: Removre
  private isNode(value: unknown): value is Node {
    return value instanceof Node;
  }

  private isRelationship(value: unknown): value is Relationship {
    return value instanceof Relationship;
  }

  private isPath(value: unknown): value is Path {
    return value instanceof Path;
  }
}
