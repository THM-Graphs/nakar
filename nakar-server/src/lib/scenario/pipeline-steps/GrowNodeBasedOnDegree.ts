import { FinalGraphDisplayConfiguration } from '../../graph/display-configuration/FinalGraphDisplayConfiguration';
import { Range } from '../../tools/Range';
import { MutableGraph } from '../../graph/MutableGraph';
import { MutableNode } from '../../graph/MutableNode';
import { ScenarioPipelineStep } from '../ScenarioPipelineStep';

export class GrowNodeBasedOnDegree extends ScenarioPipelineStep<void> {
  private _graph: MutableGraph;
  private _config: FinalGraphDisplayConfiguration;

  public constructor(
    graph: MutableGraph,
    config: FinalGraphDisplayConfiguration,
  ) {
    super('Grow Node Based On Degree');
    this._graph = graph;
    this._config = config;
  }

  public run(): void {
    const input: MutableGraph = this._graph;
    const config: FinalGraphDisplayConfiguration = this._config;

    if (!config.growNodesBasedOnDegree) {
      return;
    }

    if (config.growNodesBasedOnDegreeFactor < 1) {
      return;
    }

    const degrees: number[] = input.nodes.reduce(
      (akku: number[], key: string, value: MutableNode): number[] => [
        ...akku,
        value.degree,
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

    for (const node of input.nodes.values()) {
      const toRange: Range = new Range({
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
