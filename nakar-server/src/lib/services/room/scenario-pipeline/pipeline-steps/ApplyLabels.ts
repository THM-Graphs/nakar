import { MutableGraphColorPreset } from '../../graph/MutableGraphColorPreset';
import { MutableGraphLabel } from '../../graph/MutableGraphLabel';
import { MutableGraph } from '../../graph/MutableGraph';
import { ScenarioPipelineStep } from '../ScenarioPipelineStep';
import { ScenarioPipelineState } from '../ScenarioPipelineState';

export class ApplyLabels extends ScenarioPipelineStep {
  public constructor() {
    super('Apply Labels');
  }

  public run(state: ScenarioPipelineState): void {
    const input: MutableGraph = state.graph;
    for (const node of input.nodes.values()) {
      for (const label of node.labels) {
        const foundEntry: MutableGraphLabel | undefined =
          input.metaData.labels.get(label);

        if (!foundEntry) {
          const newColor: MutableGraphColorPreset =
            MutableGraphColorPreset.create({
              index: input.metaData.labels.size,
            });
          state.logger.debug(
            this,
            `Will create new label: ${label} with color: ${newColor.index.toString()}`,
          );
          input.metaData.labels.set(
            label,
            new MutableGraphLabel({
              color: newColor,
              count: 1,
            }),
          );
        } else {
          input.metaData.labels.set(label, foundEntry.byIncrementingCount());
        }
      }
    }
  }
}
