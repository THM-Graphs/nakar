import { TransformTask } from '../TransformTask';
import { MutableScenarioResult } from '../../MutableScenarioResult';
import { FinalGraphDisplayConfiguration } from '../FinalGraphDisplayConfiguration';
import { Neo4jDatabase } from '../../../neo4j/Neo4jDatabase';
import { MutableEdge } from '../../MutableEdge';

export class ConnectNodes extends TransformTask {
  public constructor() {
    super('ConnectNodes');
  }

  protected async run(
    input: MutableScenarioResult,
    config: FinalGraphDisplayConfiguration,
    database: Neo4jDatabase,
  ): Promise<void> {
    if (!config.connectResultNodes) {
      return;
    }

    const nodeIds = new Set<string>(input.graph.nodes.keys());

    if (nodeIds.size === 0) {
      return;
    }

    const result = await database.loadConnectingRelationships(nodeIds);

    const edges = result.relationships.map((r) => MutableEdge.create(r));

    input.graph.addNonDuplicateEdges(edges);
  }
}
