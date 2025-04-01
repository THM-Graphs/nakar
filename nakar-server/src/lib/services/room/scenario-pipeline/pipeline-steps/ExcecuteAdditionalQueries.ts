import { ScenarioPipelineStep } from '../ScenarioPipelineStep';
import { ScenarioPipelineState } from '../ScenarioPipelineState';
import { GetScenarioDBDTO } from '../../../database/dto/GetScenarioDBDTO';
import { GetDatabaseDBDTO } from '../../../database/dto/GetDatabaseDBDTO';
import { Neo4jLoginCredentials } from '../../../neo4j/Neo4jLoginCredentials';
import { Neo4jGraphElements } from '../../../neo4j/Neo4jGraphElements';
import { MutableNode } from '../../graph/MutableNode';
import { GetAdditionalQueryDBDTO } from '../../../database/dto/GetAdditionalQueryDBDTO';
import { MutableGraph } from '../../graph/MutableGraph';
import { MutableGraphFactory } from '../MutableGraphFactory';

export class ExcecuteAdditionalQueries extends ScenarioPipelineStep {
  public constructor() {
    super('Excecute Additional Queries');
  }

  public async run(state: ScenarioPipelineState): Promise<void> {
    const scenario: GetScenarioDBDTO = state.scenarioDBDTO;
    for (const additionalQuery of scenario.additionalQueries) {
      const database: GetDatabaseDBDTO | null = additionalQuery.database;
      if (database == null) {
        state.logger.error(
          this,
          'Cannot execute addional query, because the database is not set.',
        );
        continue;
      }

      state.logger.debug(
        this,
        `Will run additional query on ${database.title ?? '[no title]'}: ${additionalQuery.mergeQuery}`,
      );

      const credentials: Neo4jLoginCredentials =
        Neo4jLoginCredentials.parse(database);
      const result: Neo4jGraphElements = await state.neo4j.executeQuery(
        credentials,
        additionalQuery.mergeQuery,
        database.documentId,
      );
      const graphFactory: MutableGraphFactory = new MutableGraphFactory();
      const additionalGraph: MutableGraph = graphFactory.createGraph(
        result,
        scenario,
      );

      state.logger.debug(
        this,
        `Result: ${result.nodes.size.toString()} nodes, ${result.relationships.size.toString()} relationships.`,
      );

      state.graph = state.graph.byMergingWith(additionalGraph);

      for (const originalNode of state.graph.nodes) {
        for (const mergeNode of state.graph.nodes) {
          if (
            this._shouldMergeNodes(originalNode, mergeNode, additionalQuery)
          ) {
            state.logger.debug(
              this,
              `Will merge nodes: ${originalNode[1].title}, ${mergeNode[1].title}`,
            );
            this._mergeNodes(state, state.graph, originalNode, mergeNode);
          }
        }
      }
    }
  }

  private _shouldMergeNodes(
    originalNode: [string, MutableNode],
    additionalNode: [string, MutableNode],
    config: GetAdditionalQueryDBDTO,
  ): boolean {
    if (originalNode[0] === additionalNode[0]) {
      return false;
    }

    if (
      !originalNode[1].labels.has(config.originalLabel) ||
      !additionalNode[1].labels.has(config.mergeLabel)
    ) {
      return false;
    }

    const originalValue: unknown = originalNode[1].properties.properties.get(
      config.originalProperty,
    );
    if (originalValue == null) {
      return false;
    }

    const mergeValue: unknown = additionalNode[1].properties.properties.get(
      config.mergeProperty,
    );
    if (mergeValue == null) {
      return false;
    }

    if (originalValue !== mergeValue) {
      return false;
    }

    return true;
  }

  private _mergeNodes(
    state: ScenarioPipelineState,
    graph: MutableGraph,
    originalNode: [string, MutableNode],
    additionalNode: [string, MutableNode],
  ): void {
    originalNode[1].additionalSources.add(additionalNode[1].source);

    for (const relationship of graph.edges) {
      if (relationship[1].startNodeId === additionalNode[0]) {
        relationship[1].startNodeId = originalNode[0];
        state.logger.debug(
          this,
          `Did change startNodeId of ${relationship[0]} from ${additionalNode[0]} to ${originalNode[0]}`,
        );
      }
      if (relationship[1].endNodeId === additionalNode[0]) {
        relationship[1].endNodeId = originalNode[0];
        state.logger.debug(
          this,
          `Did change endNodeId of ${relationship[0]} from ${additionalNode[0]} to ${originalNode[0]}`,
        );
      }
    }

    graph.nodes.delete(additionalNode[0]);
    state.logger.debug(
      this,
      `Did delete additional node after merge: ${additionalNode[0]}`,
    );
  }
}
