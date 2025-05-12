import { ScenarioPipelineStep } from '../ScenarioPipelineStep';
import { ScenarioPipelineState } from '../ScenarioPipelineState';
import { GetScenarioDBDTO } from '../../../database/dto/GetScenarioDBDTO';
import { GetDatabaseDBDTO } from '../../../database/dto/GetDatabaseDBDTO';
import { Neo4jDatabaseInfo } from '../../../neo4j/Neo4jDatabaseInfo';
import { Neo4jGraphElements } from '../../../neo4j/Neo4jGraphElements';
import { MutableNode } from '../../graph/MutableNode';
import { AdditionalQueryDBDTO } from '../../../database/dto/AdditionalQueryDBDTO';
import { MutableGraph } from '../../graph/MutableGraph';
import { SSet } from '../../../../tools/Set';

export class ExcecuteAdditionalQueries extends ScenarioPipelineStep {
  public constructor() {
    super('Excecute Additional Queries');
  }

  public async run(state: ScenarioPipelineState): Promise<void> {
    const scenario: GetScenarioDBDTO = state.scenarioDBDTO;
    for (const additionalQuery of scenario.additionalQueries) {
      if (
        additionalQuery.mergeProperties.length !==
        additionalQuery.originalProperties.length
      ) {
        state.logger.error(
          this,
          'Merge property length does not match original property length. This will always fail to match nodes.',
        );
      }

      const database: GetDatabaseDBDTO | null = additionalQuery.mergeDatabase;
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

      const databaseInfo: Neo4jDatabaseInfo = Neo4jDatabaseInfo.parse(database);
      let result: Neo4jGraphElements = await state.neo4j.executeQuery(
        databaseInfo,
        additionalQuery.mergeQuery,
      );
      if (state.displayConfiguration.connectResultNodes) {
        const nodeIds: SSet<string> = new SSet<string>(result.nodes.keys());
        const connectResult: Neo4jGraphElements =
          await state.neo4j.loadConnectingRelationships(databaseInfo, nodeIds);
        result = result.byMergingWith(connectResult);
      }

      state.logger.debug(
        this,
        `Result: ${result.nodes.size.toString()} nodes, ${result.relationships.size.toString()} relationships.`,
      );

      state.graph.nodes.addNeo4jNodes(result.nodes);
      state.graph.edges.addNeo4jEdges(result.relationships);

      for (const originalNode of state.graph.nodes.nodes) {
        for (const mergeNode of state.graph.nodes.nodes) {
          if (
            this._shouldMergeNodes(
              originalNode,
              mergeNode,
              additionalQuery,
              result,
            )
          ) {
            state.logger.debug(
              this,
              `Will merge nodes: ${originalNode.title(state.graph, state.logger)}, ${mergeNode.title(state.graph, state.logger)}`,
            );
            this._mergeNodes(state, state.graph, originalNode, mergeNode);
          }
        }
      }
    }
  }

  private _shouldMergeNodes(
    originalNode: MutableNode,
    additionalNode: MutableNode,
    config: AdditionalQueryDBDTO,
    additionalGraph: Neo4jGraphElements,
  ): boolean {
    if (!additionalGraph.nodes.has(additionalNode.id)) {
      return false;
    }

    if (config.mergeProperties.length !== config.originalProperties.length) {
      return false;
    }

    if (originalNode.id === additionalNode.id) {
      return false;
    }

    if (
      !originalNode.labels.has(config.originalLabel) ||
      !additionalNode.labels.has(config.mergeLabel)
    ) {
      return false;
    }

    for (let i: number = 0; i < config.originalProperties.length; i += 1) {
      const originalValue: unknown = originalNode.properties.properties.get(
        config.originalProperties[i],
      );
      if (originalValue == null) {
        return false;
      }

      const mergeValue: unknown = additionalNode.properties.properties.get(
        config.mergeProperties[i],
      );
      if (mergeValue == null) {
        return false;
      }

      if (originalValue !== mergeValue) {
        return false;
      }
    }

    return true;
  }

  private _mergeNodes(
    state: ScenarioPipelineState,
    graph: MutableGraph,
    originalNode: MutableNode,
    additionalNode: MutableNode,
  ): void {
    originalNode.additionalSources.add(additionalNode.source);

    for (const relationship of graph.edges.getByStartNodeId(
      additionalNode.id,
    )) {
      graph.edges.remove(relationship);
      relationship.startNodeId = originalNode.id;
      graph.edges.add(relationship);
      state.logger.debug(
        this,
        `Did change startNodeId of ${relationship.id} (${relationship.type}) from ${additionalNode.id} (${additionalNode.title(graph, state.logger)}) to ${originalNode.id} (${originalNode.title(graph, state.logger)})`,
      );
    }
    for (const relationship of graph.edges.getByEndNodeId(additionalNode.id)) {
      graph.edges.remove(relationship);
      relationship.endNodeId = originalNode.id;
      graph.edges.add(relationship);
      state.logger.debug(
        this,
        `Did change endNodeId of ${relationship.id} (${relationship.type}) from ${additionalNode.id} (${additionalNode.title(graph, state.logger)}) to ${originalNode.id} (${originalNode.title(graph, state.logger)})`,
      );
    }

    graph.nodes.remove(additionalNode);
    state.logger.debug(
      this,
      `Did delete additional node after merge: ${additionalNode.id} (${additionalNode.title(graph, state.logger)})`,
    );
  }
}
