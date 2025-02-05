import { MutableGraphColorPreset } from '../../graph/MutableGraphColorPreset';
import { MutableGraphLabel } from '../../graph/MutableGraphLabel';
import { MutableGraph } from '../../graph/MutableGraph';
import { ScenarioPipelineStep } from '../ScenarioPipelineStep';

export class ApplyLabels extends ScenarioPipelineStep<void> {
  private _graph: MutableGraph;

  public constructor(graph: MutableGraph) {
    super('Apply Labels');
    this._graph = graph;
  }

  public run(): void {
    const input: MutableGraph = this._graph;
    for (const node of input.nodes.values()) {
      for (const label of node.labels) {
        const foundEntry: MutableGraphLabel | undefined =
          input.metaData.labels.get(label);

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
