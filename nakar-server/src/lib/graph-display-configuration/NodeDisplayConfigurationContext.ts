import { MutableNode } from '../graph-transformer/MutableNode';
import Handlebars from 'handlebars';

export class NodeDisplayConfigurationContext {
  public readonly nativeData: {
    id: string;
    label: Record<string, true>;
    nameInQuery: Record<string, true>;
    properties: Record<string, unknown>;
    inDegree: number;
    outDegree: number;
    degree: number;
  };

  public constructor(data: {
    id: string;
    label: Map<string, true>;
    nameInQuery: Map<string, true>;
    properties: Map<string, unknown>;
    inDegree: number;
    outDegree: number;
    degree: number;
  }) {
    this.nativeData = {
      id: data.id,
      label: data.label.toRecord(),
      nameInQuery: data.nameInQuery.toRecord(),
      properties: data.properties.toRecord(),
      inDegree: data.inDegree,
      outDegree: data.outDegree,
      degree: data.degree,
    };
  }

  public static create(
    nodeId: string,
    node: MutableNode,
  ): NodeDisplayConfigurationContext {
    return new NodeDisplayConfigurationContext({
      id: nodeId,
      label: NodeDisplayConfigurationContext.toTrueishMap(node.labels),
      nameInQuery: NodeDisplayConfigurationContext.toTrueishMap(
        node.namesInQuery,
      ),
      properties: node.properties.properties,
      degree: node.degree,
      inDegree: node.inDegree,
      outDegree: node.outDegree,
    });
  }

  private static toTrueishMap(input: Set<string>): Map<string, true> {
    return input.reduce<Map<string, true>>(
      (akku, next) => akku.bySetting(next, true),
      new Map(),
    );
  }

  public applyToTemplate(template: string): string {
    const c = Handlebars.compile(template);
    return c(this.nativeData);
  }
}
