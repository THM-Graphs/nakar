import {
  SchemaColor,
  SchemaGetInitialGraph,
  SchemaGraphLabel,
  SchemaPresetColorIndex,
} from '../../../../../src-gen/schema';
import { Transformer } from '../../types/Transformer';

export function applyLabels(): Transformer {
  return (graph: SchemaGetInitialGraph): SchemaGetInitialGraph => {
    let colorIndex: SchemaPresetColorIndex = 0;

    for (const node of graph.graph.nodes) {
      for (const label of node.labels) {
        const foundEntry = graph.graphMetaData.labels.find(
          (l) => l.label === label.label,
        );

        if (!foundEntry) {
          const color: SchemaColor = { type: 'PresetColor', index: colorIndex };
          const newEntry: SchemaGraphLabel = {
            label: label.label,
            color: color,
            count: 1,
          };
          graph.graphMetaData.labels.push(newEntry);

          label.color = color;
          label.count = 1;

          colorIndex = increment(colorIndex);
        } else {
          foundEntry.count += 1;
          label.count += 1;
          label.color = foundEntry.color;
        }
      }
    }

    return graph;
  };
}

function increment(index: SchemaPresetColorIndex): SchemaPresetColorIndex {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  return ((index + 1) % 6) as SchemaPresetColorIndex;
}
