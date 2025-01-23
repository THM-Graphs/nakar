import { TransformTask } from '../TransformTask';
import { MutableScenarioResult } from '../../MutableScenarioResult';
import { FinalGraphDisplayConfiguration } from '../FinalGraphDisplayConfiguration';
import { MutableEdge } from '../../MutableEdge';
import { Range } from '../../../tools/Range';

export class CompressRelationships extends TransformTask {
  public constructor() {
    super('CompressRelationships');
  }

  protected run(
    input: MutableScenarioResult,
    config: FinalGraphDisplayConfiguration,
  ): void {
    if (!config.compressRelationships) {
      return;
    }

    const relationships = new Map<string, MutableEdge>();

    for (const [startNodeId] of input.graph.nodes.entries()) {
      for (const [endNodeId] of input.graph.nodes.entries()) {
        const edges = input.graph.edges.filter(
          (e) => e.startNodeId === startNodeId && e.endNodeId === endNodeId,
        );
        const edgeTypes = new Set<string>(edges.map((e) => e.type).values());

        for (const edgeType of edgeTypes.values()) {
          const count = input.graph.edges.filter(
            (e) =>
              e.startNodeId === startNodeId &&
              e.endNodeId === endNodeId &&
              e.type === edgeType,
          ).size;
          const firstEdgeEntry = edges.find(
            ([, edge]) => edge.type === edgeType,
          );
          if (firstEdgeEntry == null) {
            // Should not happen
            strapi.log.error('Did not find edge for merging.');
            continue;
          }
          const [firstEdgeId, firstEdge] = firstEdgeEntry;

          firstEdge.parallelCount = 1;
          firstEdge.parallelIndex = 0;
          firstEdge.compressedCount = count;
          relationships.set(firstEdgeId, firstEdge);
        }
      }
    }

    const compressedCounts: number[] = relationships
      .toArray()
      .map(([, relationship]) => relationship.compressedCount);

    const fromRange = new Range({
      floor: Math.min(...compressedCounts),
      ceiling: Math.max(...compressedCounts),
    });

    const toRange = new Range({
      floor: 2,
      ceiling: 2 * config.compressRelationshipsWidthFactor,
    });

    for (const relationship of relationships.values()) {
      relationship.width = fromRange.scaleValue(
        toRange,
        relationship.compressedCount,
        config.scaleType,
      );
    }

    input.graph.edges = relationships;
  }
}
