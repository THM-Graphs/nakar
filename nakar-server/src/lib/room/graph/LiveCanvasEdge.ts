import { LiveCanvasPropertyCollection } from './LiveCanvasPropertyCollection';
import { z } from 'zod';
import { SSet } from '../../set/Set';
import type { LiveCanvasUndoableData } from '../data/LiveCanvasUndoableData';
import { SMap } from '../../map/Map';
import { Range } from '../../range/Range';
import { ElementCreationReason } from './ElementCreationReason';
import { LiveCanvasViewSettings } from '../data/LiveCanvasViewSettings';

export class LiveCanvasEdge {
  public static readonly defaultWidth: number = 2;

  // eslint-disable-next-line @typescript-eslint/typedef
  public static readonly schema = z.object({
    id: z.string(),
    startNodeId: z.string(),
    endNodeId: z.string(),
    type: z.string(),
    compressed: z.array(z.string()),
    properties: LiveCanvasPropertyCollection.schema,
    namesInQuery: z.array(z.string()),
    source: z.string(),
    creationAction: z.nativeEnum(ElementCreationReason),
  });

  public readonly id: string;
  public readonly startNodeId: string;
  public readonly endNodeId: string;
  public readonly type: string;
  public readonly compressed: SSet<string>;
  public readonly properties: LiveCanvasPropertyCollection;
  public readonly namesInQuery: SSet<string>;
  public readonly source: string;
  public readonly creationAction: ElementCreationReason;

  public constructor(data: {
    id: string;
    startNodeId: string;
    endNodeId: string;
    type: string;
    compressed: SSet<string>;
    properties: LiveCanvasPropertyCollection;
    namesInQuery: SSet<string>;
    source: string;
    creationAction: ElementCreationReason;
  }) {
    this.id = data.id;
    this.startNodeId = data.startNodeId;
    this.endNodeId = data.endNodeId;
    this.type = data.type;
    this.compressed = data.compressed;
    this.properties = data.properties;
    this.namesInQuery = data.namesInQuery;
    this.source = data.source;
    this.creationAction = data.creationAction;
  }

  public get isLoop(): boolean {
    return this.startNodeId === this.endNodeId;
  }

  public get title(): string {
    return this.type;
  }

  public get isCluster(): boolean {
    return this.compressed.size > 0;
  }

  public get representationCount(): number {
    if (this.compressed.size === 0) {
      return 1;
    } else {
      return this.compressed.size;
    }
  }

  public static fromPlain(
    data: z.infer<typeof LiveCanvasEdge.schema>,
  ): LiveCanvasEdge {
    return new LiveCanvasEdge({
      id: data.id,
      startNodeId: data.startNodeId,
      endNodeId: data.endNodeId,
      type: data.type,
      compressed: new SSet(data.compressed),
      properties: LiveCanvasPropertyCollection.fromPlain(data.properties),
      namesInQuery: new SSet(data.namesInQuery),
      source: data.source,
      creationAction: data.creationAction,
    });
  }

  public getWidth(
    edgeWidthRange: Range,
    viewSettings: LiveCanvasViewSettings,
  ): number {
    const toRange: Range = new Range({
      floor: LiveCanvasEdge.defaultWidth,
      ceiling:
        LiveCanvasEdge.defaultWidth *
        viewSettings.compressRelationshipsWidthFactor,
    });

    const result: number = edgeWidthRange.scaleValue(
      toRange,
      this.representationCount,
      viewSettings.scaleType,
    );

    return result;
  }

  public isParallelTo(other: LiveCanvasEdge): boolean {
    return (
      (this.startNodeId === other.startNodeId &&
        this.endNodeId === other.endNodeId) ||
      (this.startNodeId === other.endNodeId &&
        this.endNodeId === other.startNodeId)
    );
  }

