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

    // TODO: Use index
    for (const node of input.nodes.nodes) {
      const outRelsCount: number = input.edges.edges
        .filter((e: MutableEdge): boolean => e.startNodeId === node.id)
        .reduce(
          (count: number, rel: MutableEdge): number =>
            count + rel.compressedCount,
          0,
        );
      const inRelsCount: number = input.edges.edges
        .filter((e: MutableEdge): boolean => e.endNodeId === node.id)
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
