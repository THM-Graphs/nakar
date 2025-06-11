import { ScenarioPipelineStep } from '../ScenarioPipelineStep';
import { MutableGraph } from '../../graph/MutableGraph';
import { Neo4jGraphElements } from '../../../neo4j/Neo4jGraphElements';
import { ScenarioPipelineState } from '../ScenarioPipelineState';

export class ExecuteInitialQuery extends ScenarioPipelineStep {
  public constructor() {
    super('Execute Initial Query');
  }

  public async run(state: ScenarioPipelineState): Promise<void> {
    if (state.scenarioDBDTO.query == null) {
      throw new Error('Unable to read query from pipeline state.');
    }

    const graphElements: Neo4jGraphElements = await state.neo4j.executeQuery(
      state.databaseInfo,
      state.scenarioDBDTO.query,
      {},
      true,
    );

    const graph: MutableGraph = MutableGraph.fromInitialScenario(
      state.scenarioDBDTO,
      state.displayConfiguration,
    );

    graph.nodes.addNeo4jNodes(graphElements.nodes);
    graph.edges.addNeo4jEdges(graphElements.relationships);
    graph.tableData = graphElements.tableData;

    state.logger.debug(
      this,
      `Did load ${graph.size.toString()} graph elements.`,
    );
    state.graph = graph;
  }
}
