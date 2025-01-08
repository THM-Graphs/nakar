import { SchemaGraphProperty, SchemaNode } from '../../../src-gen/schema';
import { GraphDtoFactory } from '../graph-transformer/GraphDtoFactory';
import Handlebars from 'handlebars';

export class NodeDisplayConfigurationData {
  public constructor(
    private readonly data: {
      id: string;
      displayTitle: string;
      labels: string[];
      properties: Record<string, string>;
      radius: number;
      inDegree: number;
      outDegree: number;
      degree: number;
    },
  ) {}

  public static fromNode(node: SchemaNode): NodeDisplayConfigurationData {
    return new NodeDisplayConfigurationData({
      id: node.id,
      displayTitle: node.displayTitle,
      labels: node.labels.map((l) => l.label),
      properties: node.properties.reduce<Record<string, string>>(
        (
          record: Record<string, string>,
          property: SchemaGraphProperty,
        ): Record<string, string> => {
          record[property.slug] =
            GraphDtoFactory.getDisplayStringFromPropertyValue(property);
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
    return c(this.data);
  }
}
