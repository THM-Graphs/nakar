import { GraphNode } from '../graph/GraphNode';
import { GraphEdge } from '../graph/GraphEdge';
import { LiveCanvasMetaData } from '../graph/LiveCanvasMetaData';
import { z } from 'zod';
import { SMap } from '../../map/Map';
import { v4 as uuidv4 } from 'uuid';
import { NodeIndex } from '../graph/NodeIndex';
import { EdgeIndex } from '../graph/EdgeIndex';
import { PhysicalGraph } from '../../physics/physical-graph/PhysicalGraph';
import { PhysicalNode } from '../../physics/physical-graph/PhysicalNode';
import { PhysicalEdge } from '../../physics/physical-graph/PhysicalEdge';
import { SSet } from '../../set/Set';
import { Result } from '@strapi/types/dist/modules/documents/result';
import { Range } from '../../range/Range';
import { Logger } from '@strapi/logger';
import { createChildLogger } from '../../logger/createChildLogger';
import { Profiler } from 'winston';
import { LiveCanvasViewSettings } from './LiveCanvasViewSettings';
import { LiveCanvasParameter } from '../graph/LiveCanvasParameter';
import { LiveCanvasNote } from './LiveCanvasNote';

export class LiveCanvasUndoableData {
  // eslint-disable-next-line @typescript-eslint/typedef
  public static readonly schema = z.object({
    id: z.string(),
    nodes: z.array(GraphNode.schema),
    edges: z.array(GraphEdge.schema),
    metaData: LiveCanvasMetaData.schema,
    tableData: z.array(z.record(z.unknown())),
    notes: z.array(LiveCanvasNote.schema),
  });

  public readonly id: string;
  public readonly nodes: NodeIndex;
  public readonly edges: EdgeIndex;
  public readonly metaData: LiveCanvasMetaData;
  public notes: SMap<string, LiveCanvasNote>;

  private _tableData: SMap<string, unknown>[];

  private readonly _logger: Logger = createChildLogger(this);

