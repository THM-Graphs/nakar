import { TransformTask } from '../TransformTask';
import { FinalGraphDisplayConfiguration } from '../FinalGraphDisplayConfiguration';
import { Neo4jDatabase } from '../../../neo4j/Neo4jDatabase';
import { MutableEdge } from '../../MutableEdge';
import { MutableGraph } from '../../MutableGraph';
import { SSet } from '../../../tools/Set';
import { Neo4jRelationship } from '../../../neo4j/Neo4jRelationship';
import { Neo4jGraphElements } from '../../../neo4j/Neo4jGraphElements';
import { SMap } from '../../../tools/Map';

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

    const nodeIds: SSet<string> = new SSet<string>(input.nodes.keys());

    if (nodeIds.size === 0) {
      return;
    }

    const result: Neo4jGraphElements = await database.loadConnectingRelationships(nodeIds);

    const edges: SMap<string, MutableEdge> = result.relationships.map((r: Neo4jRelationship) => MutableEdge.create(r));

    input.addNonDuplicateEdges(edges);
  }
}
