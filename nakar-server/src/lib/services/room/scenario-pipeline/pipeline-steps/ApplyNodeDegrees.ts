import { MutableGraph } from '../../graph/MutableGraph';
import { MutableEdge } from '../../graph/MutableEdge';
import { ScenarioPipelineStep } from '../ScenarioPipelineStep';
import { ScenarioPipelineState } from '../ScenarioPipelineState';

export class ApplyNodeDegrees extends ScenarioPipelineStep {
  public constructor() {
    super('Apply Node Degrees');
  }

  public run(state: ScenarioPipelineState): void {
    const input: MutableGraph = state.graph;

    for (const node of input.nodes.nodes) {
      const outRelsCount: number = input.edges
        .getByStartNodeId(node.id)
        .reduce(
          (count: number, rel: MutableEdge): number =>
            count + rel.compressedCount,
          0,
        );
      const inRelsCount: number = input.edges
        .getByEndNodeId(node.id)
        .reduce(
          (count: number, rel: MutableEdge): number =>
            count + rel.compressedCount,
          0,
        );

      node.inDegree = inRelsCount;
      node.outDegree = outRelsCount;
    }
  }
}
