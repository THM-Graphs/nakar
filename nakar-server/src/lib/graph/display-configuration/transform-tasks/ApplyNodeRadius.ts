import { TransformTask } from '../TransformTask';
import { FinalGraphDisplayConfiguration } from '../FinalGraphDisplayConfiguration';
import { NodeDisplayConfigurationContext } from '../NodeDisplayConfigurationContext';
import { MutableGraph } from '../../MutableGraph';
import { FinalNodeDisplayConfiguration } from '../FinalNodeDisplayConfiguration';

export class ApplyNodeRadius extends TransformTask {
  public constructor() {
    super('Apply Node Radius');
  }

  protected run(
    input: MutableGraph,
    config: FinalGraphDisplayConfiguration,
  ): void {
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
