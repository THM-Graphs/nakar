import { ScenarioPipelineStep } from '../ScenarioPipelineStep';
import { MutableGraph } from '../../graph/MutableGraph';
import { Neo4jGraphElements } from '../../../neo4j/Neo4jGraphElements';
import { ScenarioPipelineState } from '../ScenarioPipelineState';
import { MutableGraphFactory } from '../MutableGraphFactory';

export class ExecuteInitialQuery extends ScenarioPipelineStep {
  public constructor() {
    super('Execute Initial Query');
  }

  public async run(state: ScenarioPipelineState): Promise<void> {
    const graphFactory: MutableGraphFactory = new MutableGraphFactory();

    if (state.scenarioDBDTO.query == null) {
      throw new Error('Unable to read query from pipeline state.');
    }

    const graphElements: Neo4jGraphElements = await state.neo4j.executeQuery(
      state.credentials,
      state.scenarioDBDTO.query,
      state.scenarioDBDTO.documentId,
    );
    const graph: MutableGraph = graphFactory.createGraph(
      graphElements,
      state.scenarioDBDTO,
    );
    state.logger.debug(
      this,
      `Did load ${graph.size.toString()} graph elements.`,
    );
    state.graph = graph;
  }
}
