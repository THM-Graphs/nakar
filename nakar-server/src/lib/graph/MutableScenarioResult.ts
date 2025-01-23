import { MutableGraph } from './MutableGraph';
import { Neo4jGraphElements } from '../neo4j/Neo4jGraphElements';
import { SchemaGetInitialGraph } from '../../../src-gen/schema';

export class MutableScenarioResult {
  public graph: MutableGraph;
  public tableData: Map<string, unknown>[];

  public constructor(data: {
    graph: MutableGraph;
    tableData: Map<string, unknown>[];
  }) {
    this.graph = data.graph;
    this.tableData = data.tableData;
  }

  public static create(
    graphElements: Neo4jGraphElements,
  ): MutableScenarioResult {
    return new MutableScenarioResult({
      graph: MutableGraph.create(graphElements),
      tableData: graphElements.tableData,
    });
  }

  public toDto(): SchemaGetInitialGraph {
    return {
      graph: this.graph.toDto(),
      tableData: this.tableData.map((entry) => entry.toRecord()),
    };
  }
}
