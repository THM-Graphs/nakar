import { TransformTask } from '../TransformTask';
import { MutableScenarioResult } from '../../graph-transformer/MutableScenarioResult';
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
        if (nodeConfig.displayText === null) {
          continue;
        }

        const newValue = NodeDisplayConfigurationContext.create(
          nodeId,
          node,
        ).applyToTemplate(nodeConfig.displayText);
        if (newValue.trim().length === 0) {
          continue;
        }

        node.customDisplayText = newValue;
      }
    }
  }
}
