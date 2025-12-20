import { MutableNode } from './MutableNode';
import { MutableEdge } from './MutableEdge';
import { MutableGraphMetaData } from './MutableGraphMetaData';
import { z } from 'zod';
import { SMap } from '../../tools/Map';
import { v4 as uuidv4 } from 'uuid';
import type { LoggerService } from '../../logger/LoggerService';
import { MutableNodeIndex } from './MutableNodeIndex';
import { MutableEdgeIndex } from './MutableEdgeIndex';
import type { PhysicalGraph } from '../../physics/physical-graph/PhysicalGraph';
import type { PhysicalNode } from '../../physics/physical-graph/PhysicalNode';
import type { PhysicalEdge } from '../../physics/physical-graph/PhysicalEdge';
import { SSet } from '../../tools/Set';
import type { ProfilerService } from '../../profiler/ProfilerService';
import type { ProfilerTask } from '../../profiler/ProfilerTask';
import { Result } from '@strapi/types/dist/modules/documents/result';
import { Range } from '../../tools/Range';

export class MutableGraph {
  // eslint-disable-next-line @typescript-eslint/typedef
  public static readonly schema = z.object({
    id: z.string(),
    nodes: z.array(MutableNode.schema),
    edges: z.array(MutableEdge.schema),
    metaData: MutableGraphMetaData.schema,
    tableData: z.array(z.record(z.unknown())),
  });

  public readonly id: string;
  public nodes: MutableNodeIndex;
  public edges: MutableEdgeIndex;
  public metaData: MutableGraphMetaData;
  public tableData: SMap<string, unknown>[];

  public constructor(
    data: {
      id: string;
      nodes: MutableNodeIndex;
      edges: MutableEdgeIndex;
      metaData: MutableGraphMetaData;
      tableData: SMap<string, unknown>[];
    },
    private readonly _logger: LoggerService,
    private readonly _profiler: ProfilerService,
  ) {
    this.id = data.id;
    this.nodes = data.nodes;
    this.edges = data.edges;
    this.metaData = data.metaData;
    this.tableData = data.tableData;
  }

  public get size(): number {
    return this.nodes.size + this.edges.size;
  }

  public static empty(
    logger: LoggerService,
    profiler: ProfilerService,
  ): MutableGraph {
    return new MutableGraph(
      {
        id: uuidv4(),
        nodes: new MutableNodeIndex([], logger),
        edges: new MutableEdgeIndex([]),
        metaData: MutableGraphMetaData.empty(),
        tableData: [],
      },
      logger,
      profiler,
    );
  }

  public static fromPlain(
    data: z.infer<typeof MutableGraph.schema>,
    logger: LoggerService,
    profiler: ProfilerService,
  ): MutableGraph {
    return new MutableGraph(
      {
        id: data.id,
        nodes: new MutableNodeIndex(
          data.nodes.map(
            (n: z.infer<typeof MutableNode.schema>): MutableNode =>
              MutableNode.fromPlain(n, logger),
          ),
          logger,
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
      },
      logger,
      profiler,
    );
  }

  public static fromUnknown(
    input: unknown,
    logger: LoggerService,
    profiler: ProfilerService,
  ): MutableGraph {
    const data: z.infer<typeof MutableGraph.schema> =
      MutableGraph.schema.parse(input);
    return MutableGraph.fromPlain(data, logger, profiler);
  }

  public static fromUnknownOrEmpty(
    input: unknown,
    logger: LoggerService,
    profiler: ProfilerService,
  ): MutableGraph {
    try {
      return MutableGraph.fromUnknown(input, logger, profiler);
    } catch {
      return MutableGraph.empty(logger, profiler);
    }
  }

  public resetFromInitialScenario(
    scenario: Result<'api::v2-scenario.v2-scenario'>,
    scenarioArguments: SMap<string, string>,
  ): void {
    this.metaData = new MutableGraphMetaData({
      scenarioId: scenario.documentId,
      pipelineSummary: [],
      arguments: scenarioArguments,
    });
    this.nodes = new MutableNodeIndex([], this._logger);
    this.edges = new MutableEdgeIndex([]);
    this.tableData = [];
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
    };
  }

