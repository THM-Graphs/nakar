import ElkConstructor from 'elkjs/lib/main';
import type {
  ELK as ElkLayoutEngine,
  ElkExtendedEdge,
  ElkNode,
} from 'elkjs/lib/elk-api';
import type { LayoutOptions } from 'elkjs';
import { SMap } from '../../map/Map';
import { SSet } from '../../set/Set';
import type { PhysicalEdge } from '../physical-graph/PhysicalEdge';
import type { PhysicalGraph } from '../physical-graph/PhysicalGraph';
import type { PhysicalNode } from '../physical-graph/PhysicalNode';

type NodeMap = Record<string, PhysicalNode>;

interface OrderedHierarchyGraph {
  readonly nodeIds: string[];
  readonly edges: PhysicalEdge[];
}

interface ElkHierarchyGraph extends ElkNode {
  children: ElkNode[];
  edges: ElkExtendedEdge[];
}

type LaidOutElkHierarchyGraph = Omit<ElkHierarchyGraph, 'children'> & {
  children?: ElkNode[];
};

export class HierarchyGraphLayoutEngine {
  private readonly _elk: ElkLayoutEngine;

  public constructor() {
    this._elk = new ElkConstructor();
  }

  public async layout(
    physicalGraph: PhysicalGraph,
    targetEdgeType: string,
  ): Promise<void> {
    const nodes: NodeMap = this._collectNodes(physicalGraph);
    const nodeIds: string[] = Object.keys(nodes);

    if (nodeIds.length === 0) {
      return;
    }

    const edges: PhysicalEdge[] = this._collectEdges(
      physicalGraph,
      targetEdgeType,
    );
    const orderedGraph: OrderedHierarchyGraph = this._orderHierarchyGraph(
      nodeIds,
      nodes,
      edges,
    );
    const laidOutGraph: LaidOutElkHierarchyGraph = await this._elk.layout(
      this._createGraph(orderedGraph.nodeIds, nodes, orderedGraph.edges),
    );

    this._applyLayout(nodes, laidOutGraph);
    this._centerBoundingBox(nodeIds, nodes);
  }

  private _collectNodes(physicalGraph: PhysicalGraph): NodeMap {
    const nodes: NodeMap = {};

    for (const [nodeId, node] of Object.entries(physicalGraph.nodes)) {
      if (node == null) {
        continue;
      }

      nodes[nodeId] = node;
    }

    return nodes;
  }

  private _collectEdges(
    physicalGraph: PhysicalGraph,
    targetEdgeType: string,
  ): PhysicalEdge[] {
    return Object.values(physicalGraph.edges).filter(
      (edge: PhysicalEdge | null): edge is PhysicalEdge =>
        edge?.edgeType === targetEdgeType,
    );
  }

  private _createGraph(
    nodeIds: string[],
    nodes: NodeMap,
    edges: PhysicalEdge[],
  ): ElkHierarchyGraph {
    const layoutDiameter: number = this._getMaximumNodeDiameter(nodeIds, nodes);

    return {
      id: 'root',
      layoutOptions: this._createElkLayoutOptions(),
      children: nodeIds.map(
        (nodeId: string): ElkNode => ({
          id: nodeId,
          width: layoutDiameter,
          height: layoutDiameter,
        }),
      ),
      edges: edges
        .filter(
          (edge: PhysicalEdge): boolean =>
            edge.startNodeId in nodes &&
            edge.endNodeId in nodes &&
            edge.startNodeId !== edge.endNodeId,
        )
        .map(
          (edge: PhysicalEdge): ElkExtendedEdge => ({
            id: edge.id,
            sources: [edge.startNodeId],
            targets: [edge.endNodeId],
          }),
        ),
    };
  }

  private _orderHierarchyGraph(
    nodeIds: string[],
    nodes: NodeMap,
    edges: PhysicalEdge[],
  ): OrderedHierarchyGraph {
    const relevantEdges: PhysicalEdge[] = edges.filter(
      (edge: PhysicalEdge): boolean =>
        edge.startNodeId in nodes &&
        edge.endNodeId in nodes &&
        edge.startNodeId !== edge.endNodeId,
    );
    const orderedNodeIds: string[] = this._orderNodeIds(
      nodeIds,
      nodes,
      relevantEdges,
    );
    const nodeOrder: SMap<string, number> = new SMap<string, number>(
      orderedNodeIds.map((nodeId: string, index: number): [string, number] => [
        nodeId,
        index,
      ]),
    );

    return {
      nodeIds: orderedNodeIds,
      edges: [...relevantEdges].sort(
        (left: PhysicalEdge, right: PhysicalEdge): number =>
          (nodeOrder.get(left.startNodeId) ?? Number.MAX_SAFE_INTEGER) -
            (nodeOrder.get(right.startNodeId) ?? Number.MAX_SAFE_INTEGER) ||
          (nodeOrder.get(left.endNodeId) ?? Number.MAX_SAFE_INTEGER) -
            (nodeOrder.get(right.endNodeId) ?? Number.MAX_SAFE_INTEGER) ||
          left.id.localeCompare(right.id),
      ),
    };
  }

