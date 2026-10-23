import { DataRecord } from '../data/DataRecord';
import { SMap } from '../../map/Map';
import { SSet } from '../../set/Set';
import type { PhysicalGraph } from '../../physics/physical-graph/PhysicalGraph';
import type { PhysicalNode } from '../../physics/physical-graph/PhysicalNode';

/**
 * Computes deterministic hierarchy layers, collapsing cycles into components before placing nodes.
 */
export class CanvasHierarchyLayout {
  /**
   * References the physical graph whose positions are updated by layout.
   * @param _graph - Graph whose data is read or modified.
   */
  public constructor(private readonly _graph: PhysicalGraph) {}

  /**
   * Computes and assigns deterministic node positions for the selected relationship hierarchy.
   * @param edgeType - Relationship type to use for hierarchy or visualization.
   */
  public layout(edgeType: string): void {
    const nodes: PhysicalNode[] = Object.values(this._graph.nodes)
      .filter(
        (node: PhysicalNode | null): node is PhysicalNode => node !== null,
      )
      .sort((left: PhysicalNode, right: PhysicalNode): number =>
        left.id.localeCompare(right.id),
      );
    if (nodes.length === 0) {
      return;
    }
    const outgoing: Record<string, SSet<string>> = DataRecord.empty<
      SSet<string>
    >();
    const incoming: Record<string, SSet<string>> = DataRecord.empty<
      SSet<string>
    >();
    for (const node of nodes) {
      outgoing[node.id] = new SSet();
      incoming[node.id] = new SSet();
    }
    for (const edge of Object.values(this._graph.edges)) {
      if (
        edge?.edgeType !== edgeType ||
        !Object.hasOwn(outgoing, edge.startNodeId) ||
        !Object.hasOwn(incoming, edge.endNodeId)
      ) {
        continue;
      }
      outgoing[edge.startNodeId].add(edge.endNodeId);
      incoming[edge.endNodeId].add(edge.startNodeId);
    }
    // Iterative Kosaraju traversal avoids call-stack limits for large graphs.
    const visited: SSet<string> = new SSet<string>();
    const order: string[] = [];
    for (const node of nodes) {
      const stack: {
        /**
         * Canonical identity of this domain object.
         */
        id: string;

        /**
         * Whether this traversal frame has already expanded its outgoing neighbors.
         */
        expanded: boolean;
      }[] = [{ id: node.id, expanded: false }];
      while (stack.length > 0) {
        const next: {
          /**
           * Canonical identity of this domain object.
           */
          id: string;

          /**
           * Whether this traversal frame has already expanded its outgoing neighbors.
           */
          expanded: boolean;
        } = stack[stack.length - 1];
        stack.pop();
        if (next.expanded) {
          order.push(next.id);
          continue;
        }
        if (visited.has(next.id)) {
          continue;
        }
        visited.add(next.id);
        stack.push({ ...next, expanded: true });
        for (const id of outgoing[next.id]) {
          if (!visited.has(id)) {
            stack.push({ id, expanded: false });
          }
        }
      }
    }
    const components: string[][] = [];
    const componentOf: Record<string, number> = DataRecord.empty<number>();
    for (const id of order.reverse()) {
      if (Object.hasOwn(componentOf, id)) {
        continue;
      }
      const component: string[] = [];
      const stack: string[] = [id];
      const index: number = components.length;
      while (stack.length > 0) {
        const next: string = stack[stack.length - 1];
        stack.pop();
        if (Object.hasOwn(componentOf, next)) {
          continue;
        }
        componentOf[next] = index;
        component.push(next);
        for (const neighbor of incoming[next]) {
          stack.push(neighbor);
        }
      }
      components.push(component);
    }
    const links: SSet<number>[] = components.map(
      (): SSet<number> => new SSet(),
    );
    const degrees: number[] = components.map((): number => 0);
    const ranks: number[] = components.map((): number => 0);
    for (const [from, targets] of Object.entries(outgoing)) {
      for (const to of targets) {
        const a: number = componentOf[from];
        const b: number = componentOf[to];
        if (a !== b && !links[a].has(b)) {
          links[a].add(b);
          degrees[b] += 1;
        }
      }
    }
    const queue: number[] = degrees.flatMap(
      (degree: number, index: number): number[] =>
        degree === 0 ? [index] : [],
    );
    for (const index of queue) {
      for (const target of links[index]) {
        ranks[target] = Math.max(ranks[target], ranks[index] + 1);
        degrees[target] -= 1;
        if (degrees[target] === 0) {
          queue.push(target);
        }
      }
    }
    const columns: SMap<number, PhysicalNode[]> = new SMap<
      number,
      PhysicalNode[]
    >();
    for (const node of nodes) {
      const rank: number = ranks[componentOf[node.id]];
      columns.set(rank, [...(columns.get(rank) ?? []), node]);
    }
    let x: number = 0;
    for (const [, column] of columns
      .toArray()
      .sort(
        (
          left: [number, PhysicalNode[]],
          right: [number, PhysicalNode[]],
        ): number => left[0] - right[0],
      )) {
      const radius: number = Math.max(
        ...column.map((node: PhysicalNode): number => node.radius),
      );
      const height: number = column.reduce(
        (sum: number, node: PhysicalNode): number =>
          sum + node.radius * 2 + 100,
        -100,
      );
      let y: number = -height / 2;
      for (const node of column) {
        y += node.radius;
        node.positionX = x + radius;
        node.positionY = y;
        y += node.radius + 100;
      }
      x += radius * 2 + 120;
    }
    const centerX: number =
      (Math.min(
        ...nodes.map(
          (node: PhysicalNode): number => node.positionX - node.radius,
        ),
      ) +
        Math.max(
          ...nodes.map(
            (node: PhysicalNode): number => node.positionX + node.radius,
          ),
        )) /
      2;
    const centerY: number =
      (Math.min(
        ...nodes.map(
          (node: PhysicalNode): number => node.positionY - node.radius,
        ),
      ) +
        Math.max(
          ...nodes.map(
            (node: PhysicalNode): number => node.positionY + node.radius,
          ),
        )) /
      2;
    for (const node of nodes) {
      node.positionX -= centerX;
      node.positionY -= centerY;
    }
  }
}
