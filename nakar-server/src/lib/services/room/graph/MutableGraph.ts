import { MutableNode } from './MutableNode';
import { MutableEdge } from './MutableEdge';
import { MutableGraphMetaData } from './MutableGraphMetaData';
import { z } from 'zod';
import { SMap } from '../../../tools/Map';
import { v4 as uuidv4 } from 'uuid';
import { LoggerService } from '../../logger/LoggerService';
import { MutableNodeIndex } from './MutableNodeIndex';
import { MutableEdgeIndex } from './MutableEdgeIndex';
import { GetScenarioDBDTO } from '../../database/dto/GetScenarioDBDTO';
import { MutableScenarioInfo } from './MutableScenarioInfo';
import { FinalGraphDisplayConfiguration } from '../scenario-pipeline/display-configuration/FinalGraphDisplayConfiguration';

export class MutableGraph {
  // eslint-disable-next-line @typescript-eslint/typedef
  public static readonly schema = z.object({
    id: z.string(),
    nodes: z.array(MutableNode.schema),
    edges: z.array(MutableEdge.schema),
    metaData: MutableGraphMetaData.schema,
    tableData: z.array(z.record(z.unknown())),
    displayConfiguration: FinalGraphDisplayConfiguration.schema,
  });

  public readonly id: string;
  public nodes: MutableNodeIndex;
  public edges: MutableEdgeIndex;
  public metaData: MutableGraphMetaData;
  public tableData: SMap<string, unknown>[];
  public displayConfiguration: FinalGraphDisplayConfiguration;

  public constructor(data: {
    id: string;
    nodes: MutableNodeIndex;
    edges: MutableEdgeIndex;
    metaData: MutableGraphMetaData;
    tableData: SMap<string, unknown>[];
    displayConfiguration: FinalGraphDisplayConfiguration;
  }) {
    this.id = data.id;
    this.nodes = data.nodes;
    this.edges = data.edges;
    this.metaData = data.metaData;
    this.tableData = data.tableData;
    this.displayConfiguration = data.displayConfiguration;
  }

  public get size(): number {
    return this.nodes.size + this.edges.size;
  }

  public static empty(): MutableGraph {
    return new MutableGraph({
      id: uuidv4(),
      nodes: new MutableNodeIndex([]),
      edges: new MutableEdgeIndex([]),
      metaData: MutableGraphMetaData.empty(),
      tableData: [],
      displayConfiguration: FinalGraphDisplayConfiguration.empty(),
    });
  }

  public static fromInitialScenario(
    scenario: GetScenarioDBDTO,
    displayConfig: FinalGraphDisplayConfiguration,
  ): MutableGraph {
    const graph: MutableGraph = new MutableGraph({
      id: uuidv4(),
      nodes: new MutableNodeIndex([]),
      edges: new MutableEdgeIndex([]),
      metaData: new MutableGraphMetaData({
        scenarioInfo: new MutableScenarioInfo({
          id: scenario.documentId,
          title: scenario.title,
        }),
        pipelineSummary: [],
      }),
      tableData: [],
      displayConfiguration: displayConfig,
    });

    return graph;
  }

  public static fromPlain(
    data: z.infer<typeof MutableGraph.schema>,
  ): MutableGraph {
    return new MutableGraph({
      id: data.id,
      nodes: new MutableNodeIndex(
        data.nodes.map(
          (n: z.infer<typeof MutableNode.schema>): MutableNode =>
            MutableNode.fromPlain(n),
        ),
      ),
      edges: new MutableEdgeIndex(
        data.edges.map(
          (e: z.infer<typeof MutableEdge.schema>): MutableEdge =>
            MutableEdge.fromPlain(e),
        ),
      ),
      metaData: MutableGraphMetaData.fromPlain(data.metaData),
      tableData: data.tableData.map(
        (td: Record<string, unknown>): SMap<string, unknown> =>
          SMap.fromRecord(td),
      ),
      displayConfiguration: FinalGraphDisplayConfiguration.fromPlain(
        data.displayConfiguration,
      ),
    });
  }

  public static fromUnknown(input: unknown): MutableGraph {
    const data: z.infer<typeof MutableGraph.schema> =
      MutableGraph.schema.parse(input);
    return MutableGraph.fromPlain(data);
  }

  public static fromUnknownOrEmpty(input: unknown): MutableGraph {
    try {
      return MutableGraph.fromUnknown(input);
    } catch {
      return MutableGraph.empty();
    }
  }

  public toPlain(): z.infer<typeof MutableGraph.schema> {
    return {
      id: this.id,
      nodes: this.nodes.nodes.flatMap(
        (n: MutableNode): z.infer<typeof MutableNode.schema> => n.toPlain(),
      ),
      edges: this.edges.edges.flatMap(
        (e: MutableEdge): z.infer<typeof MutableEdge.schema> => e.toPlain(),
      ),
      metaData: this.metaData.toPlain(),
      tableData: this.tableData.map(
        (td: SMap<string, unknown>): Record<string, unknown> => td.toRecord(),
      ),
      displayConfiguration: this.displayConfiguration.toPlain(),
    };
  }

  public removeDanglingEdges(logger?: LoggerService): void {
    for (const edge of this.edges.edges) {
      const isDangling: boolean = edge.isDangling(this);

      if (isDangling) {
        logger?.debug(
          this,
          `Relationship ${edge.type} (${edge.startNodeId} -> ${edge.endNodeId}) is dangling and will be removed.`,
        );
        this.edges.remove(edge);
      }
    }
  }
}
