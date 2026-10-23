import { DataRecord } from '../data/DataRecord';
import { SSet } from '../../set/Set';
import type { PhysicalGraph } from '../../physics/physical-graph/PhysicalGraph';
import type { EdgeData } from '../data/EdgeData';
import type { GraphData } from '../data/GraphData';
import type { MergeData } from '../data/MergeData';
import type { NodeData } from '../data/NodeData';
import type { QueryResult } from '../data/QueryResult';
import { CanvasEdge } from './CanvasEdge';
import { CanvasNode } from './CanvasNode';
import type { CanvasViewSettings } from '../view-settings/CanvasViewSettings';
import { CanvasError } from '../CanvasError';

/**
 * References graph data and performs graph editing, clustering, merging, traversal and physics conversion.
 */
export class CanvasGraph {
  /**
   * Retains the configuration used by CanvasGraph operations.
   * @param _data - Data object or snapshot used to initialize the operation.
   */
  public constructor(
    private readonly _data: GraphData = {
      nodes: [],
      edges: [],
      table: [],
      notes: [],
      scenarioId: null,
      arguments: {},
      parameters: [],
    },
  ) {}

  /**
   * Returns a deep snapshot that callers can modify without mutating the referenced data.
   * @returns A deep snapshot that callers can modify without mutating the referenced data.
   */
  public toData(): GraphData {
    return structuredClone(this._data);
  }

  /**
   * Returns a node wrapper referencing the matching data or throws when the ID is absent.
   * @param id - Canonical identity of the selected object.
   * @returns A node wrapper referencing the matching graph data.
   * @throws {@link CanvasError} When the input, lifecycle state or permissions do not satisfy this operation’s requirements.
   */
  public getNode(id: string): CanvasNode {
    const data: NodeData | undefined = this._data.nodes.find(
      (node: NodeData): boolean => node.id === id,
    );
    if (data === undefined) {
      throw new CanvasError('not-found', `Node ${id} not found.`);
    }
    return new CanvasNode(data);
  }

  /**
   * Returns a relationship wrapper referencing the matching data or throws when the ID is absent.
   * @param id - Canonical identity of the selected object.
   * @returns A relationship wrapper referencing the matching graph data.
   * @throws {@link CanvasError} When the input, lifecycle state or permissions do not satisfy this operation’s requirements.
   */
  public getEdge(id: string): CanvasEdge {
    const data: EdgeData | undefined = this._data.edges.find(
      (edge: EdgeData): boolean => edge.id === id,
    );
    if (data === undefined) {
      throw new CanvasError('not-found', `Edge ${id} not found.`);
    }
    return new CanvasEdge(data);
  }

  /**
   * Adds missing source elements, merges cluster membership and remaps endpoints to existing node clusters.
   * @param result - Normalized source result to add.
   */
  public add(result: QueryResult): void {
    for (const node of result.nodes) {
      if (
        !this._data.nodes.some(
          (existing: NodeData): boolean =>
            existing.id === node.id ||
            (existing.sourceId === node.sourceId &&
              existing.compressed.includes(node.nativeId)),
        )
      ) {
        new CanvasNode(node).move(node.position);
        this._data.nodes.push(structuredClone(node));
      }
    }
    for (const edge of result.edges) {
      if (
        !this._data.edges.some(
          (existing: EdgeData): boolean =>
            existing.id === edge.id ||
            (existing.sourceId === edge.sourceId &&
              existing.compressed.includes(edge.nativeId)),
        )
      ) {
        const copy: EdgeData = structuredClone(edge);
        const start: NodeData | undefined = this._data.nodes.find(
          (node: NodeData): boolean =>
            node.sourceId === edge.sourceId &&
            node.compressed.includes(edge.startNativeNodeId),
        );
        const end: NodeData | undefined = this._data.nodes.find(
          (node: NodeData): boolean =>
            node.sourceId === edge.sourceId &&
            node.compressed.includes(edge.endNativeNodeId),
        );
        copy.startNodeId = start?.id ?? copy.startNodeId;
        copy.endNodeId = end?.id ?? copy.endNodeId;
        this._data.edges.push(copy);
      }
    }
    this.removeDanglingEdges();
  }

  /**
   * Removes relationships whose canonical endpoints are absent.
   */
  public removeDanglingEdges(): void {
    const ids: string[] = this._data.nodes.map(
      (node: NodeData): string => node.id,
    );
    this._data.edges = this._data.edges.filter(
      (edge: EdgeData): boolean => !new CanvasEdge(edge).isDangling(ids),
    );
  }

  /**
   * Returns unique canonical IDs of nodes adjacent to the requested node.
   * @param id - Canonical identity of the selected object.
   * @returns Distinct neighboring canonical node IDs in sorted order.
   */
  public neighbors(id: string): string[] {
    return new SSet(
      this._data.edges.flatMap((edge: EdgeData): string[] => {
        if (edge.startNodeId === id) {
          return [edge.endNodeId];
        }
        if (edge.endNodeId === id) {
          return [edge.startNodeId];
        }
        return [];
      }),
    )
      .toArray()
      .sort();
  }

