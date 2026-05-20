import ElkConstructor from 'elkjs/lib/main';
import {
  ELK as ElkLayoutEngine,
  ElkExtendedEdge,
  ElkNode,
} from 'elkjs/lib/elk-api';
import { LayoutOptions } from 'elkjs';
import { PhysicalEdge } from '../physical-graph/PhysicalEdge';
import { PhysicalGraph } from '../physical-graph/PhysicalGraph';
import { PhysicalNode } from '../physical-graph/PhysicalNode';

type NodeMap = Record<string, PhysicalNode>;

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
    const laidOutGraph: LaidOutElkHierarchyGraph = await this._elk.layout(
      this._createGraph(nodeIds, nodes, edges),
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
            !edge.isLoop &&
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
      'org.eclipse.elk.layered.spacing.nodeNodeBetweenLayers': '450',
      'org.eclipse.elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
      'org.eclipse.elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
      'org.eclipse.elk.layered.nodePlacement.favorStraightEdges': 'true',
      'org.eclipse.elk.separateConnectedComponents': 'true',
    };
  }

  private _applyLayout(nodes: NodeMap, graph: LaidOutElkHierarchyGraph): void {
    for (const child of graph.children ?? []) {
      const node: PhysicalNode = nodes[child.id];

      node.position.x = (child.x ?? 0) + (child.width ?? 0) / 2;
      node.position.y = (child.y ?? 0) + (child.height ?? 0) / 2;
    }
  }

  private _centerBoundingBox(nodeIds: string[], nodes: NodeMap): void {
    let minX: number = Infinity;
    let maxX: number = -Infinity;
    let minY: number = Infinity;
    let maxY: number = -Infinity;

    for (const nodeId of nodeIds) {
      const node: PhysicalNode = nodes[nodeId];

      minX = Math.min(minX, node.position.x - node.radius);
      maxX = Math.max(maxX, node.position.x + node.radius);
      minY = Math.min(minY, node.position.y - node.radius);
      maxY = Math.max(maxY, node.position.y + node.radius);
    }

    const offsetX: number = (minX + maxX) / 2;
    const offsetY: number = (minY + maxY) / 2;

    for (const nodeId of nodeIds) {
      const node: PhysicalNode = nodes[nodeId];

      node.position.x = this._snapCoordinate(node.position.x - offsetX);
      node.position.y = this._snapCoordinate(node.position.y - offsetY);
    }
  }

  private _snapCoordinate(value: number): number {
    return Math.round(value);
  }
}
