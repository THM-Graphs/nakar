import { Neo4jEdge } from './Neo4jEdge';
import { Neo4jNode } from './Neo4jNode';
import { Neo4jTableEntry } from './Neo4jTableEntry';
import { isNode, isPath, isRelationship, QueryResult } from 'neo4j-driver';
import { match, P } from 'ts-pattern';
import { RecordShape } from 'neo4j-driver-core/types/record';

export class Neo4jGraph {
  public readonly nodes: Map<string, Neo4jNode>;
  public readonly edges: Map<string, Neo4jEdge>;
  public readonly tableData: Neo4jTableEntry[];

  public constructor(data: {
    nodes: Map<string, Neo4jNode>;
    edges: Map<string, Neo4jEdge>;
    tableData: Neo4jTableEntry[];
  }) {
    this.nodes = data.nodes;
    this.edges = data.edges;
    this.tableData = data.tableData;
  }

  public static fromQueryResult(
    queryResult: QueryResult<RecordShape<string, unknown>>,
  ): Neo4jGraph {
    const nodes = new Map<string, Neo4jNode>();
    const edges = new Map<string, Neo4jEdge>();
    const tableData: Neo4jTableEntry[] = [];

    for (const record of queryResult.records) {
      const tableEntry: Neo4jTableEntry = new Map<string, unknown>();
      for (const key of record.keys) {
        const field: unknown = record.get(key);
        const results = this.collectGraphElements(key, field);
        results.nodes.forEach((v, k) => nodes.set(k, v));
        results.edges.forEach((v, k) => edges.set(k, v));
        tableEntry.set(key.toString(), field);
      }
      tableData.push(tableEntry);
    }

    return new Neo4jGraph({ nodes, edges, tableData });
  }

  private static collectGraphElements(
    key: string,
    field: unknown,
  ): {
    nodes: Map<string, Neo4jNode>;
    edges: Map<string, Neo4jEdge>;
  } {
    const nodes = new Map<string, Neo4jNode>();
    const edges = new Map<string, Neo4jEdge>();

    if (isNode(field)) {
      const node = Neo4jNode.fromQueryResult(key, field);
      nodes.set(node.id, node);
    } else if (isRelationship(field)) {
      const edge = Neo4jEdge.fromQueryResult(key, field);
      edges.set(edge.id, edge);
    } else if (isPath(field)) {
      for (const segment of field.segments) {
        const startNode = Neo4jNode.fromQueryResult(key, segment.start);
        nodes.set(startNode.id, startNode);

        const endNode = Neo4jNode.fromQueryResult(key, segment.end);
        nodes.set(endNode.id, endNode);

        const edge = Neo4jEdge.fromQueryResult(key, segment.relationship);
        edges.set(edge.id, edge);
      }
    } else {
      match(field)
        .with(P.array(), (a) => {
          const results = a.map((subField) =>
            this.collectGraphElements(key, subField),
          );
          results.forEach((r) => {
            r.nodes.forEach((v, k) => nodes.set(k, v));
            r.edges.forEach((v, k) => edges.set(k, v));
          });
        })
        .with(P.map(), (o) => {
          const results = Object.values(o).map((subField) =>
            this.collectGraphElements(key, subField),
          );
          results.forEach((r) => {
            r.nodes.forEach((v, k) => nodes.set(k, v));
            r.edges.forEach((v, k) => edges.set(k, v));
          });
        })
        .otherwise(() => {
          console.debug(
            `Unable to collect nodes and edges from field: ${JSON.stringify(field)}`,
          );
        });
    }

    return { nodes, edges };
  }
}
