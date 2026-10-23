import { HierarchyGraphLayoutEngine } from '../../physics/hierarchy-graph-layout/HierarchyGraphLayoutEngine';
import type { PhysicalGraph } from '../../physics/physical-graph/PhysicalGraph';
import type { PhysicalNode } from '../../physics/physical-graph/PhysicalNode';
import { SMap } from '../../map/Map';
import { DataRecord } from '../data/DataRecord';

/** Applies the established vertical ELK hierarchy layout to referenced physical graph data. */
export class CanvasHierarchyLayout {
  /**
   * References the graph whose positions will be updated.
   * @param _graph - Physical graph used for hierarchy placement.
   */
  public constructor(private readonly _graph: PhysicalGraph) {}

  /**
   * Places nodes using the existing hierarchy algorithm, spacing and model ordering.
   * Internal aliases support arbitrary public IDs without object prototype collisions.
   * @param edgeType - Relationship type defining the hierarchy.
   * @returns A promise resolving after the layout positions have been applied.
   */
  public async layout(edgeType: string): Promise<void> {
    const graph: PhysicalGraph = {
      nodes: DataRecord.empty(),
      edges: DataRecord.empty(),
    };
    const ids: SMap<string, string> = new SMap<string, string>();
    const nodes: PhysicalNode[] = Object.values(this._graph.nodes)
      .filter(
        (node: PhysicalNode | null): node is PhysicalNode => node !== null,
      )
      .sort((a: PhysicalNode, b: PhysicalNode): number =>
        a.id.localeCompare(b.id),
      );
    for (let index: number = 0; index < nodes.length; index++) {
      const id: string = 'node-' + String(index).padStart(12, '0');
      ids.set(nodes[index].id, id);
      graph.nodes[id] = { ...nodes[index], id };
    }
    for (const edge of Object.values(this._graph.edges)) {
      if (edge !== null) {
        const start: string | undefined = ids.get(edge.startNodeId);
        const end: string | undefined = ids.get(edge.endNodeId);
        if (start !== undefined && end !== undefined) {
          graph.edges[edge.id] = {
            ...edge,
            startNodeId: start,
            endNodeId: end,
          };
        }
      }
    }
    await new HierarchyGraphLayoutEngine().layout(graph, edgeType);
    for (const node of nodes) {
      const placed: PhysicalNode | null | undefined =
        graph.nodes[ids.get(node.id) ?? ''];
      if (placed != null) {
        node.positionX = placed.positionX;
        node.positionY = placed.positionY;
      }
    }
  }
}
