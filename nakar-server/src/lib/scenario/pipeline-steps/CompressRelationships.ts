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

  private _handledRelsCache: SMap<
    string,
    SMap<string, SMap<string, [string, MutableEdge]>>
  >;

  public constructor(
    graph: MutableGraph,
    config: FinalGraphDisplayConfiguration,
  ) {
    super('Compress Relationships');
    this._graph = graph;
    this._config = config;
    this._handledRelsCache = new SMap();
  }

  public async run(): Promise<void> {
    await wait(0);

    const input: MutableGraph = this._graph;
    const config: FinalGraphDisplayConfiguration = this._config;

    if (!config.compressRelationships) {
      return;
    }
    if (input.edges.size === 0) {
      return;
    }

    this._handledRelsCache = new SMap();
    const relationships: SMap<string, MutableEdge> = new SMap<
      string,
      MutableEdge
    >();
    for (const [edgeId, edge] of input.edges) {
      const compressedRelEntry: [string, MutableEdge] | null =
        this._getFromHandledRelsCache(
          edge.startNodeId,
          edge.endNodeId,
          edge.type,
        );
      if (compressedRelEntry == null) {
        edge.compressedCount = 1;
        edge.parallelCount = 1;
        edge.parallelIndex = 0;
        this._addToHandledRelsCache(
          edge.startNodeId,
          edge.endNodeId,
          edge.type,
          [edgeId, edge],
        );
        relationships.set(edgeId, edge);
      } else {
        compressedRelEntry[1].compressedCount += 1;
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

  private _addToHandledRelsCache(
    nodeAId: string,
    nodeBId: string,
    relType: string,
    rel: [string, MutableEdge],
  ): void {
    let subMap1: SMap<string, SMap<string, [string, MutableEdge]>> | undefined =
      this._handledRelsCache.get(nodeAId);
    if (!subMap1) {
      subMap1 = new SMap<string, SMap<string, [string, MutableEdge]>>();
      this._handledRelsCache.set(nodeAId, subMap1);
    }

    let subMap2: SMap<string, [string, MutableEdge]> | undefined =
      subMap1.get(nodeBId);
    if (!subMap2) {
      subMap2 = new SMap<string, [string, MutableEdge]>();
      subMap1.set(nodeBId, subMap2);
    }

    subMap2.set(relType, rel);
  }

  private _getFromHandledRelsCache(
    nodeAId: string,
    nodeBId: string,
    relType: string,
  ): [string, MutableEdge] | null {
    return (
      this._handledRelsCache.get(nodeAId)?.get(nodeBId)?.get(relType) ?? null
    );
  }
}
