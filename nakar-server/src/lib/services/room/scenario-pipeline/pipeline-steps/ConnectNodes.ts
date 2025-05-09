import { FinalGraphDisplayConfiguration } from '../display-configuration/FinalGraphDisplayConfiguration';
import { MutableGraph } from '../../graph/MutableGraph';
import { SSet } from '../../../../tools/Set';
import { Neo4jGraphElements } from '../../../neo4j/Neo4jGraphElements';
import { ScenarioPipelineStep } from '../ScenarioPipelineStep';
import { ScenarioPipelineState } from '../ScenarioPipelineState';

export class ConnectNodes extends ScenarioPipelineStep {
  public constructor() {
    super('Connect Nodes');
  }

  public async run(state: ScenarioPipelineState): Promise<void> {
    const input: MutableGraph = state.graph;
    const config: FinalGraphDisplayConfiguration = state.displayConfiguration;

    if (!config.connectResultNodes) {
      return;
    }

    const nodeIds: SSet<string> = new SSet<string>(input.nodes.keys);

    if (nodeIds.size === 0) {
      return;
    }

    const result: Neo4jGraphElements =
      await state.neo4j.loadConnectingRelationships(
        state.databaseInfo,
        nodeIds,
      );

    state.graph.nodes.addNeo4jNodes(result.nodes);
    state.graph.edges.addNeo4jEdges(result.relationships);
  }
}
