import {
  SchemaGetInitialGraph,
  SchemaGraphLabel,
  SchemaPresetColorIndex,
} from '../../../../../src-gen/schema';
import { Transformer } from '../../types/Transformer';

export function applyLabels(): Transformer {
  return (graph: SchemaGetInitialGraph): SchemaGetInitialGraph => {
    const labels = new Map<string, SchemaGraphLabel>();

    for (const node of graph.graph.nodes) {
      for (const label of node.labels) {
        const foundEntry = labels.get(label);

        if (!foundEntry) {
          labels.set(label, {
            label: label,
            color: {
              type: 'PresetColor',
              index: colorIndexFromCount(labels.size),
            },
            count: 1,
          });
        } else {
          labels.set(label, {
            ...foundEntry,
            count: foundEntry.count + 1,
          });
        }
      }
    }

    return {
      ...graph,
      graph: {
        ...graph.graph,
        metaData: {
          ...graph.graph.metaData,
          labels: [...labels.values()],
        },
      },
    };
  };
}

function colorIndexFromCount(count: number): SchemaPresetColorIndex {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  return (count % 6) as SchemaPresetColorIndex;
}
