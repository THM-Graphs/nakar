import { MutableGraph } from '../../graph/MutableGraph';
import { MutableEdge } from '../../graph/MutableEdge';
import { ScenarioPipelineStep } from '../ScenarioPipelineStep';
import { ScenarioPipelineState } from '../ScenarioPipelineState';

export class ApplyEdgeParallelCounts extends ScenarioPipelineStep {
  public constructor() {
    super('Apply Edge Parallel Counts');
  }

  public run(state: ScenarioPipelineState): void {
    const input: MutableGraph = state.graph;

    for (const edge of input.edges.edges) {
      if (edge.parallelCount > 1) {
        continue;
      }
      const parallelEdges: MutableEdge[] = [
        ...input.edges.getByStartAndEndNodeId(edge.startNodeId, edge.endNodeId),
        ...input.edges.getByStartAndEndNodeId(edge.endNodeId, edge.startNodeId),
      ];
      const parallelCount: number = parallelEdges.length;

      for (const [index, parallelEdge] of parallelEdges.entries()) {
        parallelEdge.parallelCount = parallelCount;

        if (parallelEdge.isLoop) {
          parallelEdge.parallelIndex = index;
        } else {
          if (parallelCount % 2 === 0) {
            if (index % 2 === 0) {
              parallelEdge.parallelIndex = index + 1;
            } else {
              parallelEdge.parallelIndex = -index;
            }
          } else {
            if (index === 0) {
              parallelEdge.parallelIndex = 0;
            }
            if (index % 2 === 0) {
              parallelEdge.parallelIndex = index;
            } else {
              parallelEdge.parallelIndex = -(index + 1);
            }
          }

          if (
            parallelEdge.startNodeId.localeCompare(parallelEdge.endNodeId) > 0
          ) {
            parallelEdge.parallelIndex = -parallelEdge.parallelIndex;
          }
        }
      }
    }
  }
}
