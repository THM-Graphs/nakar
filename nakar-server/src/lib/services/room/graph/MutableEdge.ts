import { MutablePropertyCollection } from './MutablePropertyCollection';
import { SchemaEdge } from '../../../../../src-gen/schema';
import { z } from 'zod';
import { SSet } from '../../../tools/Set';

export class MutableEdge {
  public static readonly defaultWidth: number = 2;

  // eslint-disable-next-line @typescript-eslint/typedef
  public static readonly schema = z.object({
    startNodeId: z.string(),
    endNodeId: z.string(),
    type: z.string(),
    parallelCount: z.number(),
    parallelIndex: z.number(),
    compressedCount: z.number(),
    width: z.number(),
    properties: MutablePropertyCollection.schema,
    namesInQuery: z.array(z.string()),
    source: z.string(),
    additionalSources: z.array(z.string()),
  });

  public startNodeId: string;
  public endNodeId: string;
  public type: string;
  public parallelCount: number;
  public parallelIndex: number;
  public compressedCount: number;
  public width: number;
  public properties: MutablePropertyCollection;
  public namesInQuery: SSet<string>;
  public source: string;
  public additionalSources: SSet<string>;

  public constructor(data: {
    startNodeId: string;
    endNodeId: string;
    type: string;
    parallelCount: number;
    parallelIndex: number;
    compressedCount: number;
    width: number;
    properties: MutablePropertyCollection;
    namesInQuery: SSet<string>;
    source: string;
    additionalSources: SSet<string>;
  }) {
    this.startNodeId = data.startNodeId;
    this.endNodeId = data.endNodeId;
    this.type = data.type;
    this.parallelCount = data.parallelCount;
    this.parallelIndex = data.parallelIndex;
    this.compressedCount = data.compressedCount;
    this.width = data.width;
    this.properties = data.properties;
    this.namesInQuery = data.namesInQuery;
    this.source = data.source;
    this.additionalSources = data.additionalSources;
  }

  public get isLoop(): boolean {
    return this.startNodeId === this.endNodeId;
  }

  public static fromPlain(
    data: z.infer<typeof MutableEdge.schema>,
  ): MutableEdge {
    return new MutableEdge({
      startNodeId: data.startNodeId,
      endNodeId: data.endNodeId,
      type: data.type,
      parallelCount: data.parallelCount,
      parallelIndex: data.parallelIndex,
      compressedCount: data.compressedCount,
      width: data.width,
      properties: MutablePropertyCollection.fromPlain(data.properties),
      namesInQuery: new SSet(data.namesInQuery),
      source: data.source,
      additionalSources: new SSet(data.additionalSources),
    });
  }

  public toDto(id: string): SchemaEdge {
    return {
      id: id,
      startNodeId: this.startNodeId,
      endNodeId: this.endNodeId,
      type: this.type,
      isLoop: this.isLoop,
      parallelCount: this.parallelCount,
      parallelIndex: this.parallelIndex,
      compressedCount: this.compressedCount,
      width: this.width,
      properties: this.properties.toDto(),
      namesInQuery: this.namesInQuery.toArray(),
    };
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
      startNodeId: this.startNodeId,
      endNodeId: this.endNodeId,
      type: this.type,
      parallelCount: this.parallelCount,
      parallelIndex: this.parallelIndex,
      compressedCount: this.compressedCount,
      width: this.width,
      properties: this.properties.toPlain(),
      namesInQuery: this.namesInQuery.toArray(),
      source: this.source,
      additionalSources: this.additionalSources.toArray(),
    };
  }
}
