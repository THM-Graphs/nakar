import { PhysicalEdge } from '../physical-graph/PhysicalEdge';
import { PhysicalGraph } from '../physical-graph/PhysicalGraph';
import { PhysicalNode } from '../physical-graph/PhysicalNode';
import { SSet } from '../../set/Set';
import { BoundingBox } from './BoundingBox';
import { HierarchyAdjacencyGraph } from './HierarchyAdjacencyGraph';
import { HierarchyComponentLayouter } from './HierarchyComponentLayouter';
import { HierarchyLayoutConfig } from './HierarchyLayoutConfig';

type NodeMap = Record<string, PhysicalNode>;

interface ComponentLayoutResult {
  nodeIds: string[];
  nodes: NodeMap;
  bounds: BoundingBox;
  originalCenterX: number;
}

export class HierarchyGraphLayoutEngine {
  private readonly _componentLayouter: HierarchyComponentLayouter;

  public constructor(
    private readonly _config: HierarchyLayoutConfig = HierarchyLayoutConfig.createDefault(),
  ) {
    this._componentLayouter = new HierarchyComponentLayouter(_config);
  }

  public layout(physicalGraph: PhysicalGraph, targetEdgeType: string): void {
    const nodes: NodeMap = this._collectNodes(physicalGraph);
    const edges: PhysicalEdge[] = this._collectEdges(
      physicalGraph,
      targetEdgeType,
    );
    const graph: HierarchyAdjacencyGraph =
      HierarchyAdjacencyGraph.fromNodesAndEdges(nodes, edges);
    const components: string[][] = graph.getWeaklyConnectedComponents();
    const componentLayouts: ComponentLayoutResult[] = [];

    for (const componentNodeIds of components) {
      const componentNodeIdsSet: SSet<string> = new SSet<string>(
        componentNodeIds,
      );
      const componentNodes: NodeMap = this._cloneNodeMap(
        nodes,
        componentNodeIds,
      );
      const componentEdges: PhysicalEdge[] = edges.filter(
        (edge: PhysicalEdge): boolean =>
          componentNodeIdsSet.has(edge.startNodeId) &&
          componentNodeIdsSet.has(edge.endNodeId),
      );

      this._componentLayouter.layout(componentNodes, componentEdges);
      componentLayouts.push({
        nodeIds: componentNodeIds,
        nodes: componentNodes,
        bounds: BoundingBox.fromNodes(componentNodeIds, componentNodes),
        originalCenterX: this._getOriginalCenterX(componentNodeIds, nodes),
      });
    }

    componentLayouts.sort(
      (left: ComponentLayoutResult, right: ComponentLayoutResult): number =>
        left.originalCenterX - right.originalCenterX,
    );

    const totalWidth: number = componentLayouts.reduce(
      (
        sum: number,
        componentLayout: ComponentLayoutResult,
        index: number,
      ): number =>
        sum +
        componentLayout.bounds.width +
        (index > 0 ? this._config.componentSpacing : 0),
      0,
    );
    const finalNodes: NodeMap = {};
    let nextComponentLeftEdge: number = -totalWidth / 2;

    for (const componentLayout of componentLayouts) {
      const componentOffsetX: number =
        nextComponentLeftEdge - componentLayout.bounds.minX;
      const componentOffsetY: number = -componentLayout.bounds.centerY;

      for (const nodeId of componentLayout.nodeIds) {
        finalNodes[nodeId] = {
          ...componentLayout.nodes[nodeId],
          position: {
            x: componentLayout.nodes[nodeId].position.x + componentOffsetX,
            y: componentLayout.nodes[nodeId].position.y + componentOffsetY,
          },
        };
      }

      nextComponentLeftEdge +=
        componentLayout.bounds.width + this._config.componentSpacing;
    }

    const overallNodeIds: string[] = Object.keys(finalNodes);
    const overallBounds: BoundingBox = BoundingBox.fromNodes(
      overallNodeIds,
      finalNodes,
    );

    for (const nodeId of overallNodeIds) {
      nodes[nodeId].position.x =
        finalNodes[nodeId].position.x - overallBounds.centerX;
      nodes[nodeId].position.y =
        finalNodes[nodeId].position.y - overallBounds.centerY;
    }
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

  private _cloneNodeMap(nodes: NodeMap, nodeIds: string[]): NodeMap {
    const clonedNodes: NodeMap = {};

    for (const nodeId of nodeIds) {
      clonedNodes[nodeId] = {
        ...nodes[nodeId],
        position: {
          x: nodes[nodeId].position.x,
          y: nodes[nodeId].position.y,
        },
      };
    }

    return clonedNodes;
  }

  private _getOriginalCenterX(nodeIds: string[], nodes: NodeMap): number {
    return BoundingBox.fromNodes(nodeIds, nodes).centerX;
  }
}
