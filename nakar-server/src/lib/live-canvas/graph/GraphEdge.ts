import { PropertyCollection } from './PropertyCollection';
import { z } from 'zod';
import { SSet } from '../../../packages/set/Set';
import type { LiveCanvasUndoableData } from '../data/LiveCanvasUndoableData';
import { SMap } from '../../../packages/map/Map';
import { Range } from '../../../packages/range/Range';
import { ElementCreationReason } from './ElementCreationReason';
import type { LiveCanvasViewSettings } from '../view-settings/LiveCanvasViewSettings';
import type { LiveCanvasEdgeViewSettingsState } from '../view-settings/LiveCanvasEdgeViewSettingsState';

export class GraphEdge {
  public static readonly defaultWidth: number = 2;

  // eslint-disable-next-line @typescript-eslint/typedef
  public static readonly schema = z.object({
    id: z.string(),
    nativeId: z.string(),
    startNodeId: z.string(),
    endNodeId: z.string(),
    type: z.string(),
    compressed: z.array(z.string()),
    properties: PropertyCollection.schema,
    namesInQuery: z.array(z.string()),
    sourceId: z.string(),
    sourceTitle: z.string().nullable(),
    creationAction: z.enum(ElementCreationReason),
  });

  /** Internal application id */
  public readonly id: string;

  /** External id of source database */
  public readonly nativeId: string;

  public readonly startNodeId: string;
  public readonly endNodeId: string;
  public readonly type: string;
  public readonly compressed: SSet<string>;
  public readonly properties: PropertyCollection;
  public readonly namesInQuery: SSet<string>;

  /** ID of the source database */
  public readonly sourceId: string;

  public readonly sourceTitle: string | null;
  public readonly creationAction: ElementCreationReason;

  public constructor(data: {
    id: string;
    nativeId: string;
    startNodeId: string;
    endNodeId: string;
    type: string;
    compressed: SSet<string>;
    properties: PropertyCollection;
    namesInQuery: SSet<string>;
    sourceId: string;
    sourceTitle: string | null;
    creationAction: ElementCreationReason;
  }) {
    this.id = data.id;
    this.nativeId = data.nativeId;
    this.startNodeId = data.startNodeId;
    this.endNodeId = data.endNodeId;
    this.type = data.type;
    this.compressed = data.compressed;
    this.properties = data.properties;
    this.namesInQuery = data.namesInQuery;
    this.sourceId = data.sourceId;
    this.sourceTitle = data.sourceTitle;
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

  public static fromPlain(data: z.infer<typeof GraphEdge.schema>): GraphEdge {
    return new GraphEdge({
      id: data.id,
      nativeId: data.nativeId,
      startNodeId: data.startNodeId,
      endNodeId: data.endNodeId,
      type: data.type,
      compressed: new SSet(data.compressed),
      properties: PropertyCollection.fromPlain(data.properties),
      namesInQuery: new SSet(data.namesInQuery),
      sourceId: data.sourceId,
      sourceTitle: data.sourceTitle,
      creationAction: data.creationAction,
    });
  }

  public getWidth(
    edgeWidthRange: Range,
    viewSettings: LiveCanvasViewSettings,
  ): number {
    const edgeViewSettings: LiveCanvasEdgeViewSettingsState =
      viewSettings.getEdgeSettings(this.type);
    const baseWidth: number = edgeViewSettings.customWidth
      ? edgeViewSettings.width
      : GraphEdge.defaultWidth;

    const toRange: Range = new Range({
      floor: baseWidth,
      ceiling: baseWidth * viewSettings.compressRelationshipsWidthFactor,
    });

    const result: number = edgeWidthRange.scaleValue(
      toRange,
      this.representationCount,
      viewSettings.scaleType,
    );

    return result;
  }

  public isParallelTo(other: GraphEdge): boolean {
    return (
      (this.startNodeId === other.startNodeId &&
        this.endNodeId === other.endNodeId) ||
      (this.startNodeId === other.endNodeId &&
        this.endNodeId === other.startNodeId)
    );
  }

  public toPlain(): z.infer<typeof GraphEdge.schema> {
    return {
      id: this.id,
      nativeId: this.nativeId,
      startNodeId: this.startNodeId,
      endNodeId: this.endNodeId,
      type: this.type,
      compressed: this.compressed.toArray(),
      properties: this.properties.toPlain(),
      namesInQuery: this.namesInQuery.toArray(),
      sourceId: this.sourceId,
      sourceTitle: this.sourceTitle,
      creationAction: this.creationAction,
    };
  }

  public parallelEdges(graph: LiveCanvasUndoableData): GraphEdge[] {
    // Betrachtung: Beziehungen von Knoten mit geringerer ID zu Knoten mit höherer ID.
    const correctNodeSorting: boolean =
      this.startNodeId.localeCompare(this.endNodeId) < 0;

    const startNodeId: string = correctNodeSorting
      ? this.startNodeId
      : this.endNodeId;
    const endNodeId: string = correctNodeSorting
      ? this.endNodeId
      : this.startNodeId;

    const result: SMap<string, GraphEdge> = new SMap<string, GraphEdge>();
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
    const parallelEdges: GraphEdge[] = this.parallelEdges(graph);

    const parallelCount: number = parallelEdges.length;
    return parallelCount;
  }

  public parallelIndex(graph: LiveCanvasUndoableData): number {
    const parallelEdges: GraphEdge[] = this.parallelEdges(graph);

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

  public copy(): GraphEdge {
    return new GraphEdge({
      id: this.id,
      nativeId: this.nativeId,
      startNodeId: this.startNodeId,
      endNodeId: this.endNodeId,
      type: this.type,
      compressed: this.compressed.copy(),
      properties: this.properties.copy(),
      namesInQuery: this.namesInQuery.copy(),
      sourceId: this.sourceId,
      sourceTitle: this.sourceTitle,
      creationAction: this.creationAction,
    });
  }

  public byChangingStartNodeId(newStartNodeId: string): GraphEdge {
    return new GraphEdge({
      id: this.id,
      nativeId: this.nativeId,
      startNodeId: newStartNodeId,
      endNodeId: this.endNodeId,
      type: this.type,
      compressed: this.compressed.copy(),
      properties: this.properties.copy(),
      namesInQuery: this.namesInQuery.copy(),
      sourceId: this.sourceId,
      sourceTitle: this.sourceTitle,
      creationAction: this.creationAction,
    });
  }

  public byChangingEndNodeId(newEndNodeId: string): GraphEdge {
    return new GraphEdge({
      id: this.id,
      nativeId: this.nativeId,
      startNodeId: this.startNodeId,
      endNodeId: newEndNodeId,
      type: this.type,
      compressed: this.compressed.copy(),
      properties: this.properties.copy(),
      namesInQuery: this.namesInQuery.copy(),
      sourceId: this.sourceId,
      sourceTitle: this.sourceTitle,
      creationAction: this.creationAction,
    });
  }
}
