import { TransformTask } from '../TransformTask';
import { MutableGraph } from '../../MutableGraph';

export class ApplyNodeDegrees extends TransformTask {
  public constructor() {
    super('ApplyNodeDegrees');
  }

  protected run(input: MutableGraph): void {
    for (const [nodeId, node] of input.nodes.entries()) {
      const outRels = input.edges.filter((e) => e.startNodeId === nodeId);
      const inRels = input.edges.filter((e) => e.endNodeId === nodeId);

      node.inDegree = inRels.size;
      node.outDegree = outRels.size;
    }
  }
}
