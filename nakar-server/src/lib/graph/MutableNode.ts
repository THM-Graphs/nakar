import { MutablePosition } from './MutablePosition';
import { Neo4jNode } from '../neo4j/Neo4jNode';
import { MutablePropertyCollection } from './MutablePropertyCollection';
import { SchemaNode } from '../../../src-gen/schema';
import { NodeDisplayConfigurationContext } from './display-configuration/NodeDisplayConfigurationContext';

export class MutableNode {
  public labels: Set<string>;
  public properties: MutablePropertyCollection;
  public radius: number;
  public position: MutablePosition;
  public inDegree: number;
  public outDegree: number;
  public namesInQuery: Set<string>;
  public customBackgroundColor: string | null;
  public customTitleColor: string | null;
  public customTitle: string | null;

  public constructor(data: {
    labels: Set<string>;
    properties: MutablePropertyCollection;
    radius: number;
    position: MutablePosition;
    inDegree: number;
    outDegree: number;
    namesInQuery: Set<string>;
    customBackgroundColor: string | null;
    customTitleColor: string | null;
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
    const labels = new Set(node.node.labels);

    return new MutableNode({
      labels: labels,
      properties: properties,
      radius: 60,
      position: MutablePosition.default(),
      inDegree: 0,
      outDegree: 0,
      namesInQuery: node.keys,
      customBackgroundColor: null,
      customTitleColor: null,
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
}
