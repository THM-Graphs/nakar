import { MutableNode } from './MutableNode';
import { MutableEdge } from './MutableEdge';
import { MutableGraphMetaData } from './MutableGraphMetaData';
import {
  SchemaEdge,
  SchemaGraph,
  SchemaNode,
} from '../../../../../src-gen/schema';
import { z } from 'zod';
import { SMap } from '../../../tools/Map';
import { v4 as uuidv4 } from 'uuid';
import { LoggerService } from '../../logger/LoggerService';

export class MutableGraph {
  // eslint-disable-next-line @typescript-eslint/typedef
  public static readonly schema = z.object({
    id: z.string(),
    nodes: z.record(MutableNode.schema),
    edges: z.record(MutableEdge.schema),
    metaData: MutableGraphMetaData.schema,
    tableData: z.array(z.record(z.unknown())),
  });

  public readonly id: string;
  public nodes: SMap<string, MutableNode>;
  public edges: SMap<string, MutableEdge>;
  public metaData: MutableGraphMetaData;
  public tableData: SMap<string, unknown>[];

  public constructor(data: {
    id: string;
    nodes: SMap<string, MutableNode>;
    edges: SMap<string, MutableEdge>;
    metaData: MutableGraphMetaData;
    tableData: SMap<string, unknown>[];
  }) {
    this.id = data.id;
    this.nodes = data.nodes;
    this.edges = data.edges;
    this.metaData = data.metaData;
    this.tableData = data.tableData;
  }

  public get size(): number {
    return this.nodes.size + this.edges.size;
  }

  public static empty(): MutableGraph {
    return new MutableGraph({
      id: uuidv4(),
      nodes: new SMap(),
      edges: new SMap(),
      metaData: MutableGraphMetaData.empty(),
      tableData: [],
    });
  }

  public static fromPlain(
    data: z.infer<typeof MutableGraph.schema>,
  ): MutableGraph {
    return new MutableGraph({
      id: data.id,
      nodes: SMap.fromRecord(data.nodes).map(
        (n: z.infer<typeof MutableNode.schema>): MutableNode =>
          MutableNode.fromPlain(n),
      ),
      edges: SMap.fromRecord(data.edges).map(
        (e: z.infer<typeof MutableEdge.schema>): MutableEdge =>
          MutableEdge.fromPlain(e),
      ),
      metaData: MutableGraphMetaData.fromPlain(data.metaData),
      tableData: data.tableData.map(
        (td: Record<string, unknown>): SMap<string, unknown> =>
          SMap.fromRecord(td),
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

  public toDto(logger: LoggerService): SchemaGraph {
    return {
      nodes: this.nodes
        .toArray()
        .map(
          ([id, node]: [string, MutableNode]): SchemaNode =>
            node.toDto(id, logger),
        ),
      edges: this.edges
        .toArray()
        .map(([id, edge]: [string, MutableEdge]): SchemaEdge => edge.toDto(id)),
      metaData: this.metaData.toDto(),
      tableData: this.tableData.map(
        (entry: SMap<string, unknown>): Record<string, unknown> =>
          entry.toRecord(),
      ),
    };
  }

  public byMergingWith(otherGraph: MutableGraph): MutableGraph {
    const graph: MutableGraph = new MutableGraph({
      id: this.id,
      nodes: this.nodes,
      edges: this.edges,
      metaData: this.metaData,
      tableData: this.tableData,
    });

    for (const otherNode of otherGraph.nodes) {
      if (!graph.nodes.has(otherNode[0])) {
        graph.nodes.set(otherNode[0], otherNode[1]);
      }
    }
    for (const otherEdge of otherGraph.edges) {
      if (!graph.edges.has(otherEdge[0])) {
        graph.edges.set(otherEdge[0], otherEdge[1]);
      }
    }
    return graph;
  }

  public toPlain(): z.infer<typeof MutableGraph.schema> {
    return {
      id: this.id,
      nodes: this.nodes
        .map(
          (n: MutableNode): z.infer<typeof MutableNode.schema> => n.toPlain(),
        )
        .toRecord(),
      edges: this.edges
        .map(
          (e: MutableEdge): z.infer<typeof MutableEdge.schema> => e.toPlain(),
        )
        .toRecord(),
      metaData: this.metaData.toPlain(),
      tableData: this.tableData.map(
        (td: SMap<string, unknown>): Record<string, unknown> => td.toRecord(),
      ),
    };
  }
}
