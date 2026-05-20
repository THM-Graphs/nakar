import { PhysicalNode } from '../physical-graph/PhysicalNode';
import { SSet } from '../../set/Set';
import { BoundingBox } from './BoundingBox';
import { HierarchyAdjacencyGraph } from './HierarchyAdjacencyGraph';
import { HierarchyDummyNode } from './HierarchyDummyNode';
import { HierarchyLayoutConfig } from './HierarchyLayoutConfig';

type NodeMap = Record<string, PhysicalNode>;

interface IsotonicBlock {
  startIndex: number;
  endIndex: number;
  sum: number;
  count: number;
  value: number;
}

export class HierarchyNodePlacement {
  public constructor(private readonly _config: HierarchyLayoutConfig) {}

  public positionComponent(
    componentLayers: Partial<Record<number, string[]>>,
    sortedLayerIds: number[],
    layoutNodes: NodeMap,
    graph: HierarchyAdjacencyGraph,
  ): void {
    if (sortedLayerIds.length === 0) {
      return;
    }

    const componentNodeIds: string[] = sortedLayerIds.flatMap(
      (layerId: number): string[] => componentLayers[layerId] ?? [],
    );
    const columnMap: Record<string, number> = {};
    const columnStep: number = this._getColumnStep(
      componentNodeIds,
      layoutNodes,
    );

    for (const layerId of sortedLayerIds) {
      const nodeIds: string[] = componentLayers[layerId] ?? [];
      nodeIds.forEach((nodeId: string): void => {
        layoutNodes[nodeId].position.y = layerId * this._config.layerSpacing;
      });
    }

    this._assignInitialLayerColumns(
      componentLayers[sortedLayerIds[sortedLayerIds.length - 1]] ?? [],
      columnMap,
    );

    for (let i: number = sortedLayerIds.length - 2; i >= 0; i--) {
      this._assignLayerColumns(
        componentLayers[sortedLayerIds[i]] ?? [],
        componentLayers[sortedLayerIds[i + 1]] ?? [],
        graph.adj,
        columnMap,
      );
    }

    for (let i: number = 1; i < sortedLayerIds.length; i++) {
      this._realignLayerColumns(
        componentLayers[sortedLayerIds[i]] ?? [],
        componentLayers[sortedLayerIds[i - 1]] ?? [],
        graph.revAdj,
        columnMap,
      );
    }

    for (const nodeId of componentNodeIds) {
      layoutNodes[nodeId].position.x = columnMap[nodeId] * columnStep;
    }

    const componentBounds: BoundingBox = BoundingBox.fromNodes(
      componentNodeIds,
      layoutNodes,
    );
    this._shiftNodes(componentNodeIds, layoutNodes, -componentBounds.centerX);
  }

  private _assignInitialLayerColumns(
    ids: string[],
    columnMap: Record<string, number>,
  ): void {
    if (ids.length === 0) {
      return;
    }

    const visibleIds: string[] = this._getVisibleNodeIds(ids);

    if (visibleIds.length === 0) {
      ids.forEach((nodeId: string): void => {
        columnMap[nodeId] = 0;
      });
      return;
    }

    let currentColumn: number = -(visibleIds.length - 1) / 2;

    for (const nodeId of visibleIds) {
      columnMap[nodeId] = currentColumn;
      currentColumn += 1;
    }

    let lastVisibleNodeId: string = visibleIds[0];

    for (const nodeId of ids) {
      if (!HierarchyDummyNode.isId(nodeId)) {
        lastVisibleNodeId = nodeId;
        continue;
      }

      columnMap[nodeId] = columnMap[lastVisibleNodeId];
    }
  }

  private _assignLayerColumns(
    ids: string[],
    referenceLayerIds: string[],
    adjacency: Record<string, string[]>,
    columnMap: Record<string, number>,
  ): void {
    if (ids.length === 0) {
      return;
    }

    const targetColumns: number[] = [];
    const referenceLayerSet: SSet<string> = new SSet<string>(referenceLayerIds);
    const fallbackColumns: Record<string, number> =
      this._buildFallbackColumns(ids);
    const rawTargetColumns: Record<string, number> = {};

    for (const nodeId of ids) {
      const referenceColumn: number | null = this._getReferenceColumn(
        nodeId,
        adjacency,
        referenceLayerSet,
        columnMap,
      );
      rawTargetColumns[nodeId] = referenceColumn ?? fallbackColumns[nodeId];
    }

    const orderedNodeIds: string[] = [...ids].sort(
      (leftNodeId: string, rightNodeId: string): number => {
        const columnDelta: number =
          rawTargetColumns[leftNodeId] - rawTargetColumns[rightNodeId];

        if (Math.abs(columnDelta) > 1e-6) {
          return columnDelta;
        }

        return fallbackColumns[leftNodeId] - fallbackColumns[rightNodeId];
      },
    );
    const offsets: number[] = orderedNodeIds.map(
      (nodeId: string, index: number): number => {
        void nodeId;
        return index;
      },
    );

    for (const nodeId of orderedNodeIds) {
      targetColumns.push(rawTargetColumns[nodeId]);
    }

    const transformedTargets: number[] = targetColumns.map(
      (targetColumn: number, index: number): number =>
        targetColumn - offsets[index],
    );
    const fittedColumns: number[] =
      this._fitNonDecreasingSequence(transformedTargets);

    orderedNodeIds.forEach((nodeId: string, index: number): void => {
      columnMap[nodeId] = fittedColumns[index] + offsets[index];
    });

    this._shiftLayerColumnsToTargets(orderedNodeIds, targetColumns, columnMap);
    this._centerSiblingGroups(
      orderedNodeIds,
      referenceLayerIds,
      adjacency,
      columnMap,
    );
  }

