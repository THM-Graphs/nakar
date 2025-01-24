import { MutableNode } from './MutableNode';
import { MutableEdge } from './MutableEdge';
import { MutableGraphMetaData } from './MutableGraphMetaData';
import { Neo4jGraphElements } from '../neo4j/Neo4jGraphElements';
import { SchemaGraph } from '../../../src-gen/schema';
import { z } from 'zod';
import { JSONValue } from '../json/JSON';
import { SMap } from '../tools/Map';
import { ScenarioInfo } from './ScenarioInfo';
import { DBScenario } from '../documents/collection-types/DBScenario';

export class MutableGraph {
  public static readonly schema = z.object({
    nodes: z.record(MutableNode.schema),
    edges: z.record(MutableEdge.schema),
    metaData: MutableGraphMetaData.schema,
    tableData: z.array(z.record(z.any())),
    scenarioInfo: ScenarioInfo.schema,
  });

  public nodes: SMap<string, MutableNode>;
  public edges: SMap<string, MutableEdge>;
  public metaData: MutableGraphMetaData;
  public tableData: SMap<string, JSONValue>[];
  public scenarioInfo: ScenarioInfo;

  public constructor(data: {
    nodes: SMap<string, MutableNode>;
    edges: SMap<string, MutableEdge>;
    metaData: MutableGraphMetaData;
    tableData: SMap<string, JSONValue>[];
    scenarioInfo: ScenarioInfo;
  }) {
    this.nodes = data.nodes;
    this.edges = data.edges;
    this.metaData = data.metaData;
    this.tableData = data.tableData;
    this.scenarioInfo = data.scenarioInfo;
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
      metaData: MutableGraphMetaData.empty(),
      tableData: graphElements.tableData,
      scenarioInfo: ScenarioInfo.create(scenario),
    });
  }

  public static empty(): MutableGraph {
    return new MutableGraph({
      nodes: new SMap(),
      edges: new SMap(),
      metaData: MutableGraphMetaData.empty(),
      tableData: [],
      scenarioInfo: ScenarioInfo.empty(),
    });
  }

  public static fromPlain(input: unknown): MutableGraph {
    const data = MutableGraph.schema.parse(input);
    return new MutableGraph({
      nodes: SMap.fromRecord(data.nodes).map((n) => MutableNode.fromPlain(n)),
      edges: SMap.fromRecord(data.edges).map((e) => MutableEdge.fromPlain(e)),
      metaData: MutableGraphMetaData.fromPlain(data.metaData),
      tableData: data.tableData.map((td) =>
        // TODO: Wrap json value
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        SMap.fromRecord(td).map((v: unknown) => v as JSONValue),
      ),
      scenarioInfo: ScenarioInfo.fromPlain(data.scenarioInfo),
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
      scenarioInfo: this.scenarioInfo.toPlain(),
    };
  }
}
