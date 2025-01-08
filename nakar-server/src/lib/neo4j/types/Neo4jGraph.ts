import { Neo4jEdge } from './Neo4jEdge';
import { Neo4jNode } from './Neo4jNode';
import { Neo4jTableEntry } from './Neo4jTableEntry';
import { isNode, isPath, isRelationship, QueryResult } from 'neo4j-driver';

export class Neo4jGraph {
  public constructor(
    public readonly nodes: Map<string, Neo4jNode>,
    public readonly edges: Map<string, Neo4jEdge>,
    public readonly tableData: Neo4jTableEntry[],
  ) {}

  public static fromQueryResult(queryResult: QueryResult): Neo4jGraph {
    const nodes = new Map<string, Neo4jNode>();
    const edges = new Map<string, Neo4jEdge>();
    const tableData: Neo4jTableEntry[] = [];

    for (const record of queryResult.records) {
      const tableEntry: Neo4jTableEntry = new Map<string, unknown>();
      for (const key of record.keys) {
        const field: unknown = record.get(key);
        const results = this.collectGraphElements(field);
        results.nodes.forEach((v, k) => nodes.set(k, v));
        results.edges.forEach((v, k) => edges.set(k, v));
        tableEntry.set(key.toString(), field);
      }
      tableData.push(tableEntry);
    }

    return new Neo4jGraph(nodes, edges, tableData);
  }

  private static collectGraphElements(field: unknown): {
    nodes: Map<string, Neo4jNode>;
    edges: Map<string, Neo4jEdge>;
  } {
    const nodes = new Map<string, Neo4jNode>();
    const edges = new Map<string, Neo4jEdge>();

    if (isNode(field)) {
      const node = Neo4jNode.fromQueryResult(field);
      nodes.set(node.id, node);
    } else if (isRelationship(field)) {
      const edge = Neo4jEdge.fromQueryResult(field);
      edges.set(edge.id, edge);
    } else if (isPath(field)) {
      for (const segment of field.segments) {
        const startNode = Neo4jNode.fromQueryResult(segment.start);
        nodes.set(startNode.id, startNode);

        const endNode = Neo4jNode.fromQueryResult(segment.end);
        nodes.set(endNode.id, endNode);

        const edge = Neo4jEdge.fromQueryResult(segment.relationship);
        edges.set(edge.id, edge);
      }
    } else if (Array.isArray(field)) {
      const results = field.map((subField) =>
        this.collectGraphElements(subField),
      );
      results.forEach((r) => {
        r.nodes.forEach((v, k) => nodes.set(k, v));
        r.edges.forEach((v, k) => edges.set(k, v));
      });
    } else {
      // TODO: Object
      console.error(
        `Unable to collect nodes and edges from field: ${JSON.stringify(field)}`,
      );
    }

    return { nodes, edges };
  }

  public mergeInto(nodes: Neo4jNode[], edges: Neo4jEdge[]): void {
    for (const node of nodes) {
      this.nodes.set(node.id, node);
    }
    for (const edge of edges) {
      this.edges.set(edge.id, edge);
    }
  }
}