  /**
   * Counts incident relationships, including represented cluster members.
   * @param id - Canonical identity of the selected object.
   * @returns The weighted number of incident relationship representations.
   */
  public degree(id: string): number {
    return this._data.edges.reduce(
      (sum: number, edge: EdgeData): number =>
        sum +
        (Number(edge.startNodeId === id) + Number(edge.endNodeId === id)) *
          new CanvasEdge(edge).representationCount(),
      0,
    );
  }

  /**
   * Deletes nodes and relationships matching any supplied ID, label or relationship type and prunes dangling relationships.
   * @param nodeIds - Canonical identities of the selected nodes.
   * @param labels - Node labels selected by this operation.
   * @param edgeIds - Canonical identities of the selected relationships.
   * @param edgeTypes - Relationship types selected by this operation.
   */
  public deleteElements(
    nodeIds: readonly string[],
    labels: readonly string[],
    edgeIds: readonly string[],
    edgeTypes: readonly string[],
  ): void {
    this._data.nodes = this._data.nodes.filter(
      (node: NodeData): boolean =>
        !nodeIds.includes(node.id) &&
        !node.labels.some((label: string): boolean => labels.includes(label)),
    );
    this._data.edges = this._data.edges.filter(
      (edge: EdgeData): boolean =>
        !edgeIds.includes(edge.id) && !edgeTypes.includes(edge.type),
    );
    this.removeDanglingEdges();
  }

  /**
   * Keeps selected nodes and removes relationships without both endpoints.
   * @param ids - Canonical identities selected by this operation.
   */
  public focusNodes(ids: readonly string[]): void {
    this.deleteElements(
      this._data.nodes
        .filter((node: NodeData): boolean => !ids.includes(node.id))
        .map((node: NodeData): string => node.id),
      [],
      [],
      [],
    );
  }

  /**
   * Keeps selected relationships and only their incident nodes.
   * @param ids - Canonical identities selected by this operation.
   */
  public focusRelationships(ids: readonly string[]): void {
    this._data.edges = this._data.edges.filter((edge: EdgeData): boolean =>
      ids.includes(edge.id),
    );
    this.focusNodes(
      this._data.edges.flatMap((edge: EdgeData): string[] => [
        edge.startNodeId,
        edge.endNodeId,
      ]),
    );
  }

  /**
   * Keeps relationships of the selected types while preserving all nodes.
   * @param types - Relationship types to retain.
   */
  public focusRelationshipTypes(types: readonly string[]): void {
    this._data.edges = this._data.edges.filter((edge: EdgeData): boolean =>
      types.includes(edge.type),
    );
  }

  /**
   * Removes nodes that have no incident relationships.
   */
  public removeDanglingNodes(): void {
    this.focusNodes(
      this._data.nodes
        .filter((node: NodeData): boolean => this.neighbors(node.id).length > 0)
        .map((node: NodeData): string => node.id),
    );
  }

  /**
   * Combines compatible parallel relationships and retains represented native and canonical IDs.
   * @param createId - Host-provided factory for a unique canonical element identity.
   */
  public compressRelationships(createId: () => string): void {
    const groups: Record<string, EdgeData[]> = DataRecord.empty<EdgeData[]>();
    for (const edge of this._data.edges) {
      if (edge.compressed.length > 0) {
        continue;
      }
      const key: string = JSON.stringify([
        edge.sourceId,
        edge.startNodeId,
        edge.endNodeId,
        edge.type,
      ]);
      (groups[key] ??= []).push(edge);
    }
    for (const group of Object.values(groups)) {
      if (group.length < 2) {
        continue;
      }
      const first: EdgeData = group[0];
      this._data.edges = this._data.edges.filter(
        (edge: EdgeData): boolean => !group.includes(edge),
      );
      this._data.edges.push({
        ...structuredClone(first),
        id: createId(),
        nativeId: '',
        properties: {},
        namesInQuery: new SSet(
          group.flatMap((edge: EdgeData): string[] => edge.namesInQuery),
        ).toArray(),
        compressed: group.map((edge: EdgeData): string => edge.nativeId),
        compressedIds: group.map((edge: EdgeData): string => edge.id),
        creationReason: 'compress',
      });
    }
  }

