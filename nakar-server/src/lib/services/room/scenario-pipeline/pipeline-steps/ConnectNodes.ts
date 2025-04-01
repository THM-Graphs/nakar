import { FinalGraphDisplayConfiguration } from '../display-configuration/FinalGraphDisplayConfiguration';
import { MutableGraph } from '../../graph/MutableGraph';
import { SSet } from '../../../../tools/Set';
import { Neo4jGraphElements } from '../../../neo4j/Neo4jGraphElements';
import { ScenarioPipelineStep } from '../ScenarioPipelineStep';
import { MutableGraphFactory } from '../MutableGraphFactory';
import { ScenarioPipelineState } from '../ScenarioPipelineState';

export class ConnectNodes extends ScenarioPipelineStep {
  private _graphFactory: MutableGraphFactory;

  public constructor() {
    super('Connect Nodes');
    this._graphFactory = new MutableGraphFactory();
  }

  public async run(state: ScenarioPipelineState): Promise<void> {
    const input: MutableGraph = state.graph;
    const config: FinalGraphDisplayConfiguration = state.displayConfiguration;

    if (!config.connectResultNodes) {
      return;
    }

    const nodeIds: SSet<string> = new SSet<string>(input.nodes.keys());

    if (nodeIds.size === 0) {
      return;
    }

    const result: Neo4jGraphElements =
      await state.neo4j.loadConnectingRelationships(
        state.credentials,
        nodeIds,
        state.databaseDBDTO.documentId,
      );

    const graphFactory: MutableGraphFactory = new MutableGraphFactory();
    const otherGraph: MutableGraph = graphFactory.createGraph(
      result,
      state.scenarioDBDTO,
    );

    state.graph = state.graph.byMergingWith(otherGraph);
  }
}
