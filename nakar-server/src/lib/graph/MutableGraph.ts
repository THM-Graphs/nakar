import { MutableNode } from './MutableNode';
import { MutableEdge } from './MutableEdge';
import { MutableGraphMetaData } from './MutableGraphMetaData';
import { Neo4jGraphElements } from '../neo4j/Neo4jGraphElements';
import { SchemaGraph } from '../../../src-gen/schema';
import { z } from 'zod';
import { SMap } from '../tools/Map';
import { DBScenario } from '../documents/collection-types/DBScenario';
import { JsonValue, jsonValueSchema } from '../json/JSON';

export class MutableGraph {
  public static readonly schema = z.object({
    nodes: z.record(MutableNode.schema),
    edges: z.record(MutableEdge.schema),
    metaData: MutableGraphMetaData.schema,
    tableData: z.array(z.record(jsonValueSchema)),
  });

  public nodes: SMap<string, MutableNode>;
  public edges: SMap<string, MutableEdge>;
  public metaData: MutableGraphMetaData;
  public tableData: SMap<string, JsonValue>[];

  public constructor(data: {
    nodes: SMap<string, MutableNode>;
    edges: SMap<string, MutableEdge>;
    metaData: MutableGraphMetaData;
    tableData: SMap<string, JsonValue>[];
  }) {
    this.nodes = data.nodes;
    this.edges = data.edges;
    this.metaData = data.metaData;
    this.tableData = data.tableData;
  }

  public static create(
    graphElements: Neo4jGraphElements,
    scenario: DBScenario,
  ): MutableGraph {
    return new MutableGraph({
      nodes: graphElements.nodes.map((node) => MutableNode.create(node)),
      edges: graphElements.relationships.map((relationship) =>
        MutableEdge.create(relationship),
      ),
      metaData: MutableGraphMetaData.create(scenario),
      tableData: graphElements.tableData,
    });
  }

  public static empty(): MutableGraph {
    return new MutableGraph({
      nodes: new SMap(),
      edges: new SMap(),
      metaData: MutableGraphMetaData.empty(),
      tableData: [],
    });
  }

  public static fromPlain(input: unknown): MutableGraph {
    const data = MutableGraph.schema.parse(input);
    return new MutableGraph({
      nodes: SMap.fromRecord(data.nodes).map((n) => MutableNode.fromPlain(n)),
      edges: SMap.fromRecord(data.edges).map((e) => MutableEdge.fromPlain(e)),
      metaData: MutableGraphMetaData.fromPlain(data.metaData),
      tableData: data.tableData.map((td) => SMap.fromRecord(td)),
    });
  }

  public toDto(): SchemaGraph {
    return {
      nodes: this.nodes.toArray().map(([id, node]) => node.toDto(id)),
      edges: this.edges.toArray().map(([id, edge]) => edge.toDto(id)),
      metaData: this.metaData.toDto(),
      tableData: this.tableData.map((entry) => entry.toRecord()),
    };
  }

  public addNonDuplicateEdges(newEdges: SMap<string, MutableEdge>): void {
    for (const [newId, newEdge] of newEdges.entries()) {
      if (!this.edges.has(newId)) {
        this.edges.set(newId, newEdge);
      }
    }
  }

  public addNonDuplicateNodes(newNodes: SMap<string, MutableNode>): void {
    for (const [newId, newNode] of newNodes.entries()) {
      if (!this.nodes.has(newId)) {
        this.nodes.set(newId, newNode);
      }
    }
  }

  public toPlain(): z.infer<typeof MutableGraph.schema> {
    return {
      nodes: this.nodes.map((n) => n.toPlain()).toRecord(),
      edges: this.edges.map((e) => e.toPlain()).toRecord(),
      metaData: this.metaData.toPlain(),
      tableData: this.tableData.map((td) => td.toRecord()),
    };
  }
}