  private _realignLayerColumns(
    ids: string[],
    referenceLayerIds: string[],
    adjacency: Record<string, string[]>,
    columnMap: Record<string, number>,
  ): void {
    if (ids.length === 0 || referenceLayerIds.length === 0) {
      return;
    }

    const referenceLayerSet: SSet<string> = new SSet<string>(referenceLayerIds);
    const currentColumns: Record<string, number> = {};

    ids.forEach((nodeId: string): void => {
      currentColumns[nodeId] = columnMap[nodeId] ?? 0;
    });

    const orderedNodeIds: string[] = [...ids].sort(
      (leftNodeId: string, rightNodeId: string): number => {
        const leftTarget: number =
          this._getReferenceColumn(
            leftNodeId,
            adjacency,
            referenceLayerSet,
            columnMap,
          ) ?? currentColumns[leftNodeId];
        const rightTarget: number =
          this._getReferenceColumn(
            rightNodeId,
            adjacency,
            referenceLayerSet,
            columnMap,
          ) ?? currentColumns[rightNodeId];
        const targetDelta: number = leftTarget - rightTarget;

        if (Math.abs(targetDelta) > 1e-6) {
          return targetDelta;
        }

        return currentColumns[leftNodeId] - currentColumns[rightNodeId];
      },
    );
    const targetColumns: number[] = orderedNodeIds.map(
      (nodeId: string): number =>
        this._getReferenceColumn(
          nodeId,
          adjacency,
          referenceLayerSet,
          columnMap,
        ) ?? currentColumns[nodeId],
    );
    const offsets: number[] = orderedNodeIds.map(
      (nodeId: string, index: number): number => {
        void nodeId;
        return index;
      },
    );
    const transformedTargets: number[] = targetColumns.map(
      (targetColumn: number, index: number): number =>
        targetColumn - offsets[index],
    );
    const fittedColumns: number[] =
      this._fitNonDecreasingSequence(transformedTargets);

    orderedNodeIds.forEach((nodeId: string, index: number): void => {
      columnMap[nodeId] = fittedColumns[index] + offsets[index];
    });

    this._shiftLayerColumnsToTargets(orderedNodeIds, targetColumns, columnMap);
    this._centerSiblingGroups(
      orderedNodeIds,
      referenceLayerIds,
      adjacency,
      columnMap,
    );
  }

  private _centerSiblingGroups(
    ids: string[],
    referenceLayerIds: string[],
    adjacency: Record<string, string[]>,
    columnMap: Record<string, number>,
  ): void {
    if (ids.length < 2 || referenceLayerIds.length === 0) {
      return;
    }

    const referenceLayerSet: SSet<string> = new SSet<string>(referenceLayerIds);
    const groupMap: Record<string, string[]> = {};
    const targetColumns: Record<string, number> = {};

    ids.forEach((nodeId: string): void => {
      targetColumns[nodeId] = columnMap[nodeId] ?? 0;
      const signatureNodeIds: string[] = (adjacency[nodeId] ?? [])
        .filter((adjacentNodeId: string): boolean =>
          referenceLayerSet.has(adjacentNodeId),
        )
        .sort();

      if (signatureNodeIds.length === 0) {
        return;
      }

      const groupKey: string = signatureNodeIds.join('|');

      if (!(groupKey in groupMap)) {
        groupMap[groupKey] = [];
      }

      groupMap[groupKey].push(nodeId);
    });

    for (const [groupKey, groupNodeIds] of Object.entries(groupMap)) {
      if (groupNodeIds.length < 2) {
        continue;
      }

      const referenceNodeIds: string[] = groupKey.split('|');
      const targetCenter: number =
        referenceNodeIds.reduce(
          (sum: number, referenceNodeId: string): number =>
            sum + (columnMap[referenceNodeId] ?? 0),
          0,
        ) / referenceNodeIds.length;
      const currentCenter: number =
        groupNodeIds.reduce(
          (sum: number, nodeId: string): number =>
            sum + (columnMap[nodeId] ?? 0),
          0,
        ) / groupNodeIds.length;
      const shift: number = targetCenter - currentCenter;

      groupNodeIds.forEach((nodeId: string): void => {
        targetColumns[nodeId] += shift;
      });
    }

    const adjustedTargets: number[] = ids.map(
      (nodeId: string): number => targetColumns[nodeId],
    );
    const offsets: number[] = ids.map(
      (nodeId: string, index: number): number => {
        void nodeId;
        return index;
      },
    );
    const transformedTargets: number[] = adjustedTargets.map(
      (targetColumn: number, index: number): number =>
        targetColumn - offsets[index],
    );
    const fittedColumns: number[] =
      this._fitNonDecreasingSequence(transformedTargets);

    ids.forEach((nodeId: string, index: number): void => {
      columnMap[nodeId] = fittedColumns[index] + offsets[index];
    });
  }

