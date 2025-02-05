import { MutableGraph } from '../../graph/MutableGraph';
import { MutableEdge } from '../../graph/MutableEdge';
import { ScenarioPipelineStep } from '../ScenarioPipelineStep';

export class ApplyNodeDegrees extends ScenarioPipelineStep<void> {
  private _graph: MutableGraph;

  public constructor(graph: MutableGraph) {
    super('Apply Node Degrees');
    this._graph = graph;
  }

  public run(): void {
    const input: MutableGraph = this._graph;

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
