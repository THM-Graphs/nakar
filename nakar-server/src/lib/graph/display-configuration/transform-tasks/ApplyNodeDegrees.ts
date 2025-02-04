import { TransformTask } from '../TransformTask';
import { MutableGraph } from '../../MutableGraph';
import { MutableEdge } from '../../MutableEdge';

export class ApplyNodeDegrees extends TransformTask {
  public constructor() {
    super('Apply Node Degrees');
  }

  protected run(input: MutableGraph): void {
    for (const [nodeId, node] of input.nodes.entries()) {
      const outRelsCount: number = input.edges
        .filter((e: MutableEdge): boolean => e.startNodeId === nodeId)
        .reduce((count: number, key: string, rel: MutableEdge): number => count + rel.compressedCount, 0);
      const inRelsCount: number = input.edges
        .filter((e: MutableEdge): boolean => e.endNodeId === nodeId)
        .reduce((count: number, key: string, rel: MutableEdge): number => count + rel.compressedCount, 0);

      node.inDegree = inRelsCount;
      node.outDegree = outRelsCount;
    }
  }
}
