import { MutableGraph } from '../graph/MutableGraph';
import { wait } from '../tools/Wait';
import { Force } from './Force';
import { PhysicalEdge } from './PhysicalEdge';
import { PhysicalNode } from './PhysicalNode';

export class PhysicsSimulation {
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

  public async run(ticks = 300): Promise<void> {
    for (let i = 0; i < ticks / 10; i += 1) {
      for (let j = 0; j < 10; j += 1) {
        this._tick();
      }
      await wait();
    }

    for (const node of this._nodes) {
      node.original.position.x = node.position.x;
      node.original.position.y = node.position.y;
    }
  }

  private _tick(): void {
    // Example iteration count
    // Calculate repulsive forces
    for (const nodeA of this._nodes) {
      for (const nodeB of this._nodes) {
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
      }
    }

    // Calculate attractive forces
    for (const edge of this._edges) {
      if (edge.original.isLoop) {
        continue;
      }
      const nodeA = edge.source;
      const nodeB = edge.target;
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
    }

    // Apply centering forces
    for (const node of this._nodes) {
      node.applyForce(Force.centerForce(node.position, node.mass));
    }

    // Update positions
    for (const node of this._nodes) {
      node.physicsTick();
    }
  }
}
