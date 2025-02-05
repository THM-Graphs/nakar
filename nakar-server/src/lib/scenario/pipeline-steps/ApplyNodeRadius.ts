import { FinalGraphDisplayConfiguration } from '../../graph/display-configuration/FinalGraphDisplayConfiguration';
import { NodeDisplayConfigurationContext } from '../../graph/display-configuration/NodeDisplayConfigurationContext';
import { MutableGraph } from '../../graph/MutableGraph';
import { FinalNodeDisplayConfiguration } from '../../graph/display-configuration/FinalNodeDisplayConfiguration';
import { ScenarioPipelineStep } from '../ScenarioPipelineStep';

export class ApplyNodeRadius extends ScenarioPipelineStep<void> {
  private _graph: MutableGraph;
  private _config: FinalGraphDisplayConfiguration;

  public constructor(
    graph: MutableGraph,
    config: FinalGraphDisplayConfiguration,
  ) {
    super('Apply Node Radius');
    this._graph = graph;
    this._config = config;
  }

  public run(): void {
    const input: MutableGraph = this._graph;
    const config: FinalGraphDisplayConfiguration = this._config;

    for (const [nodeId, node] of input.nodes.entries()) {
      for (const label of node.labels) {
        const nodeConfig: FinalNodeDisplayConfiguration | undefined =
          config.nodeDisplayConfigurations.get(label);
        if (nodeConfig == null) {
          continue;
        }
        if (nodeConfig.radiusTemplate == null) {
          continue;
        }

        const newValue: string = NodeDisplayConfigurationContext.create(
          nodeId,
          node,
        ).applyToTemplate(nodeConfig.radiusTemplate);
        if (newValue.trim().length === 0) {
          continue;
        }

        const newRadius: number = parseFloat(newValue);
        if (isNaN(newRadius)) {
          strapi.log.warn(
            `Unable to parse node radius config: "${newRadius.toString()}" for label ${label}`,
          );
          continue;
        }
        node.radius = newRadius;
      }
    }
  }
}
