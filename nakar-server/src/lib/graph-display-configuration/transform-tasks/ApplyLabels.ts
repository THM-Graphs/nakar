import { TransformTask } from '../TransformTask';
import { MutableScenarioResult } from '../../graph-transformer/MutableScenarioResult';
import { MutableGraphColorPreset } from '../../graph-transformer/MutableGraphColorPreset';
import { MutableGraphLabel } from '../../graph-transformer/MutableGraphLabel';

export class ApplyLabels extends TransformTask {
  public constructor() {
    super('ApplyLabels');
  }

  protected run(input: MutableScenarioResult): void {
    for (const node of input.graph.nodes.values()) {
      for (const label of node.labels) {
        const foundEntry = input.graph.metaData.labels.get(label);

        if (!foundEntry) {
          input.graph.metaData.labels.set(
            label,
            new MutableGraphLabel({
              color: MutableGraphColorPreset.create({
                index: input.graph.metaData.labels.size,
              }),
              count: 1,
            }),
          );
        } else {
          input.graph.metaData.labels.set(
            label,
            foundEntry.byIncrementingCount(),
          );
        }
      }
    }
  }
}
