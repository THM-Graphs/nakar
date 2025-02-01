import { MutableGraph } from '../graph/MutableGraph';
import { Force } from './Force';
import { PhysicalEdge } from './PhysicalEdge';
import { PhysicalNode } from './PhysicalNode';

export class PhysicsSimlulation {
  private _nodes: PhysicalNode[];
  private _edges: PhysicalEdge[];

  public constructor(graph: MutableGraph) {
    this._nodes = graph.nodes
      .toArray()
      .map(([id, node], index): PhysicalNode => {
        return new PhysicalNode(id, node, index, graph.nodes.size);
      });

    this._edges = graph.edges
      .toArray()
      .reduce((acc: PhysicalEdge[], [, edge]) => {
        const sourceNode = this._nodes.find((n) => n.id === edge.startNodeId);
        const targetNode = this._nodes.find((n) => n.id === edge.endNodeId);

        if (sourceNode && targetNode) {
          acc.push(new PhysicalEdge(edge, sourceNode, targetNode));
        }
        return acc;
      }, []);
  }

  public run(ticks = 300): void {
    for (let i = 0; i < ticks; i += 1) {
      this._tick();
    }

    for (const node of this._nodes) {
      node.original.position.x = node.position.x;
      node.original.position.y = node.position.y;
    }
  }

  private _tick(): void {
    // Example iteration count
    // Calculate repulsive forces
    this._nodes.forEach((nodeA) => {
      this._nodes.forEach((nodeB) => {
        if (nodeA !== nodeB) {
          nodeA.applyForce(
            Force.twoBodyForce(
              nodeA.mass,
              nodeB.mass,
              nodeA.position,
              nodeB.position,
            ),
          );
        }
      });
    });

    // Calculate attractive forces
    this._edges.forEach((edge: PhysicalEdge) => {
      const nodeA: PhysicalNode = edge.source;
      const nodeB: PhysicalNode = edge.target;
      const targetDistance =
        nodeA.original.radius +
        edge.original.type.length * 20 +
        nodeB.original.radius;

      const force = Force.linkForce(
        targetDistance,
        nodeA.position,
        nodeB.position,
      );
      nodeA.applyForce(force);
      nodeB.applyForce(force.inverted);
    });

    //   // Apply centering forces
    this._nodes.forEach((node) => {
      node.applyForce(Force.centerForce(node.position, node.mass));
    });

    // Update positions
    this._nodes.forEach((node) => {
      node.physicsTick();
    });
  }
}
