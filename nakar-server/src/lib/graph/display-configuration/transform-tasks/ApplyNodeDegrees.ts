import { TransformTask } from '../TransformTask';
import { MutableGraph } from '../../MutableGraph';

export class ApplyNodeDegrees extends TransformTask {
  public constructor() {
    super('Apply Node Degrees');
  }

  protected run(input: MutableGraph): void {
    for (const [nodeId, node] of input.nodes.entries()) {
      const outRelsCount = input.edges
        .filter((e) => e.startNodeId === nodeId)
        .reduce((count, key, rel) => count + rel.compressedCount, 0);
      const inRelsCount = input.edges
        .filter((e) => e.endNodeId === nodeId)
        .reduce((count, key, rel) => count + rel.compressedCount, 0);

      node.inDegree = inRelsCount;
      node.outDegree = outRelsCount;
    }
  }
}
