import { TransformTask } from '../TransformTask';
import { FinalGraphDisplayConfiguration } from '../FinalGraphDisplayConfiguration';
import { NodeDisplayConfigurationContext } from '../NodeDisplayConfigurationContext';
import { MutableGraph } from '../../MutableGraph';
import { FinalNodeDisplayConfiguration } from '../FinalNodeDisplayConfiguration';

export class ApplyNodeBackgroundColor extends TransformTask {
  public constructor() {
    super('Apply Node Background Color');
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

        if (nodeConfig.backgroundColorTemplate == null) {
          continue;
        }

        const newValue: string = NodeDisplayConfigurationContext.create(
          nodeId,
          node,
        ).applyToTemplate(nodeConfig.backgroundColorTemplate);

        if (newValue.trim().length === 0) {
          continue;
        }
        node.customBackgroundColor = newValue;
      }
    }
  }
}
