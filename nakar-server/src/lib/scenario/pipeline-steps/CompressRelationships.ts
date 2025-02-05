import { FinalGraphDisplayConfiguration } from '../../graph/display-configuration/FinalGraphDisplayConfiguration';
import { MutableEdge } from '../../graph/MutableEdge';
import { Range } from '../../tools/Range';
import { MutableGraph } from '../../graph/MutableGraph';
import { SMap } from '../../tools/Map';
import { ScenarioPipelineStep } from '../ScenarioPipelineStep';
import { wait } from '../../tools/Wait';

export class CompressRelationships extends ScenarioPipelineStep<void> {
  private _graph: MutableGraph;
  private _config: FinalGraphDisplayConfiguration;

  public constructor(
    graph: MutableGraph,
    config: FinalGraphDisplayConfiguration,
  ) {
    super('Compress Relationships');
    this._graph = graph;
    this._config = config;
  }

  public async run(): Promise<void> {
    const input: MutableGraph = this._graph;
    const config: FinalGraphDisplayConfiguration = this._config;

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
      await wait(0);
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

    let minimumCompressedCounts: number = 1;
    let maximumCompressedCounts: number = 1;
    for (const relationship of relationships.values()) {
      if (relationship.compressedCount < minimumCompressedCounts) {
        minimumCompressedCounts = relationship.compressedCount;
      }
      if (relationship.compressedCount > maximumCompressedCounts) {
        maximumCompressedCounts = relationship.compressedCount;
      }
    }

    const fromRange: Range = new Range({
      floor: minimumCompressedCounts,
      ceiling: maximumCompressedCounts,
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
