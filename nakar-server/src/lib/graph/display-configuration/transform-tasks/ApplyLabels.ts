import { TransformTask } from '../TransformTask';
import { MutableGraphColorPreset } from '../../MutableGraphColorPreset';
import { MutableGraphLabel } from '../../MutableGraphLabel';
import { MutableGraph } from '../../MutableGraph';

export class ApplyLabels extends TransformTask {
  public constructor() {
    super('ApplyLabels');
  }

  protected run(input: MutableGraph): void {
    for (const node of input.nodes.values()) {
      for (const label of node.labels) {
        const foundEntry = input.metaData.labels.get(label);

        if (!foundEntry) {
          input.metaData.labels.set(
            label,
            new MutableGraphLabel({
              color: MutableGraphColorPreset.create({
                index: input.metaData.labels.size,
              }),
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
