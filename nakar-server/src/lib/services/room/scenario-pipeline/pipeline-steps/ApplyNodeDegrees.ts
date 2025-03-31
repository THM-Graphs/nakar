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

    for (const [nodeId, node] of input.nodes.entries()) {
      const outRelsCount: number = input.edges
        .filter((e: MutableEdge): boolean => e.startNodeId === nodeId)
        .reduce(
          (count: number, key: string, rel: MutableEdge): number =>
            count + rel.compressedCount,
          0,
        );
      const inRelsCount: number = input.edges
        .filter((e: MutableEdge): boolean => e.endNodeId === nodeId)
        .reduce(
          (count: number, key: string, rel: MutableEdge): number =>
            count + rel.compressedCount,
          0,
        );

      node.inDegree = inRelsCount;
      node.outDegree = outRelsCount;
    }
  }
}