  private _buildFallbackColumns(ids: string[]): Record<string, number> {
    const fallbackColumns: Record<string, number> = {};
    const visibleIds: string[] = this._getVisibleNodeIds(ids);

    if (visibleIds.length === 0) {
      ids.forEach((nodeId: string): void => {
        fallbackColumns[nodeId] = 0;
      });
      return fallbackColumns;
    }

    let currentColumn: number = -(visibleIds.length - 1) / 2;

    for (const nodeId of visibleIds) {
      fallbackColumns[nodeId] = currentColumn;
      currentColumn += 1;
    }

    let lastVisibleNodeId: string = visibleIds[0];

    for (const nodeId of ids) {
      if (!HierarchyDummyNode.isId(nodeId)) {
        lastVisibleNodeId = nodeId;
        continue;
      }

      fallbackColumns[nodeId] = fallbackColumns[lastVisibleNodeId];
    }

    return fallbackColumns;
  }

  private _getReferenceColumn(
    nodeId: string,
    adjacency: Record<string, string[]>,
    referenceLayerSet: SSet<string>,
    columnMap: Record<string, number>,
  ): number | null {
    const adjacentNodeIds: string[] = (adjacency[nodeId] ?? []).filter(
      (adjacentNodeId: string): boolean =>
        referenceLayerSet.has(adjacentNodeId),
    );

    if (adjacentNodeIds.length === 0) {
      return null;
    }

    return (
      adjacentNodeIds.reduce(
        (sum: number, adjacentNodeId: string): number =>
          sum + (columnMap[adjacentNodeId] ?? 0),
        0,
      ) / adjacentNodeIds.length
    );
  }

  private _fitNonDecreasingSequence(values: number[]): number[] {
    const blocks: IsotonicBlock[] = [];

    values.forEach((value: number, index: number): void => {
      blocks.push({
        startIndex: index,
        endIndex: index,
        sum: value,
        count: 1,
        value,
      });

      while (blocks.length > 1) {
        const currentBlock: IsotonicBlock = blocks[blocks.length - 1];
        const previousBlock: IsotonicBlock = blocks[blocks.length - 2];

        if (previousBlock.value <= currentBlock.value) {
          break;
        }

        previousBlock.endIndex = currentBlock.endIndex;
        previousBlock.sum += currentBlock.sum;
        previousBlock.count += currentBlock.count;
        previousBlock.value = previousBlock.sum / previousBlock.count;
        blocks.pop();
      }
    });

    const fittedValues: number[] = new Array<number>(values.length);

    for (const block of blocks) {
      for (
        let index: number = block.startIndex;
        index <= block.endIndex;
        index++
      ) {
        fittedValues[index] = block.value;
      }
    }

    return fittedValues;
  }

  private _shiftLayerColumnsToTargets(
    ids: string[],
    targetColumns: number[],
    columnMap: Record<string, number>,
  ): void {
    if (ids.length === 0 || targetColumns.length === 0) {
      return;
    }

    let totalOffset: number = 0;

    ids.forEach((nodeId: string, index: number): void => {
      totalOffset += targetColumns[index] - columnMap[nodeId];
    });

    const meanOffset: number = totalOffset / ids.length;

    if (Math.abs(meanOffset) <= 1e-6) {
      return;
    }

    ids.forEach((nodeId: string): void => {
      columnMap[nodeId] += meanOffset;
    });
  }

  private _getColumnStep(nodeIds: string[], layoutNodes: NodeMap): number {
    const visibleIds: string[] = this._getVisibleNodeIds(nodeIds);

    if (visibleIds.length === 0) {
      return this._config.nodeSpacing;
    }

    const maximumDiameter: number = visibleIds.reduce(
      (maxDiameter: number, nodeId: string): number =>
        Math.max(maxDiameter, layoutNodes[nodeId].radius * 2),
      0,
    );

    return maximumDiameter + this._config.nodeSpacing;
  }

  private _getVisibleNodeIds(ids: string[]): string[] {
    return ids.filter(
      (nodeId: string): boolean => !HierarchyDummyNode.isId(nodeId),
    );
  }

  private _shiftNodes(
    nodeIds: string[],
    nodes: NodeMap,
    offsetX: number,
    offsetY: number = 0,
  ): void {
    for (const nodeId of nodeIds) {
      nodes[nodeId].position.x += offsetX;
      nodes[nodeId].position.y += offsetY;
    }
  }
}
