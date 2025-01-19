import { TransformTask } from '../TransformTask';
import { MutableScenarioResult } from '../../graph-transformer/MutableScenarioResult';
import { FinalGraphDisplayConfiguration } from '../FinalGraphDisplayConfiguration';
import { NodeDisplayConfigurationContext } from '../NodeDisplayConfigurationContext';

export class ApplyNodeRadius extends TransformTask {
  public constructor() {
    super('ApplyNodeRadius');
  }

  protected run(
    input: MutableScenarioResult,
    config: FinalGraphDisplayConfiguration,
  ): void {
    for (const [nodeId, node] of input.graph.nodes.entries()) {
      for (const label of node.labels) {
        const nodeConfig = config.nodeDisplayConfigurations.get(label);
        if (nodeConfig == null) {
          continue;
        }
        if (nodeConfig.radius === null) {
          continue;
        }

        const newValue = NodeDisplayConfigurationContext.create(
          nodeId,
          node,
        ).applyToTemplate(nodeConfig.radius);
        if (newValue.trim().length === 0) {
          continue;
        }

        const newRadius = parseFloat(newValue);
        if (isNaN(newRadius)) {
          strapi.log.warn(
            `Unable to parse node radius config: ${nodeConfig.radius} for label ${label}`,
          );
          continue;
        }
        node.radius = newRadius;
      }
    }
  }
}