  public removeDanglingEdges(): number {
    const task: ProfilerTask = this._profiler.profile(
      this,
      'removeDanglingEdges',
    );
    let edgesRemoved: number = 0;
    for (const edge of this.edges.edges) {
      const isDangling: boolean = edge.isDangling(this);

      if (isDangling) {
        this._logger.debug(
          this,
          `Relationship ${edge.type} (${edge.startNodeId} -> ${edge.endNodeId}) is dangling and will be removed.`,
        );
        const didRemove: boolean = this.edges.remove(edge);
        if (didRemove) {
          edgesRemoved += 1;
        }
      }
    }
    task.finish();
    return edgesRemoved;
  }

  public toPhysicalGraph(
    canvas: Result<'api::v2-canvas.v2-canvas'>,
  ): PhysicalGraph {
    const task: ProfilerTask = this._profiler.profile(this, 'toPhysicalGraph');

    const nodes: Record<string, PhysicalNode> = {};
    const edges: Record<string, PhysicalEdge> = {};
    const degreeRange: Range = this.nodes.getNodeDegreeRange(this);

    for (const node of this.nodes.nodes) {
      nodes[node.id] = {
        id: node.id,
        radius: node.getRadius(canvas, degreeRange, this),
        position: { x: node.position.x, y: node.position.y },
        locked: node.locked,
        velocityX: 0,
        velocityY: 0,
      };
    }

    for (const edge of this.edges.edges) {
      edges[edge.id] = {
        id: edge.id,
        startNodeId: edge.startNodeId,
        endNodeId: edge.endNodeId,
        compressedCount: edge.representationCount,
        isLoop: edge.isLoop,
        title: edge.title,
      };
    }

    const result: PhysicalGraph = {
      nodes: nodes,
      edges: edges,
    };

    task.finish();
    return result;
  }

  public applyPhysicalGraph(
    physicalGraph: PhysicalGraph,
    logger: LoggerService,
  ): void {
    for (const node of Object.values(physicalGraph.nodes)) {
      const foundNode: MutableNode | null = this.nodes.get(node.id);
      if (foundNode == null) {
        // This can happen, if the graphs are out of sync for a short period of time.
        continue;
      }
      if (foundNode.locked) {
        continue;
      }
      foundNode.position.x = node.position.x;
      foundNode.position.y = node.position.y;
    }
  }

  public copy(): MutableGraph {
    const task: ProfilerTask = this._profiler.profile(this, 'copy');
    const copy: MutableGraph = new MutableGraph(
      {
        id: uuidv4(),
        nodes: this.nodes.copy(),
        edges: this.edges.copy(),
        metaData: this.metaData.copy(),
        tableData: this.tableData.map(
          (e: SMap<string, unknown>): SMap<string, unknown> => e.copy(),
        ),
      },
      this._logger,
      this._profiler,
    );
    task.finish();
    return copy;
  }

  public getNeighborsOfNode(node: MutableNode): SSet<MutableNode> {
    const result: SMap<string, MutableNode> = new SMap<string, MutableNode>();
    for (const outgoingEdge of this.edges.getByStartNodeId(node.id)) {
      const outgoindNode: MutableNode | null = this.nodes.get(
        outgoingEdge.endNodeId,
      );
      if (outgoindNode != null) {
        result.set(outgoindNode.id, outgoindNode);
      }
    }
    for (const incomingEdge of this.edges.getByEndNodeId(node.id)) {
      const incomingNode: MutableNode | null = this.nodes.get(
        incomingEdge.startNodeId,
      );
      if (incomingNode != null) {
        result.set(incomingNode.id, incomingNode);
      }
    }
    return new SSet(result.values());
  }

  /** This method will return siblings, but only if all siblings the exact same neighbors and have the same label */
  public getClusterBuddiesOfNode(
    node: MutableNode,
    label: string,
  ): SSet<MutableNode> {
    const neighbors: SSet<MutableNode> = this.getNeighborsOfNode(node);

    const clusterBuddies: SSet<MutableNode> = neighbors
      .reduce(
        (akku: SSet<MutableNode>, next: MutableNode): SSet<MutableNode> =>
          akku.byMerging(this.getNeighborsOfNode(next)),
        new SSet(),
      )
      .filter(
        (n: MutableNode): boolean =>
          n.labels.has(label) &&
          n.compressed.size === 0 &&
          this.getNeighborsOfNode(n).isEqual(neighbors),
      );

    return clusterBuddies;
  }
}
