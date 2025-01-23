import { TransformTask } from '../TransformTask';
import { MutableScenarioResult } from '../../MutableScenarioResult';
import { FinalGraphDisplayConfiguration } from '../FinalGraphDisplayConfiguration';
import { Range } from '../../../tools/Range';

export class GrowNodeBasedOnDegree extends TransformTask {
  public constructor() {
    super('GrowNodeBasedOnDegree');
  }

  protected run(
    input: MutableScenarioResult,
    config: FinalGraphDisplayConfiguration,
  ): void {
    if (!config.growNodesBasedOnDegree) {
      return;
    }

    if (config.growNodesBasedOnDegreeFactor < 1) {
      return;
    }

    const degrees: number[] = input.graph.nodes
      .toArray()
      .map(([, node]): number => node.degree);

    if (degrees.length === 0) {
      return;
    }

    const fromRange = new Range({
      floor: Math.min(...degrees),
      ceiling: Math.max(...degrees),
    });

    for (const node of input.graph.nodes.values()) {
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
