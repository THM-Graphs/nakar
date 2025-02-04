import { TransformTask } from '../TransformTask';
import { FinalGraphDisplayConfiguration } from '../FinalGraphDisplayConfiguration';
import { MutableEdge } from '../../MutableEdge';
import { Range } from '../../../tools/Range';
import { MutableGraph } from '../../MutableGraph';
import { SMap } from '../../../tools/Map';

export class CompressRelationships extends TransformTask {
  public constructor() {
    super('Compress Relationships');
  }

  protected run(
    input: MutableGraph,
    config: FinalGraphDisplayConfiguration,
  ): void {
    if (!config.compressRelationships) {
      return;
    }
    if (input.edges.size === 0) {
      return;
    }

    const relationships: SMap<string, MutableEdge> = new SMap<
      string,
      MutableEdge
    >();

    for (const [startNodeId] of input.nodes.entries()) {
      for (const [endNodeId] of input.nodes.entries()) {
        const edges: SMap<string, MutableEdge> = input.edges.filter(
          (e: MutableEdge): boolean =>
            e.startNodeId === startNodeId && e.endNodeId === endNodeId,
        );
        const edgeTypes: SMap<string, string> = edges.map(
          (e: MutableEdge): string => e.type,
        );

        for (const edgeType of edgeTypes.values()) {
          const count: number = input.edges.filter(
            (e: MutableEdge): boolean =>
              e.startNodeId === startNodeId &&
              e.endNodeId === endNodeId &&
              e.type === edgeType,
          ).size;
          const firstEdgeEntry: [string, MutableEdge] | null = edges.find(
            ([, edge]: [string, MutableEdge]): boolean =>
              edge.type === edgeType,
          );
          if (firstEdgeEntry == null) {
            // Should not happen
            strapi.log.error('Did not find edge for merging.');
            continue;
          }
          const [firstEdgeId, firstEdge]: [string, MutableEdge] =
            firstEdgeEntry;

          firstEdge.parallelCount = 1;
          firstEdge.parallelIndex = 0;
          firstEdge.compressedCount = count;
          relationships.set(firstEdgeId, firstEdge);
        }
      }
    }

    const compressedCounts: number[] = relationships.reduce(
      (akku: number[], key: string, edge: MutableEdge): number[] => [
        ...akku,
        edge.compressedCount,
      ],
      [],
    );

    const fromRange: Range = new Range({
      floor: Math.min(...compressedCounts),
      ceiling: Math.max(...compressedCounts),
    });

    const toRange: Range = new Range({
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

    input.edges = relationships;
  }
}