  /**
   * Clusters nodes with the selected label and matching neighbors while remapping relationship endpoints.
   * @param label - Node label to select or configure.
   * @param createId - Host-provided factory for a unique canonical element identity.
   */
  public compressNodes(label: string, createId: () => string): void {
    const groups: Record<string, NodeData[]> = DataRecord.empty<NodeData[]>();
    for (const node of this._data.nodes) {
      if (!node.labels.includes(label) || node.compressed.length > 0) {
        continue;
      }
      const neighbors: string[] = this.neighbors(node.id);
      if (neighbors.length === 0) {
        continue;
      }
      const key: string = JSON.stringify([node.sourceId, neighbors]);
      (groups[key] ??= []).push(node);
    }
    for (const group of Object.values(groups)) {
      if (group.length < 2) {
        continue;
      }
      const ids: string[] = group.map((node: NodeData): string => node.id);
      const cluster: NodeData = {
        ...structuredClone(group[0]),
        id: createId(),
        nativeId: '',
        properties: {},
        labels: new SSet(
          group.flatMap((node: NodeData): string[] => node.labels),
        ).toArray(),
        namesInQuery: new SSet(
          group.flatMap((node: NodeData): string[] => node.namesInQuery),
        ).toArray(),
        compressed: group.map((node: NodeData): string => node.nativeId),
        compressedIds: group.map((node: NodeData): string => node.id),
        position: {
          x:
            group.reduce(
              (sum: number, node: NodeData): number => sum + node.position.x,
              0,
            ) / group.length,
          y:
            group.reduce(
              (sum: number, node: NodeData): number => sum + node.position.y,
              0,
            ) / group.length,
        },
        noteIds: new SSet(
          group.flatMap((node: NodeData): string[] => node.noteIds),
        ).toArray(),
        creationReason: 'compress',
        scenarioGroups: [],
        url: null,
        coverImageUrl: null,
      };
      this._data.nodes = this._data.nodes.filter(
        (node: NodeData): boolean => !ids.includes(node.id),
      );
      this._data.nodes.push(cluster);
      for (const edge of this._data.edges) {
        if (ids.includes(edge.startNodeId)) {
          edge.startNodeId = cluster.id;
        }
        if (ids.includes(edge.endNodeId)) {
          edge.endNodeId = cluster.id;
        }
      }
    }
  }

  /**
   * Creates cross-source relationships for matching configured property values without duplicating existing merges.
   * @param rules - Cross-source property-linking rules.
   * @param createId - Host-provided factory for a unique canonical element identity.
   */
  public merge(rules: readonly MergeData[], createId: () => string): void {
    for (const rule of rules) {
      for (const left of this._data.nodes) {
        if (
          left.sourceId !== rule.leftSourceId ||
          !left.labels.includes(rule.leftLabel)
        ) {
          continue;
        }
        const value: unknown = left.properties[rule.leftProperty];
        if (value == null) {
          continue;
        }
        for (const right of this._data.nodes) {
          if (
            right.id === left.id ||
            right.sourceId !== rule.rightSourceId ||
            !right.labels.includes(rule.rightLabel) ||
            value !== right.properties[rule.rightProperty] ||
            this._data.edges.some(
              (edge: EdgeData): boolean =>
                edge.startNodeId === left.id && edge.endNodeId === right.id,
            )
          ) {
            continue;
          }
          this._data.edges.push({
            id: createId(),
            nativeId: '',
            sourceId: left.sourceId,
            sourceTitle: left.sourceTitle,
            properties: {},
            namesInQuery: [],
            compressed: [],
            compressedIds: [],
            startNodeId: left.id,
            endNodeId: right.id,
            startNativeNodeId: left.nativeId,
            endNativeNodeId: right.nativeId,
            type: 'CONNECTED_TO',
            creationReason: 'merge',
          });
        }
      }
    }
  }

  /**
   * Converts the referenced graph to detached physics data, locking grabbed nodes for the worker.
   * @param settings - Visualization configuration to reference.
   * @param grabbedIds - Node identities temporarily held by user sessions.
   * @returns A detached physical graph with visualization sizes and temporary grab locks.
   */
  public toPhysicalGraph(
    settings: CanvasViewSettings,
    grabbedIds: readonly string[] = [],
  ): PhysicalGraph {
    const result: PhysicalGraph = {
      nodes: DataRecord.empty<PhysicalGraph['nodes'][string]>(),
      edges: DataRecord.empty<PhysicalGraph['edges'][string]>(),
    };
    const degrees: number[] = this._data.nodes.map((node: NodeData): number =>
      this.degree(node.id),
    );
    for (const node of this._data.nodes) {
      result.nodes[node.id] = {
        id: node.id,
        positionX: node.position.x,
        positionY: node.position.y,
        velocityX: 0,
        velocityY: 0,
        locked: node.locked || grabbedIds.includes(node.id),
        radius: settings.radius(
          node,
          this.degree(node.id),
          Math.min(...degrees),
          Math.max(...degrees),
        ),
      };
    }
    for (const edge of this._data.edges) {
      result.edges[edge.id] = {
        id: edge.id,
        startNodeId: edge.startNodeId,
        endNodeId: edge.endNodeId,
        edgeType: edge.type,
        title: edge.type,
      };
    }
    return result;
  }
}
