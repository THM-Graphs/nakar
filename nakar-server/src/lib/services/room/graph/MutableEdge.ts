import { MutablePropertyCollection } from './MutablePropertyCollection';
import { z } from 'zod';
import { SSet } from '../../../tools/Set';
import { MutableEdgeIndex } from './MutableEdgeIndex';

export class MutableEdge {
  public static readonly defaultWidth: number = 2;

  // eslint-disable-next-line @typescript-eslint/typedef
  public static readonly schema = z.object({
    id: z.string(),
    startNodeId: z.string(),
    endNodeId: z.string(),
    type: z.string(),
    compressedCount: z.number(),
    width: z.number(),
    properties: MutablePropertyCollection.schema,
    namesInQuery: z.array(z.string()),
    source: z.string(),
  });

  public readonly id: string;
  public startNodeId: string;
  public endNodeId: string;
  public type: string;
  public compressedCount: number;
  public width: number;
  public properties: MutablePropertyCollection;
  public namesInQuery: SSet<string>;
  public source: string;

  public constructor(data: {
    id: string;
    startNodeId: string;
    endNodeId: string;
    type: string;
    compressedCount: number;
    width: number;
    properties: MutablePropertyCollection;
    namesInQuery: SSet<string>;
    source: string;
  }) {
    this.id = data.id;
    this.startNodeId = data.startNodeId;
    this.endNodeId = data.endNodeId;
    this.type = data.type;
    this.compressedCount = data.compressedCount;
    this.width = data.width;
    this.properties = data.properties;
    this.namesInQuery = data.namesInQuery;
    this.source = data.source;
  }

  public get isLoop(): boolean {
    return this.startNodeId === this.endNodeId;
  }

  public static fromPlain(
    data: z.infer<typeof MutableEdge.schema>,
  ): MutableEdge {
    return new MutableEdge({
      id: data.id,
      startNodeId: data.startNodeId,
      endNodeId: data.endNodeId,
      type: data.type,
      compressedCount: data.compressedCount,
      width: data.width,
      properties: MutablePropertyCollection.fromPlain(data.properties),
      namesInQuery: new SSet(data.namesInQuery),
      source: data.source,
    });
  }

  public isParallelTo(other: MutableEdge): boolean {
    return (
      (this.startNodeId === other.startNodeId &&
        this.endNodeId === other.endNodeId) ||
      (this.startNodeId === other.endNodeId &&
        this.endNodeId === other.startNodeId)
    );
  }

  public toPlain(): z.infer<typeof MutableEdge.schema> {
    return {
      id: this.id,
      startNodeId: this.startNodeId,
      endNodeId: this.endNodeId,
      type: this.type,
      compressedCount: this.compressedCount,
      width: this.width,
      properties: this.properties.toPlain(),
      namesInQuery: this.namesInQuery.toArray(),
      source: this.source,
    };
  }

  public parallelEdges(edgeIndex: MutableEdgeIndex): MutableEdge[] {
    // Betrachtung: Beziehungen von Knoten mit geringerer ID zu Knoten mit höherer ID.
    const correctNodeSorting: boolean =
      this.startNodeId.localeCompare(this.endNodeId) < 0;

    const startNodeId: string = correctNodeSorting
      ? this.startNodeId
      : this.endNodeId;
    const endNodeId: string = correctNodeSorting
      ? this.endNodeId
      : this.startNodeId;

    const parallelEdges: MutableEdge[] = [
      ...edgeIndex.getByStartAndEndNodeId(startNodeId, endNodeId),
      ...edgeIndex.getByStartAndEndNodeId(endNodeId, startNodeId),
    ].filter(
      (
        parallelEdge: MutableEdge,
        index: number,
        self: MutableEdge[],
      ): boolean =>
        index ===
        self.findIndex(
          (other: MutableEdge): boolean => other.id === parallelEdge.id,
        ),
    );

    return parallelEdges;
  }

  public parallelCount(edgeIndex: MutableEdgeIndex): number {
    const parallelEdges: MutableEdge[] = this.parallelEdges(edgeIndex);

    const parallelCount: number = parallelEdges.length;
    return parallelCount;
  }

  public parallelIndex(edgeIndex: MutableEdgeIndex): number {
    const parallelEdges: MutableEdge[] = this.parallelEdges(edgeIndex);

    const selfIndex: number = parallelEdges.indexOf(this);
    const parallelCount: number = this.parallelCount(edgeIndex);

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
}
