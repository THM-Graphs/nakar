import { FinalGraphDisplayConfiguration } from '../display-configuration/FinalGraphDisplayConfiguration';
import { MutableEdge } from '../../graph/MutableEdge';
import { Range } from '../../../../tools/Range';
import { MutableGraph } from '../../graph/MutableGraph';
import { SMap } from '../../../../tools/Map';
import { ScenarioPipelineStep } from '../ScenarioPipelineStep';
import { ScenarioPipelineState } from '../ScenarioPipelineState';
import { MutableEdgeIndex } from '../../graph/MutableEdgeIndex';

export class CompressRelationships extends ScenarioPipelineStep {
  private _handledRelsCache: SMap<
    string,
    SMap<string, SMap<string, MutableEdge>>
  >;

  public constructor() {
    super('Compress Relationships');
    this._handledRelsCache = new SMap();
  }

  public run(state: ScenarioPipelineState): void {
    const input: MutableGraph = state.graph;
    const config: FinalGraphDisplayConfiguration = state.displayConfiguration;

    if (!config.compressRelationships) {
      return;
    }
    if (input.edges.size === 0) {
      return;
    }

    this._handledRelsCache = new SMap();
    const relationships: MutableEdgeIndex = new MutableEdgeIndex([]);
    for (const edge of input.edges.edges) {
      const compressedRelEntry: MutableEdge | null =
        this._getFromHandledRelsCache(
          edge.startNodeId,
          edge.endNodeId,
          edge.type,
        );
      if (compressedRelEntry == null) {
        edge.compressedCount = 1;
        this._addToHandledRelsCache(
          edge.startNodeId,
          edge.endNodeId,
          edge.type,
          edge,
        );
        relationships.add(edge);
      } else {
        compressedRelEntry.compressedCount += 1;
      }
    }

    let minimumCompressedCounts: number = 1;
    let maximumCompressedCounts: number = 1;
    for (const relationship of relationships.edges) {
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

    for (const relationship of relationships.edges) {
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
    rel: MutableEdge,
  ): void {
    let subMap1: SMap<string, SMap<string, MutableEdge>> | undefined =
      this._handledRelsCache.get(nodeAId);
    if (!subMap1) {
      subMap1 = new SMap<string, SMap<string, MutableEdge>>();
      this._handledRelsCache.set(nodeAId, subMap1);
    }

    let subMap2: SMap<string, MutableEdge> | undefined = subMap1.get(nodeBId);
    if (!subMap2) {
      subMap2 = new SMap<string, MutableEdge>();
      subMap1.set(nodeBId, subMap2);
    }

    subMap2.set(relType, rel);
  }

  private _getFromHandledRelsCache(
    nodeAId: string,
    nodeBId: string,
    relType: string,
  ): MutableEdge | null {
    return (
      this._handledRelsCache.get(nodeAId)?.get(nodeBId)?.get(relType) ?? null
    );
  }
}