  public constructor(data: {
    id: string;
    nodes: NodeIndex;
    edges: EdgeIndex;
    metaData: LiveCanvasMetaData;
    tableData: SMap<string, unknown>[];
    notes: SMap<string, LiveCanvasNote>;
  }) {
    this.id = data.id;
    this.nodes = data.nodes;
    this.edges = data.edges;
    this.metaData = data.metaData;
    this._tableData = data.tableData;
    this.notes = data.notes;
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

  public static empty(): LiveCanvasUndoableData {
    return new LiveCanvasUndoableData({
      id: uuidv4(),
      nodes: new NodeIndex([]),
      edges: new EdgeIndex([]),
      metaData: LiveCanvasMetaData.empty(),
      tableData: [],
      notes: new SMap(),
    });
  }

  public static fromPlain(
    data: z.infer<typeof LiveCanvasUndoableData.schema>,
  ): LiveCanvasUndoableData {
    return new LiveCanvasUndoableData({
      id: data.id,
      nodes: new NodeIndex(
        data.nodes.map(
          (n: z.infer<typeof GraphNode.schema>): GraphNode =>
            GraphNode.fromPlain(n),
        ),
      ),
      edges: new EdgeIndex(
        data.edges.map(
          (e: z.infer<typeof GraphEdge.schema>): GraphEdge =>
            GraphEdge.fromPlain(e),
        ),
      ),
      metaData: LiveCanvasMetaData.fromPlain(data.metaData),
      tableData: data.tableData.map(
        (td: Record<string, unknown>): SMap<string, unknown> =>
          SMap.fromRecord(td),
      ),
      notes: data.notes
        .map(
          (n: z.infer<typeof LiveCanvasNote.schema>): LiveCanvasNote =>
            LiveCanvasNote.fromPlain(n),
        )
        .reduce(
          (
            akku: SMap<string, LiveCanvasNote>,
            next: LiveCanvasNote,
          ): SMap<string, LiveCanvasNote> => akku.bySetting(next.id, next),
          new SMap(),
        ),
    });
  }

  public static fromUnknown(input: unknown): LiveCanvasUndoableData {
    const data: z.infer<typeof LiveCanvasUndoableData.schema> =
      LiveCanvasUndoableData.schema.parse(input);
    return LiveCanvasUndoableData.fromPlain(data);
  }

  public static fromUnknownOrEmpty(input: unknown): LiveCanvasUndoableData {
    try {
      return LiveCanvasUndoableData.fromUnknown(input);
    } catch {
      return LiveCanvasUndoableData.empty();
    }
  }

  public resetFromInitialScenario(
    scenario: Result<'api::scenario.scenario'>,
    scenarioArguments: SMap<string, string>,
    parameters: Result<'api::query-parameter.query-parameter'>[],
  ): void {
    this.metaData.reset(
      scenario.documentId,
      scenarioArguments,
      parameters.map(
        (
          p: Result<'api::query-parameter.query-parameter'>,
        ): LiveCanvasParameter => LiveCanvasParameter.fromDb(p),
      ),
    );
    this.nodes.reset();
    this.edges.reset();
    this._tableData = [];
  }

  public toPlain(): z.infer<typeof LiveCanvasUndoableData.schema> {
    return {
      id: this.id,
      nodes: this.nodes.nodes.flatMap(
        (n: GraphNode): z.infer<typeof GraphNode.schema> => n.toPlain(),
      ),
      edges: this.edges.edges.flatMap(
        (e: GraphEdge): z.infer<typeof GraphEdge.schema> => e.toPlain(),
      ),
      metaData: this.metaData.toPlain(),
      tableData: this._tableData.map(
        (td: SMap<string, unknown>): Record<string, unknown> => td.toRecord(),
      ),
      notes: this.notes
        .toValueArray()
        .map(
          (n: LiveCanvasNote): z.infer<typeof LiveCanvasNote.schema> =>
            n.toPlain(),
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
      const foundNode: GraphNode | null = this.nodes.get(node.id);
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

  public copy(): LiveCanvasUndoableData {
    const task: Profiler = this._logger.startTimer();
    const copy: LiveCanvasUndoableData = new LiveCanvasUndoableData({
      id: uuidv4(),
      nodes: this.nodes.copy(),
      edges: this.edges.copy(),
      metaData: this.metaData.copy(),
      tableData: this._tableData.map(
        (e: SMap<string, unknown>): SMap<string, unknown> => e.copy(),
      ),
      notes: this.notes.map((n: LiveCanvasNote): LiveCanvasNote => n.copy()),
    });
    task.done({
      message: 'copy',
    });
    return copy;
  }

  public getNeighborsOfNode(node: GraphNode): SSet<GraphNode> {
    const result: SMap<string, GraphNode> = new SMap<string, GraphNode>();
    for (const outgoingEdge of this.edges.getByStartNodeId(node.id)) {
      const outgoindNode: GraphNode | null = this.nodes.get(
        outgoingEdge.endNodeId,
      );
      if (outgoindNode != null) {
        result.set(outgoindNode.id, outgoindNode);
      }
    }
    for (const incomingEdge of this.edges.getByEndNodeId(node.id)) {
      const incomingNode: GraphNode | null = this.nodes.get(
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
    node: GraphNode,
    label: string,
  ): SSet<GraphNode> {
    const neighbors: SSet<GraphNode> = this.getNeighborsOfNode(node);

    const clusterBuddies: SSet<GraphNode> = neighbors
      .reduce(
        (akku: SSet<GraphNode>, next: GraphNode): SSet<GraphNode> =>
          akku.byMerging(this.getNeighborsOfNode(next)),
        new SSet(),
      )
      .filter(
        (n: GraphNode): boolean =>
          n.labels.includes(label) &&
          n.compressed.size === 0 &&
          this.getNeighborsOfNode(n).isEqual(neighbors),
      );

    return clusterBuddies;
  }
}
