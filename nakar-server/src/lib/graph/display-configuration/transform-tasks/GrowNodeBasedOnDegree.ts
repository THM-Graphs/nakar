import { TransformTask } from '../TransformTask';
import { FinalGraphDisplayConfiguration } from '../FinalGraphDisplayConfiguration';
import { Range } from '../../../tools/Range';
import { MutableGraph } from '../../MutableGraph';

export class GrowNodeBasedOnDegree extends TransformTask {
  public constructor() {
    super('Grow Node Based On Degree');
  }

  protected run(
    input: MutableGraph,
    config: FinalGraphDisplayConfiguration,
  ): void {
    if (!config.growNodesBasedOnDegree) {
      return;
    }

    if (config.growNodesBasedOnDegreeFactor < 1) {
      return;
    }

    const degrees: number[] = input.nodes
      .toArray()
      .map(([, node]): number => node.degree);

    if (degrees.length === 0) {
      return;
    }

    const fromRange = new Range({
      floor: Math.min(...degrees),
      ceiling: Math.max(...degrees),
    });

    for (const node of input.nodes.values()) {
      const toRange = new Range({
        floor: node.radius,
        ceiling: node.radius * config.growNodesBasedOnDegreeFactor,
      });

      node.radius = fromRange.scaleValue(
        toRange,
        node.degree,
        config.scaleType,
      );
    }
  }
}