  private _orderNodeIds(
    nodeIds: string[],
    nodes: NodeMap,
    edges: PhysicalEdge[],
  ): string[] {
    const childrenByParent: SMap<string, SSet<string>> = new SMap<
      string,
      SSet<string>
    >();
    const incomingEdgeCountByNode: SMap<string, number> = new SMap<
      string,
      number
    >(nodeIds.map((nodeId: string): [string, number] => [nodeId, 0]));
    const nodeComparator: (left: string, right: string) => number = (
      left: string,
      right: string,
    ): number => this._compareNodes(left, right, nodes);

    for (const edge of edges) {
      const parentChildren: SSet<string> =
        childrenByParent.get(edge.startNodeId) ?? new SSet<string>();

      parentChildren.add(edge.endNodeId);
      childrenByParent.set(edge.startNodeId, parentChildren);
      incomingEdgeCountByNode.set(
        edge.endNodeId,
        (incomingEdgeCountByNode.get(edge.endNodeId) ?? 0) + 1,
      );
    }

    const orderedRoots: string[] = [...nodeIds]
      .filter(
        (nodeId: string): boolean =>
          (incomingEdgeCountByNode.get(nodeId) ?? 0) === 0,
      )
      .sort(nodeComparator);
    const orderedNodeIds: string[] = [];
    const visitedNodeIds: SSet<string> = new SSet<string>();

    const visitNode = (nodeId: string): void => {
      if (visitedNodeIds.has(nodeId)) {
        return;
      }

      visitedNodeIds.add(nodeId);
      orderedNodeIds.push(nodeId);

      const children: string[] = [...(childrenByParent.get(nodeId) ?? [])].sort(
        nodeComparator,
      );

      for (const childNodeId of children) {
        visitNode(childNodeId);
      }
    };

    for (const rootNodeId of orderedRoots) {
      visitNode(rootNodeId);
    }

    for (const nodeId of [...nodeIds].sort(nodeComparator)) {
      visitNode(nodeId);
    }

    return orderedNodeIds;
  }

  private _compareNodes(left: string, right: string, nodes: NodeMap): number {
    const leftNode: PhysicalNode = nodes[left];
    const rightNode: PhysicalNode = nodes[right];

    return (
      leftNode.positionX - rightNode.positionX ||
      leftNode.positionY - rightNode.positionY ||
      left.localeCompare(right)
    );
  }

  private _getMaximumNodeDiameter(nodeIds: string[], nodes: NodeMap): number {
    return nodeIds.reduce(
      (maximumDiameter: number, nodeId: string): number =>
        Math.max(maximumDiameter, nodes[nodeId].radius * 2),
      0,
    );
  }

  private _createElkLayoutOptions(): LayoutOptions {
    return {
      'org.eclipse.elk.algorithm': 'layered',
      'org.eclipse.elk.direction': 'DOWN',
      'org.eclipse.elk.spacing.nodeNode': '50',
      'org.eclipse.elk.spacing.componentComponent': '250',
      'org.eclipse.elk.layered.spacing.nodeNodeBetweenLayers': '200',
      'org.eclipse.elk.layered.crossingMinimization.strategy': 'NONE',
      'org.eclipse.elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
      'org.eclipse.elk.layered.crossingMinimization.forceNodeModelOrder':
        'true',
      'org.eclipse.elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF',
      'org.eclipse.elk.layered.nodePlacement.favorStraightEdges': 'false',
      'org.eclipse.elk.layered.nodePlacement.bk.fixedAlignment': 'BALANCED',
      'org.eclipse.elk.layered.nodePlacement.bk.edgeStraightening': 'NONE',
      'org.eclipse.elk.separateConnectedComponents': 'true',
      'org.eclipse.elk.layered.compaction.connectedComponents': 'true',
      'org.eclipse.elk.thoroughness': '100',
    };
  }

  private _applyLayout(nodes: NodeMap, graph: LaidOutElkHierarchyGraph): void {
    for (const child of graph.children ?? []) {
      const node: PhysicalNode = nodes[child.id];

      node.positionX = (child.x ?? 0) + (child.width ?? 0) / 2;
      node.positionY = (child.y ?? 0) + (child.height ?? 0) / 2;
    }
  }

  private _centerBoundingBox(nodeIds: string[], nodes: NodeMap): void {
    let minX: number = Infinity;
    let maxX: number = -Infinity;
    let minY: number = Infinity;
    let maxY: number = -Infinity;

    for (const nodeId of nodeIds) {
      const node: PhysicalNode = nodes[nodeId];

      minX = Math.min(minX, node.positionX - node.radius);
      maxX = Math.max(maxX, node.positionX + node.radius);
      minY = Math.min(minY, node.positionY - node.radius);
      maxY = Math.max(maxY, node.positionY + node.radius);
    }

    const offsetX: number = (minX + maxX) / 2;
    const offsetY: number = (minY + maxY) / 2;

    for (const nodeId of nodeIds) {
      const node: PhysicalNode = nodes[nodeId];

      node.positionX = this._snapCoordinate(node.positionX - offsetX);
      node.positionY = this._snapCoordinate(node.positionY - offsetY);
    }
  }

  private _snapCoordinate(value: number): number {
    return Math.round(value);
  }
}
