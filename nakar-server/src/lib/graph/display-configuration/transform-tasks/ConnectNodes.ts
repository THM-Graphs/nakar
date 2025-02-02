import { TransformTask } from '../TransformTask';
import { FinalGraphDisplayConfiguration } from '../FinalGraphDisplayConfiguration';
import { Neo4jDatabase } from '../../../neo4j/Neo4jDatabase';
import { MutableEdge } from '../../MutableEdge';
import { MutableGraph } from '../../MutableGraph';
import { SSet } from '../../../tools/Set';

export class ConnectNodes extends TransformTask {
  public constructor() {
    super('Connect Nodes');
  }

  protected async run(
    input: MutableGraph,
    config: FinalGraphDisplayConfiguration,
    database: Neo4jDatabase,
  ): Promise<void> {
    if (!config.connectResultNodes) {
      return;
    }

    const nodeIds = new SSet<string>(input.nodes.keys());

    if (nodeIds.size === 0) {
      return;
    }

    const result = await database.loadConnectingRelationships(nodeIds);

    const edges = result.relationships.map((r) => MutableEdge.create(r));

    input.addNonDuplicateEdges(edges);
  }
}
