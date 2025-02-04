import { MutableNode } from '../MutableNode';
import { TemplateDelegate } from 'handlebars';
import { SMap } from '../../tools/Map';
import { SSet } from '../../tools/Set';

export class NodeDisplayConfigurationContext {
  private readonly _nativeData: {
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
    label: SMap<string, true>;
    nameInQuery: SMap<string, true>;
    properties: SMap<string, unknown>;
    inDegree: number;
    outDegree: number;
    degree: number;
  }) {
    this._nativeData = {
      id: data.id,
      label: data.label.toRecord(),
      nameInQuery: data.nameInQuery.toRecord(),
      properties: data.properties.toRecord(),
      inDegree: data.inDegree,
      outDegree: data.outDegree,
      degree: data.degree,
    };
  }

  public static create(nodeId: string, node: MutableNode): NodeDisplayConfigurationContext {
    return new NodeDisplayConfigurationContext({
      id: nodeId,
      label: NodeDisplayConfigurationContext._toTrueishMap(node.labels),
      nameInQuery: NodeDisplayConfigurationContext._toTrueishMap(node.namesInQuery),
      properties: node.properties.properties,
      degree: node.degree,
      inDegree: node.inDegree,
      outDegree: node.outDegree,
    });
  }

  private static _toTrueishMap(input: SSet<string>): SMap<string, true> {
    return input.reduce<SMap<string, true>>(
      (akku: SMap<string, true>, next: string): SMap<string, true> => akku.bySetting(next, true),
      new SMap(),
    );
  }

  public applyToTemplate(template: TemplateDelegate): string {
    return template(this._nativeData);
  }
}
