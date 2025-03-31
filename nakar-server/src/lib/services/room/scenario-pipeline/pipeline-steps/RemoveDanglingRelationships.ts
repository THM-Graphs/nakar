import { MutableGraph } from '../../graph/MutableGraph';
import { ScenarioPipelineStep } from '../ScenarioPipelineStep';
import { MutableEdge } from '../../graph/MutableEdge';
import { ScenarioPipelineState } from '../ScenarioPipelineState';

export class RemoveDanglingRelationships extends ScenarioPipelineStep {
  public constructor() {
    super('Remove Dangling Relationships');
  }

  public run(state: ScenarioPipelineState): void {
    const graph: MutableGraph = state.graph;
    graph.edges = graph.edges.filter((edge: MutableEdge): boolean => {
      const isDangling: boolean =
        !graph.nodes.has(edge.startNodeId) || !graph.nodes.has(edge.endNodeId);

      if (isDangling) {
        state.logger.debug(
          this,
          `Relationship ${edge.type} (${edge.startNodeId} -> ${edge.endNodeId}) is dangling and will be removed.`,
        );
      }

      return !isDangling;
    });
  }
}
