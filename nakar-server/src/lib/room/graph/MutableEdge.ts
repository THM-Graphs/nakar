import { MutablePropertyCollection } from './MutablePropertyCollection';
import { z } from 'zod';
import { SSet } from '../../tools/Set';
import { MutableGraph } from './MutableGraph';
import { SMap } from '../../tools/Map';
import { FinalGraphDisplayConfiguration } from '../scenario-pipeline/display-configuration/FinalGraphDisplayConfiguration';
import { Range } from '../../tools/Range';

export class MutableEdge {
  public static readonly defaultWidth: number = 2;

  // eslint-disable-next-line @typescript-eslint/typedef
  public static readonly schema = z.object({
    id: z.string(),
    startNodeId: z.string(),
    endNodeId: z.string(),
    type: z.string(),
    compressed: z.array(z.string()),
    properties: MutablePropertyCollection.schema,
    namesInQuery: z.array(z.string()),
    source: z.string(),
  });

  public readonly id: string;
  public startNodeId: string;
  public endNodeId: string;
  public type: string;
  public compressed: SSet<string>;
  public properties: MutablePropertyCollection;
  public namesInQuery: SSet<string>;
  public source: string;

  public constructor(data: {
    id: string;
    startNodeId: string;
    endNodeId: string;
    type: string;
    compressed: SSet<string>;
    properties: MutablePropertyCollection;
    namesInQuery: SSet<string>;
    source: string;
  }) {
    this.id = data.id;
    this.startNodeId = data.startNodeId;
    this.endNodeId = data.endNodeId;
    this.type = data.type;
    this.compressed = data.compressed;
    this.properties = data.properties;
    this.namesInQuery = data.namesInQuery;
    this.source = data.source;
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
    data: z.infer<typeof MutableEdge.schema>,
  ): MutableEdge {
    return new MutableEdge({
      id: data.id,
      startNodeId: data.startNodeId,
      endNodeId: data.endNodeId,
      type: data.type,
      compressed: new SSet(data.compressed),
      properties: MutablePropertyCollection.fromPlain(data.properties),
      namesInQuery: new SSet(data.namesInQuery),
      source: data.source,
    });
  }

  public getWidth(
    edgeWidthRange: Range | null,
    config: FinalGraphDisplayConfiguration,
  ): number {
    if (edgeWidthRange == null) {
      return MutableEdge.defaultWidth;
    }

    const toRange: Range = new Range({
      floor: MutableEdge.defaultWidth,
      ceiling:
        MutableEdge.defaultWidth * config.compressRelationshipsWidthFactor,
    });

    return edgeWidthRange.scaleValue(
      toRange,
      this.representationCount,
      config.scaleType,
    );
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
      compressed: this.compressed.toArray(),
      properties: this.properties.toPlain(),
      namesInQuery: this.namesInQuery.toArray(),
      source: this.source,
    };
  }

  public parallelEdges(graph: MutableGraph): MutableEdge[] {
    // Betrachtung: Beziehungen von Knoten mit geringerer ID zu Knoten mit höherer ID.
    const correctNodeSorting: boolean =
      this.startNodeId.localeCompare(this.endNodeId) < 0;

    const startNodeId: string = correctNodeSorting
      ? this.startNodeId
      : this.endNodeId;
    const endNodeId: string = correctNodeSorting
      ? this.endNodeId
      : this.startNodeId;

    const result: SMap<string, MutableEdge> = new SMap<string, MutableEdge>();
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

  public parallelCount(graph: MutableGraph): number {
    const parallelEdges: MutableEdge[] = this.parallelEdges(graph);

    const parallelCount: number = parallelEdges.length;
    return parallelCount;
  }

  public parallelIndex(graph: MutableGraph): number {
    const parallelEdges: MutableEdge[] = this.parallelEdges(graph);

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

  public isDangling(graph: MutableGraph): boolean {
    const isDangling: boolean =
      !graph.nodes.hasById(this.startNodeId) ||
      !graph.nodes.hasById(this.endNodeId);

    return isDangling;
  }

  public copy(): MutableEdge {
    return new MutableEdge({
      id: this.id,
      startNodeId: this.startNodeId,
      endNodeId: this.endNodeId,
      type: this.type,
      compressed: this.compressed.copy(),
      properties: this.properties.copy(),
      namesInQuery: this.namesInQuery.copy(),
      source: this.source,
    });
  }
}
