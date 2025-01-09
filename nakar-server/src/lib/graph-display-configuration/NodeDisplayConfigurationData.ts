import { SchemaNode } from '../../../src-gen/schema';
import Handlebars from 'handlebars';

export class NodeDisplayConfigurationData {
  public readonly id: string;
  public readonly labels: Record<string, true>;
  public readonly nameInQuery: Record<string, true>;
  public readonly properties: Record<string, unknown>;
  public readonly radius: number;
  public readonly inDegree: number;
  public readonly outDegree: number;
  public readonly degree: number;

  public constructor(data: {
    id: string;
    labels: Record<string, true>;
    properties: Record<string, unknown>;
    nameInQuery: Record<string, true>;
    radius: number;
    inDegree: number;
    outDegree: number;
    degree: number;
  }) {
    this.id = data.id;
    this.labels = data.labels;
    this.properties = data.properties;
    this.nameInQuery = data.nameInQuery;
    this.radius = data.radius;
    this.inDegree = data.inDegree;
    this.outDegree = data.outDegree;
    this.degree = data.degree;
  }

  public static fromNode(node: SchemaNode): NodeDisplayConfigurationData {
    return new NodeDisplayConfigurationData({
      id: node.id,
      labels: node.labels.reduce<Record<string, true>>(
        (akku, next) => ({ ...akku, [next.label]: true }),
        {},
      ),
      nameInQuery: {
        [node.nameInQuery]: true,
      },
      properties: node.properties.reduce<Record<string, unknown>>(
        (record, property) => {
          record[property.slug] = property.value;
          return record;
        },
        {},
      ),
      radius: node.radius,
      degree: node.degree,
      inDegree: node.inDegree,
      outDegree: node.outDegree,
    });
  }

  public applyToTemplate(template: string): string {
    const c = Handlebars.compile(template);
    return c(this); // TODO: dont send entire instance object
  }
}
