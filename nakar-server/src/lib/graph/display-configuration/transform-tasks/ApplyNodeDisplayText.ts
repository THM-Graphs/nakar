import { TransformTask } from '../TransformTask';
import { MutableScenarioResult } from '../../MutableScenarioResult';
import { FinalGraphDisplayConfiguration } from '../FinalGraphDisplayConfiguration';
import { NodeDisplayConfigurationContext } from '../NodeDisplayConfigurationContext';

export class ApplyNodeDisplayText extends TransformTask {
  public constructor() {
    super('ApplyNodeDisplayText');
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
        if (nodeConfig.displayTextTemplate == null) {
          continue;
        }

        const newValue = NodeDisplayConfigurationContext.create(
          nodeId,
          node,
        ).applyToTemplate(nodeConfig.displayTextTemplate);
        if (newValue.trim().length === 0) {
          continue;
        }

        node.customTitle = newValue;
      }
    }
  }
}
