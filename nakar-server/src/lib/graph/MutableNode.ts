import { MutablePosition } from './MutablePosition';
import { Neo4jNode } from '../neo4j/Neo4jNode';
import { MutablePropertyCollection } from './MutablePropertyCollection';
import { SchemaNode } from '../../../src-gen/schema';
import { NodeDisplayConfigurationContext } from './display-configuration/NodeDisplayConfigurationContext';
import { z } from 'zod';
import { SSet } from '../tools/Set';

export class MutableNode {
  public static readonly defaultRadius = 60;
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

  /* runtime only */
  public velocityX: number;
  public velocityY: number;
  public grabs: SSet<string>;

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
    locked: boolean;
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
    this.customTitle = null;
    this.locked = data.locked;

    this.velocityX = 0;
    this.velocityY = 0;
    this.grabs = new SSet<string>();
  }

  public get degree(): number {
    return this.inDegree + this.outDegree;
  }

  public get title(): string {
    return (
      this.customTitle ??
      this.properties.getStringValueOfProperty('name') ??
      this.properties.getStringValueOfProperty('label') ??
      this.properties.firstStringValue() ??
      this.labels.toArray().join(', ')
    );
  }

  public static create(node: Neo4jNode): MutableNode {
    const properties = MutablePropertyCollection.create(node.node.properties);
    const labels = new SSet(node.node.labels);

    return new MutableNode({
      labels: labels,
      properties: properties,
      radius: MutableNode.defaultRadius,
      position: MutablePosition.default(),
      inDegree: 0,
      outDegree: 0,
      namesInQuery: node.keys,
      customBackgroundColor: null,
      customTitleColor: null,
      locked: false,
    });
  }

  public static fromPlain(input: unknown): MutableNode {
    const data = MutableNode.schema.parse(input);
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
      locked: data.locked,
    });
  }

  public toDto(id: string): SchemaNode {
    return {
      id: id,
      title: this.title,
      labels: this.labels.toArray(),
      properties: this.properties.toDto(),
      radius: this.radius,
      position: this.position,
      inDegree: this.inDegree,
      outDegree: this.outDegree,
      degree: this.degree,
      namesInQuery: this.namesInQuery.toArray(),
      displayConfigurationContext: NodeDisplayConfigurationContext.create(
        id,
        this,
      ),
      customBackgroundColor: this.customBackgroundColor,
      customTitleColor: this.customTitleColor,
    };
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
    };
  }
}
