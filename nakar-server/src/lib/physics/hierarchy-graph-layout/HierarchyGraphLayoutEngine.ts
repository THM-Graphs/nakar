import { PhysicalEdge } from '../physical-graph/PhysicalEdge';
import { PhysicalGraph } from '../physical-graph/PhysicalGraph';
import { PhysicalNode } from '../physical-graph/PhysicalNode';
import { SMap } from '../../map/Map';
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

interface ComponentPlacement {
  component: ComponentLayoutResult;
  column: number;
  row: number;
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

    const finalNodes: NodeMap = {};
    this._placeComponentsInGrid(componentLayouts, finalNodes);

    for (const [nodeId, finalNode] of Object.entries(finalNodes)) {
      nodes[nodeId].position.x = finalNode.position.x;
      nodes[nodeId].position.y = finalNode.position.y;
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

  private _placeComponentsInGrid(
    componentLayouts: ComponentLayoutResult[],
    finalNodes: NodeMap,
  ): void {
    if (componentLayouts.length === 0) {
      return;
    }

    const sortedComponents: ComponentLayoutResult[] = [
      ...componentLayouts,
    ].sort(
      (left: ComponentLayoutResult, right: ComponentLayoutResult): number =>
        right.bounds.width * right.bounds.height -
        left.bounds.width * left.bounds.height,
    );
    const placements: ComponentPlacement[] =
      this._createGridPlacements(sortedComponents);
    const columnWidths: SMap<number, number> =
      this._calculateColumnWidths(placements);
    const rowHeights: SMap<number, number> =
      this._calculateRowHeights(placements);
    const columnCenters: SMap<number, number> =
      this._calculateAxisCenters(columnWidths);
    const rowCenters: SMap<number, number> =
      this._calculateAxisCenters(rowHeights);

    for (const placement of placements) {
      const centerX: number = columnCenters.get(placement.column) ?? 0;
      const centerY: number = rowCenters.get(placement.row) ?? 0;
      this._placeComponent(placement.component, centerX, centerY, finalNodes);
    }
  }

  private _placeComponent(
    componentLayout: ComponentLayoutResult,
    centerX: number,
    centerY: number,
    finalNodes: NodeMap,
  ): void {
    const componentOffsetX: number = centerX - componentLayout.bounds.centerX;
    const componentOffsetY: number = centerY - componentLayout.bounds.centerY;

    for (const nodeId of componentLayout.nodeIds) {
      finalNodes[nodeId] = {
        ...componentLayout.nodes[nodeId],
        position: {
          x: componentLayout.nodes[nodeId].position.x + componentOffsetX,
          y: componentLayout.nodes[nodeId].position.y + componentOffsetY,
        },
      };
    }
  }

  private _createGridPlacements(
    sortedComponents: ComponentLayoutResult[],
  ): ComponentPlacement[] {
    const placements: ComponentPlacement[] = [];

    sortedComponents.forEach(
      (component: ComponentLayoutResult, index: number): void => {
        if (index === 0) {
          placements.push({ component, column: 0, row: 0 });
          return;
        }

        const slot: { column: number; row: number } = this._getSpiralSlot(
          index - 1,
        );
        placements.push({
          component,
          column: slot.column,
          row: slot.row,
        });
      },
    );

    return placements;
  }

  private _getSpiralSlot(index: number): { column: number; row: number } {
    let column: number = 0;
    let row: number = 0;
    let directionIndex: number = 0;
    let currentLegLength: number = 1;
    let stepsTakenInLeg: number = 0;
    let legsAtCurrentLength: number = 0;
    const directions: { column: number; row: number }[] = [
      { column: 1, row: 0 },
      { column: 0, row: -1 },
      { column: -1, row: 0 },
      { column: 0, row: 1 },
    ];

    for (let step: number = 0; step <= index; step++) {
      column += directions[directionIndex].column;
      row += directions[directionIndex].row;
      stepsTakenInLeg++;

      if (stepsTakenInLeg === currentLegLength) {
        stepsTakenInLeg = 0;
        directionIndex = (directionIndex + 1) % directions.length;
        legsAtCurrentLength++;

        if (legsAtCurrentLength === 2) {
          legsAtCurrentLength = 0;
          currentLegLength++;
        }
      }
    }

    return { column, row };
  }

  private _calculateColumnWidths(
    placements: ComponentPlacement[],
  ): SMap<number, number> {
    const widths: SMap<number, number> = new SMap<number, number>();

    for (const placement of placements) {
      widths.set(
        placement.column,
        Math.max(
          widths.get(placement.column) ?? 0,
          placement.component.bounds.width,
        ),
      );
    }

    return widths;
  }

  private _calculateRowHeights(
    placements: ComponentPlacement[],
  ): SMap<number, number> {
    const heights: SMap<number, number> = new SMap<number, number>();

    for (const placement of placements) {
      heights.set(
        placement.row,
        Math.max(
          heights.get(placement.row) ?? 0,
          placement.component.bounds.height,
        ),
      );
    }

    return heights;
  }

  private _calculateAxisCenters(
    sizes: SMap<number, number>,
  ): SMap<number, number> {
    const centers: SMap<number, number> = new SMap<number, number>();
    const sortedIndices: number[] = [...sizes.keys()].sort(
      (left: number, right: number): number => left - right,
    );

    centers.set(0, 0);

    const maxPositiveIndex: number = Math.max(
      0,
      ...sortedIndices.filter((index: number): boolean => index > 0),
    );
    const minNegativeIndex: number = Math.min(
      0,
      ...sortedIndices.filter((index: number): boolean => index < 0),
    );

    for (let index: number = 1; index <= maxPositiveIndex; index++) {
      centers.set(
        index,
        (centers.get(index - 1) ?? 0) +
          (sizes.get(index - 1) ?? 0) / 2 +
          this._config.componentSpacing +
          (sizes.get(index) ?? 0) / 2,
      );
    }

    for (let index: number = -1; index >= minNegativeIndex; index--) {
      centers.set(
        index,
        (centers.get(index + 1) ?? 0) -
          (sizes.get(index + 1) ?? 0) / 2 -
          this._config.componentSpacing -
          (sizes.get(index) ?? 0) / 2,
      );
    }

    return centers;
  }
}
