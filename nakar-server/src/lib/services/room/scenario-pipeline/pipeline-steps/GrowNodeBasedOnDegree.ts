import { FinalGraphDisplayConfiguration } from '../display-configuration/FinalGraphDisplayConfiguration';
import { Range } from '../../../../tools/Range';
import { MutableGraph } from '../../graph/MutableGraph';
import { MutableNode } from '../../graph/MutableNode';
import { ScenarioPipelineStep } from '../ScenarioPipelineStep';
import { ScenarioPipelineState } from '../ScenarioPipelineState';

export class GrowNodeBasedOnDegree extends ScenarioPipelineStep {
  public constructor() {
    super('Grow Node Based On Degree');
  }

  public run(state: ScenarioPipelineState): void {
    const input: MutableGraph = state.graph;
    const config: FinalGraphDisplayConfiguration = state.displayConfiguration;

    if (!config.growNodesBasedOnDegree) {
      return;
    }

    if (config.growNodesBasedOnDegreeFactor < 1) {
      return;
    }

    const degrees: number[] = input.nodes.nodes.reduce(
      (akku: number[], value: MutableNode): number[] => [
        ...akku,
        value.degree(input),
      ],
      [],
    );

    if (degrees.length === 0) {
      return;
    }

    const fromRange: Range = new Range({
      floor: Math.min(...degrees),
      ceiling: Math.max(...degrees),
    });

    for (const node of input.nodes.nodes) {
      const toRange: Range = new Range({
        floor: node.radius,
        ceiling: node.radius * config.growNodesBasedOnDegreeFactor,
      });

      node.radius = fromRange.scaleValue(
        toRange,
        node.degree(input),
        config.scaleType,
      );
    }
  }
}
