import { TransformTask } from '../TransformTask';
import { MutableScenarioResult } from '../../graph-transformer/MutableScenarioResult';

export class ApplyNodeDegrees extends TransformTask {
  public constructor() {
    super('ApplyNodeDegrees');
  }

  protected run(input: MutableScenarioResult): void {
    for (const [nodeId, node] of input.graph.nodes.entries()) {
      const outRels = input.graph.edges.filter((e) => e.startNodeId === nodeId);
      const inRels = input.graph.edges.filter((e) => e.endNodeId === nodeId);

      node.inDegree = inRels.size;
      node.outDegree = outRels.size;
    }
  }
}
