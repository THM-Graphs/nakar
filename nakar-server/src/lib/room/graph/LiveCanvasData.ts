import { LiveCanvasNode } from './LiveCanvasNode';
import { LiveCanvasEdge } from './LiveCanvasEdge';
import { LiveCanvasMetaData } from './LiveCanvasMetaData';
import { z } from 'zod';
import { SMap } from '../../map/Map';
import { v4 as uuidv4 } from 'uuid';
import { NodeIndex } from './NodeIndex';
import { EdgeIndex } from './EdgeIndex';
import type { PhysicalGraph } from '../../physics/physical-graph/PhysicalGraph';
import type { PhysicalNode } from '../../physics/physical-graph/PhysicalNode';
import type { PhysicalEdge } from '../../physics/physical-graph/PhysicalEdge';
import { SSet } from '../../set/Set';
import { Result } from '@strapi/types/dist/modules/documents/result';
import { Range } from '../../range/Range';
import { Logger } from '@strapi/logger';
import { createChildLogger } from '../../logger/createChildLogger';
import { Profiler } from 'winston';
import { LiveCanvasViewSettings } from './LiveCanvasViewSettings';

export class LiveCanvasData {
  // eslint-disable-next-line @typescript-eslint/typedef
  public static readonly schema = z.object({
    id: z.string(),
    nodes: z.array(LiveCanvasNode.schema),
    edges: z.array(LiveCanvasEdge.schema),
    metaData: LiveCanvasMetaData.schema,
    tableData: z.array(z.record(z.unknown())),
  });

  public readonly id: string;
  public readonly nodes: NodeIndex;
  public readonly edges: EdgeIndex;
  public readonly metaData: LiveCanvasMetaData;

  private _tableData: SMap<string, unknown>[];

  private readonly _logger: Logger = createChildLogger(this);

  public constructor(data: {
    id: string;
    nodes: NodeIndex;
    edges: EdgeIndex;
    metaData: LiveCanvasMetaData;
    tableData: SMap<string, unknown>[];
  }) {
    this.id = data.id;
    this.nodes = data.nodes;
    this.edges = data.edges;
    this.metaData = data.metaData;
    this._tableData = data.tableData;
  }

  public get size(): number {
    return this.nodes.size + this.edges.size;
  }

  public get tableData(): SMap<string, unknown>[] {
    return this._tableData;
  }

  public set tableData(newData: SMap<string, unknown>[]) {
    this._tableData = newData;
  }

  public static empty(): LiveCanvasData {
    return new LiveCanvasData({
      id: uuidv4(),
      nodes: new NodeIndex([]),
      edges: new EdgeIndex([]),
      metaData: LiveCanvasMetaData.empty(),
      tableData: [],
    });
  }

  public static fromPlain(
    data: z.infer<typeof LiveCanvasData.schema>,
  ): LiveCanvasData {
    return new LiveCanvasData({
      id: data.id,
      nodes: new NodeIndex(
        data.nodes.map(
          (n: z.infer<typeof LiveCanvasNode.schema>): LiveCanvasNode =>
            LiveCanvasNode.fromPlain(n),
        ),
      ),
      edges: new EdgeIndex(
        data.edges.map(
          (e: z.infer<typeof LiveCanvasEdge.schema>): LiveCanvasEdge =>
            LiveCanvasEdge.fromPlain(e),
        ),
      ),
      metaData: LiveCanvasMetaData.fromPlain(data.metaData),
      tableData: data.tableData.map(
        (td: Record<string, unknown>): SMap<string, unknown> =>
          SMap.fromRecord(td),
      ),
    });
  }

  public static fromUnknown(input: unknown): LiveCanvasData {
    const data: z.infer<typeof LiveCanvasData.schema> =
      LiveCanvasData.schema.parse(input);
    return LiveCanvasData.fromPlain(data);
  }

  public static fromUnknownOrEmpty(input: unknown): LiveCanvasData {
    try {
      return LiveCanvasData.fromUnknown(input);
    } catch {
      return LiveCanvasData.empty();
    }
  }

  public resetFromInitialScenario(
    scenario: Result<'api::v2-scenario.v2-scenario'>,
    scenarioArguments: SMap<string, string>,
  ): void {
    this.metaData.reset(scenario.documentId, scenarioArguments);
    this.nodes.reset();
    this.edges.reset();
    this._tableData = [];
  }