  public toPlain(): z.infer<typeof LiveCanvasEdge.schema> {
    return {
      id: this.id,
      startNodeId: this.startNodeId,
      endNodeId: this.endNodeId,
      type: this.type,
      compressed: this.compressed.toArray(),
      properties: this.properties.toPlain(),
      namesInQuery: this.namesInQuery.toArray(),
      source: this.source,
      creationAction: this.creationAction,
    };
  }

  public parallelEdges(graph: LiveCanvasUndoableData): LiveCanvasEdge[] {
    // Betrachtung: Beziehungen von Knoten mit geringerer ID zu Knoten mit höherer ID.
    const correctNodeSorting: boolean =
      this.startNodeId.localeCompare(this.endNodeId) < 0;

    const startNodeId: string = correctNodeSorting
      ? this.startNodeId
      : this.endNodeId;
    const endNodeId: string = correctNodeSorting
      ? this.endNodeId
      : this.startNodeId;

    const result: SMap<string, LiveCanvasEdge> = new SMap<
      string,
      LiveCanvasEdge
    >();
    for (const edge of graph.edges.getByStartAndEndNodeId(
      startNodeId,
      endNodeId,
    )) {
      result.set(edge.id, edge);
    }
    for (const edge of graph.edges.getByStartAndEndNodeId(
      endNodeId,
      startNodeId,
    )) {
      result.set(edge.id, edge);
    }

    return result.toValueArray();
  }

  public parallelCount(graph: LiveCanvasUndoableData): number {
    const parallelEdges: LiveCanvasEdge[] = this.parallelEdges(graph);

    const parallelCount: number = parallelEdges.length;
    return parallelCount;
  }

  public parallelIndex(graph: LiveCanvasUndoableData): number {
    const parallelEdges: LiveCanvasEdge[] = this.parallelEdges(graph);

    const selfIndex: number = parallelEdges.indexOf(this);
    const parallelCount: number = this.parallelCount(graph);

    const directionModifier: number =
      this.startNodeId.localeCompare(this.endNodeId) < 0 ? 1 : -1;

    if (this.isLoop) {
      return selfIndex;
    } else {
      if (parallelCount % 2 === 0) {
        if (selfIndex % 2 === 0) {
          return (selfIndex + 1) * directionModifier;
        } else {
          return -selfIndex * directionModifier;
        }
      } else {
        if (selfIndex % 2 === 0) {
          return selfIndex * directionModifier;
        } else {
          return -(selfIndex + 1) * directionModifier;
        }
      }
    }
  }

  public isDangling(graph: LiveCanvasUndoableData): boolean {
    const isDangling: boolean =
      !graph.nodes.hasById(this.startNodeId) ||
      !graph.nodes.hasById(this.endNodeId);

    return isDangling;
  }

  public copy(): LiveCanvasEdge {
    return new LiveCanvasEdge({
      id: this.id,
      startNodeId: this.startNodeId,
      endNodeId: this.endNodeId,
      type: this.type,
      compressed: this.compressed.copy(),
      properties: this.properties.copy(),
      namesInQuery: this.namesInQuery.copy(),
      source: this.source,
      creationAction: this.creationAction,
    });
  }

  public byChangingStartNodeId(newStartNodeId: string): LiveCanvasEdge {
    return new LiveCanvasEdge({
      id: this.id,
      startNodeId: newStartNodeId,
      endNodeId: this.endNodeId,
      type: this.type,
      compressed: this.compressed.copy(),
      properties: this.properties.copy(),
      namesInQuery: this.namesInQuery.copy(),
      source: this.source,
      creationAction: this.creationAction,
    });
  }

  public byChangingEndNodeId(newEndNodeId: string): LiveCanvasEdge {
    return new LiveCanvasEdge({
      id: this.id,
      startNodeId: this.startNodeId,
      endNodeId: newEndNodeId,
      type: this.type,
      compressed: this.compressed.copy(),
      properties: this.properties.copy(),
      namesInQuery: this.namesInQuery.copy(),
      source: this.source,
      creationAction: this.creationAction,
    });
  }
}
