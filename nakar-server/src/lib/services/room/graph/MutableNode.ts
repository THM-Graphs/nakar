import { MutablePosition } from './MutablePosition';
import { MutablePropertyCollection } from './MutablePropertyCollection';
import { z } from 'zod';
import { SSet } from '../../../tools/Set';
import { MutableEdgeIndex } from './MutableEdgeIndex';
import { MutableEdge } from './MutableEdge';

export class MutableNode {
  public static readonly defaultRadius: number = 40;
  // eslint-disable-next-line @typescript-eslint/typedef
  public static readonly schema = z.object({
    id: z.string(),
    labels: z.array(z.string()),
    properties: MutablePropertyCollection.schema,
    radius: z.number(),
    position: MutablePosition.schema,
    namesInQuery: z.array(z.string()),
    customBackgroundColor: z.string().nullable(),
    customTitleColor: z.string().nullable(),
    customTitle: z.string().nullable(),
    locked: z.boolean(),
    grabs: z.array(z.string()),
    source: z.string(),
    additionalSources: z.array(z.string()),
  });

  public readonly id: string;
  public labels: SSet<string>;
  public properties: MutablePropertyCollection;
  public radius: number;
  public position: MutablePosition;
  public namesInQuery: SSet<string>;
  public customBackgroundColor: string | null;
  public customTitleColor: string | null;
  public customTitle: string | null;
  public locked: boolean;
  public grabs: SSet<string>;
  public source: string;
  public additionalSources: SSet<string>;

  /* runtime only */
  public velocityX: number;
  public velocityY: number;

  public constructor(data: {
    id: string;
    labels: SSet<string>;
    properties: MutablePropertyCollection;
    radius: number;
    position: MutablePosition;
    namesInQuery: SSet<string>;
    customBackgroundColor: string | null;
    customTitleColor: string | null;
    customTitle: string | null;
    locked: boolean;
    grabs: SSet<string>;
    source: string;
    additionalSources: SSet<string>;
  }) {
    this.id = data.id;
    this.labels = data.labels;
    this.properties = data.properties;
    this.radius = data.radius;
    this.position = data.position;
    this.namesInQuery = data.namesInQuery;
    this.customBackgroundColor = data.customBackgroundColor;
    this.customTitleColor = data.customTitleColor;
    this.customTitle = data.customTitle;
    this.locked = data.locked;
    this.grabs = data.grabs;
    this.source = data.source;
    this.additionalSources = data.additionalSources;

    this.velocityX = 0;
    this.velocityY = 0;
  }

  public get title(): string {
    return (
      this.customTitle ??
      this.properties.getStringValueOfProperty('name') ??
      this.properties.getStringValueOfProperty('title') ??
      this.properties.getStringValueOfProperty('type') ??
      this.properties.getStringValueOfProperty('label') ??
      this.properties.getStringValueOfProperty('id') ??
      this.properties.getStringValueOfProperty('slug') ??
      this.properties.firstStringValue() ??
      this.labels.toArray().join(', ')
    );
  }

  public static fromPlain(data: z.infer<typeof this.schema>): MutableNode {
    return new MutableNode({
      id: data.id,
      labels: new SSet(data.labels),
      properties: MutablePropertyCollection.fromPlain(data.properties),
      radius: data.radius,
      position: MutablePosition.fromPlain(data.position),
      namesInQuery: new SSet(data.namesInQuery),
      customBackgroundColor: data.customBackgroundColor,
      customTitleColor: data.customTitleColor,
      customTitle: data.customTitle,
      locked: data.locked,
      grabs: new SSet(data.grabs),
      source: data.source,
      additionalSources: new SSet(data.additionalSources),
    });
  }

  public toPlain(): z.infer<typeof MutableNode.schema> {
    return {
      id: this.id,
      labels: this.labels.toArray(),
      properties: this.properties.toPlain(),
      radius: this.radius,
      position: this.position,
      namesInQuery: this.namesInQuery.toArray(),
      customBackgroundColor: this.customBackgroundColor,
      customTitleColor: this.customTitleColor,
      customTitle: this.customTitle,
      locked: this.locked,
      grabs: this.grabs.toArray(),
      source: this.source,
      additionalSources: this.additionalSources.toArray(),
    };
  }

  public degree(edgeIndex: MutableEdgeIndex): number {
    return this.inDegree(edgeIndex) + this.outDegree(edgeIndex);
  }

  public inDegree(edgeIndex: MutableEdgeIndex): number {
    const inRelsCount: number = edgeIndex
      .getByEndNodeId(this.id)
      .reduce(
        (count: number, rel: MutableEdge): number =>
          count + rel.compressedCount,
        0,
      );

    return inRelsCount;
  }

  public outDegree(edgeIndex: MutableEdgeIndex): number {
    const outRelsCount: number = edgeIndex
      .getByStartNodeId(this.id)
      .reduce(
        (count: number, rel: MutableEdge): number =>
          count + rel.compressedCount,
        0,
      );

    return outRelsCount;
  }
}