  public toPlain(): z.infer<typeof LiveCanvasData.schema> {
    return {
      id: this.id,
      nodes: this.nodes.nodes.flatMap(
        (n: LiveCanvasNode): z.infer<typeof LiveCanvasNode.schema> =>
          n.toPlain(),
      ),
      edges: this.edges.edges.flatMap(
        (e: LiveCanvasEdge): z.infer<typeof LiveCanvasEdge.schema> =>
          e.toPlain(),
      ),
      metaData: this.metaData.toPlain(),
      tableData: this._tableData.map(
        (td: SMap<string, unknown>): Record<string, unknown> => td.toRecord(),
      ),
    };
  }

  public removeDanglingEdges(): number {
    const task: Profiler = this._logger.startTimer();
    let edgesRemoved: number = 0;
    for (const edge of this.edges.edges) {
      const isDangling: boolean = edge.isDangling(this);

      if (isDangling) {
        this._logger.debug(
          `Relationship ${edge.type} (${edge.startNodeId} -> ${edge.endNodeId}) is dangling and will be removed.`,
        );
        const didRemove: boolean = this.edges.remove(edge);
        if (didRemove) {
          edgesRemoved += 1;
        }
      }
    }
    task.done({
      message: 'removeDanglingEdges',
    });
    return edgesRemoved;
  }

  public toPhysicalGraph(viewSettings: LiveCanvasViewSettings): PhysicalGraph {
    const task: Profiler = this._logger.startTimer();

    const nodes: Record<string, PhysicalNode> = {};
    const edges: Record<string, PhysicalEdge> = {};
    const degreeRange: Range = this.nodes.getNodeDegreeRange(this);

    for (const node of this.nodes.nodes) {
      nodes[node.id] = {
        id: node.id,
        radius: node.getRadius(viewSettings, degreeRange, this),
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

    task.done({
      message: 'toPhysicalGraph',
    });
    return result;
  }

  public applyPhysicalGraph(physicalGraph: PhysicalGraph): void {
    for (const node of Object.values(physicalGraph.nodes)) {
      const foundNode: LiveCanvasNode | null = this.nodes.get(node.id);
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

  public copy(): LiveCanvasData {
    const task: Profiler = this._logger.startTimer();
    const copy: LiveCanvasData = new LiveCanvasData({
      id: uuidv4(),
      nodes: this.nodes.copy(),
      edges: this.edges.copy(),
      metaData: this.metaData.copy(),
      tableData: this._tableData.map(
        (e: SMap<string, unknown>): SMap<string, unknown> => e.copy(),
      ),
    });
    task.done({
      message: 'copy',
    });
    return copy;
  }

  public getNeighborsOfNode(node: LiveCanvasNode): SSet<LiveCanvasNode> {
    const result: SMap<string, LiveCanvasNode> = new SMap<
      string,
      LiveCanvasNode
    >();
    for (const outgoingEdge of this.edges.getByStartNodeId(node.id)) {
      const outgoindNode: LiveCanvasNode | null = this.nodes.get(
        outgoingEdge.endNodeId,
      );
      if (outgoindNode != null) {
        result.set(outgoindNode.id, outgoindNode);
      }
    }
    for (const incomingEdge of this.edges.getByEndNodeId(node.id)) {
      const incomingNode: LiveCanvasNode | null = this.nodes.get(
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
    node: LiveCanvasNode,
    label: string,
  ): SSet<LiveCanvasNode> {
    const neighbors: SSet<LiveCanvasNode> = this.getNeighborsOfNode(node);

    const clusterBuddies: SSet<LiveCanvasNode> = neighbors
      .reduce(
        (
          akku: SSet<LiveCanvasNode>,
          next: LiveCanvasNode,
        ): SSet<LiveCanvasNode> =>
          akku.byMerging(this.getNeighborsOfNode(next)),
        new SSet(),
      )
      .filter(
        (n: LiveCanvasNode): boolean =>
          n.labels.has(label) &&
          n.compressed.size === 0 &&
          this.getNeighborsOfNode(n).isEqual(neighbors),
      );

    return clusterBuddies;
  }
}
