import { TransformTask } from '../TransformTask';
import { MutableScenarioResult } from '../../MutableScenarioResult';

export class ApplyEdgeParallelCounts extends TransformTask {
  public constructor() {
    super('ApplyEdgeParallelCounts');
  }

  protected run(input: MutableScenarioResult): void {
    for (const [, edge] of input.graph.edges.entries()) {
      if (edge.parallelCount > 1) {
        continue;
      }
      const parallelEdges = input.graph.edges
        .toArray()
        .filter(([, other]): boolean => edge.isParallelTo(other));
      const parallelCount = parallelEdges.length;

      for (const [index, [, parallelEdge]] of parallelEdges.entries()) {
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
