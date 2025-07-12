import { MutableNode } from '../../graph/MutableNode';
import { TemplateDelegate } from 'handlebars';
import { SMap } from '../../../../tools/Map';
import { SSet } from '../../../../tools/Set';
import { LoggerService } from '../../../logger/LoggerService';
import z from 'zod';
import { MutableGraph } from '../../graph/MutableGraph';

export class NodeDisplayConfigurationContext {
  // eslint-disable-next-line @typescript-eslint/typedef
  public schema = z.object({
    id: z.string(),
    label: z.record(z.literal(true)),
    nameInQuery: z.record(z.literal(true)),
    properties: z.record(z.unknown()),
    inDegree: z.number(),
    outDegree: z.number(),
    degree: z.number(),
  });

  private readonly _nativeData: z.infer<typeof this.schema>;

  public constructor(
    data: {
      id: string;
      label: SMap<string, true>;
      nameInQuery: SMap<string, true>;
      properties: SMap<string, unknown>;
      inDegree: number;
      outDegree: number;
      degree: number;
    },
    private readonly _logger: LoggerService,
  ) {
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

  public static create(
    node: MutableNode,
    graph: MutableGraph,
    logger: LoggerService,
  ): NodeDisplayConfigurationContext {
    return new NodeDisplayConfigurationContext(
      {
        id: node.id,
        label: NodeDisplayConfigurationContext._toTrueishMap(node.labels),
        nameInQuery: NodeDisplayConfigurationContext._toTrueishMap(
          node.namesInQuery,
        ),
        properties: node.properties.properties,
        degree: node.degree(graph),
        inDegree: node.inDegree(graph),
        outDegree: node.outDegree(graph),
      },
      logger,
    );
  }

  private static _toTrueishMap(input: SSet<string>): SMap<string, true> {
    return input.reduce<SMap<string, true>>(
      (akku: SMap<string, true>, next: string): SMap<string, true> =>
        akku.bySetting(next, true),
      new SMap(),
    );
  }

  public applyToTemplate(template: TemplateDelegate): string {
    try {
      return template(this._nativeData);
    } catch {
      return '';
    }
  }

  public toPlain(): z.infer<typeof this.schema> {
    return this._nativeData;
  }
}
