import { MutablePosition } from './MutablePosition';
import { MutablePropertyCollection } from './MutablePropertyCollection';
import { z } from 'zod';
import { SSet } from '../../../tools/Set';
import { MutableSourceDefinition } from './MutableSourceDefinition';

export class MutableNode {
  public static readonly defaultRadius: number = 40;
  // eslint-disable-next-line @typescript-eslint/typedef
  public static readonly schema = z.object({
    labels: z.array(z.string()),
    properties: MutablePropertyCollection.schema,
    radius: z.number(),
    position: MutablePosition.schema,
    inDegree: z.number(),
    outDegree: z.number(),
    namesInQuery: z.array(z.string()),
    customBackgroundColor: z.string().nullable(),
    customTitleColor: z.string().nullable(),
    customTitle: z.string().nullable(),
    locked: z.boolean(),
    grabs: z.array(z.string()),
    source: z.string(),
    additionalSources: z.array(z.string()),
  });

  public labels: SSet<string>;
  public properties: MutablePropertyCollection;
  public radius: number;
  public position: MutablePosition;
  public inDegree: number;
  public outDegree: number;
  public namesInQuery: SSet<string>;
  public customBackgroundColor: string | null;
  public customTitleColor: string | null;
  public customTitle: string | null;
  public locked: boolean;
  public grabs: SSet<string>;
  public source: MutableSourceDefinition;
  public additionalSources: SSet<MutableSourceDefinition>;

  /* runtime only */
  public velocityX: number;
  public velocityY: number;

  public constructor(data: {
    labels: SSet<string>;
    properties: MutablePropertyCollection;
    radius: number;
    position: MutablePosition;
    inDegree: number;
    outDegree: number;
    namesInQuery: SSet<string>;
    customBackgroundColor: string | null;
    customTitleColor: string | null;
    customTitle: string | null;
    locked: boolean;
    grabs: SSet<string>;
    source: MutableSourceDefinition;
    additionalSources: SSet<MutableSourceDefinition>;
  }) {
    this.labels = data.labels;
    this.properties = data.properties;
    this.radius = data.radius;
    this.position = data.position;
    this.inDegree = data.inDegree;
    this.outDegree = data.outDegree;
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

  public get degree(): number {
    return this.inDegree + this.outDegree;
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
      labels: new SSet(data.labels),
      properties: MutablePropertyCollection.fromPlain(data.properties),
      radius: data.radius,
      position: MutablePosition.fromPlain(data.position),
      inDegree: data.inDegree,
      outDegree: data.outDegree,
      namesInQuery: new SSet(data.namesInQuery),
      customBackgroundColor: data.customBackgroundColor,
      customTitleColor: data.customTitleColor,
      customTitle: data.customTitle,
      locked: data.locked,
      grabs: new SSet(data.grabs),
      source: MutableSourceDefinition.fromPlain(data.source),
      additionalSources: new SSet(
        data.additionalSources.map(
          (additionalSource: string): MutableSourceDefinition => {
            return MutableSourceDefinition.fromPlain(additionalSource);
          },
        ),
      ),
    });
  }

  public toPlain(): z.infer<typeof MutableNode.schema> {
    return {
      labels: this.labels.toArray(),
      properties: this.properties.toPlain(),
      radius: this.radius,
      position: this.position,
      inDegree: this.inDegree,
      outDegree: this.outDegree,
      namesInQuery: this.namesInQuery.toArray(),
      customBackgroundColor: this.customBackgroundColor,
      customTitleColor: this.customTitleColor,
      customTitle: this.customTitle,
      locked: this.locked,
      grabs: this.grabs.toArray(),
      source: this.source.toPlain(),
      additionalSources: this.additionalSources
        .toArray()
        .map((additionalSource: MutableSourceDefinition): string => {
          return additionalSource.toPlain();
        }),
    };
  }
}
