import { FinalGraphDisplayConfiguration } from '../display-configuration/FinalGraphDisplayConfiguration';
import { NodeDisplayConfigurationContext } from '../display-configuration/NodeDisplayConfigurationContext';
import { MutableGraph } from '../../graph/MutableGraph';
import { FinalNodeDisplayConfiguration } from '../display-configuration/FinalNodeDisplayConfiguration';
import { ScenarioPipelineStep } from '../ScenarioPipelineStep';
import { ScenarioPipelineState } from '../ScenarioPipelineState';

export class ApplyNodeDisplayText extends ScenarioPipelineStep {
  public constructor() {
    super('Apply Node Display Text');
  }

  public run(state: ScenarioPipelineState): void {
    const input: MutableGraph = state.graph;
    const config: FinalGraphDisplayConfiguration = state.displayConfiguration;

    for (const node of input.nodes.nodes) {
      for (const label of node.labels) {
        const nodeConfig: FinalNodeDisplayConfiguration | undefined =
          config.nodeDisplayConfigurations.get(label);
        if (nodeConfig == null) {
          continue;
        }
        if (nodeConfig.displayTextTemplate == null) {
          continue;
        }

        const newValue: string = NodeDisplayConfigurationContext.create(
          node,
          state.logger,
        ).applyToTemplate(nodeConfig.displayTextTemplate);
        if (newValue.trim().length === 0) {
          continue;
        }

        node.customTitle = newValue;
      }
    }
  }
}
