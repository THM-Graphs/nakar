import { Observable, Subject } from 'rxjs';
import { MutableGraph } from '../graph/MutableGraph';
import { SMap } from '../tools/Map';
import { wait } from '../tools/Wait';
import { Force } from './Force';
import { PhysicalEdge } from './PhysicalEdge';
import { PhysicalNode } from './PhysicalNode';
import { Vector } from './Vector';

export class PhysicsSimulation {
  public static readonly FPS = 60;

  private _nodes: SMap<string, PhysicalNode>;
  private _edges: SMap<string, PhysicalEdge>;
  private _running: boolean;
  private _onSlowTick: Subject<void>;

  public constructor(graph: MutableGraph) {
    this._running = false;
    this._onSlowTick = new Subject();
    this._nodes = graph.nodes.map((node, id): PhysicalNode => {
      return new PhysicalNode(id, node);
    });

    this._edges = graph.edges.reduce((akku, id, edge) => {
      const sourceNode = this._nodes.get(edge.startNodeId);
      const targetNode = this._nodes.get(edge.endNodeId);
      if (sourceNode == null || targetNode == null) {
        return akku;
      } else {
        return akku.bySetting(
          id,
          new PhysicalEdge(edge, sourceNode, targetNode),
        );
      }
    }, new SMap<string, PhysicalEdge>());
  }

  public get onSlowTick(): Observable<void> {
    return this._onSlowTick.asObservable();
  }

  public get nodes(): SMap<string, PhysicalNode> {
    return this._nodes;
  }

  public start(): void {
    if (this._running) {
      return;
    }

    // Load positions
    for (const node of this._nodes.values()) {
      node.position = new Vector(
        node.original.position.x,
        node.original.position.y,
      );
    }

    this._running = true;
    (async (): Promise<void> => {
      let lastWait = Date.now();
      const shouldWaitEveryMs = (1 / PhysicsSimulation.FPS) * 1000 * 0.5; // Half of frame
      while (this._running) {
        this._tick();
        if (lastWait + shouldWaitEveryMs < Date.now()) {
          this._onSlowTick.next();
          await wait(0);
          lastWait = Date.now();
        }
      }
    })().catch(strapi.log.error);
  }

  public stop(): void {
    this._running = false;
  }

  public grab(nodeId: string, userId: string): void {
    const node = this._nodes.get(nodeId);
    if (node == null) {
      strapi.log.error(
        `Tried to grab node that does not exist. Node ID: ${nodeId}`,
      );
      return;
    }
    node.grab(userId);
  }

  public ungrab(nodeId: string, userId: string): void {
    const node = this._nodes.get(nodeId);
    if (node == null) {
      strapi.log.error(
        `Tried to ungrab node that does not exist. Node ID: ${nodeId}`,
      );
      return;
    }
    node.ungrab(userId);
  }

  public lock(nodeId: string): void {
    const node = this._nodes.get(nodeId);
    if (node == null) {
      strapi.log.error(
        `Tried to lock node that does not exist. Node ID: ${nodeId}`,
      );
      return;
    }
    node.lock();
  }

  public setNodePosition(nodeId: string, position: Vector): void {
    const node = this._nodes.get(nodeId);
    if (node == null) {
      strapi.log.error(
        `Tried to set position of node that does not exist. Node ID: ${nodeId}`,
      );
      return;
    }
    node.position = position;
  }

  private _tick(): void {
    // Example iteration count
    // Calculate repulsive forces
    for (const nodeA of this._nodes.values()) {
      for (const nodeB of this._nodes.values()) {
        if (nodeA !== nodeB) {
          if (nodeA.locked) {
            continue;
          }
          if (nodeA.position.equals(nodeB.position)) {
            nodeA.jiggle();
          }
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
    for (const edge of this._edges.values()) {
      if (edge.original.isLoop) {
        continue;
      }
      const nodeA = edge.source;
      const nodeB = edge.target;
      if (nodeA.locked && nodeB.locked) {
        continue;
      }

      if (nodeA.position.equals(nodeB.position)) {
        nodeA.jiggle();
      }

      const targetDistance =
        nodeA.original.radius +
        edge.original.type.length * 20 +
        nodeB.original.radius;

      const force = Force.linkForce(
        targetDistance,
        nodeA.position,
        nodeB.position,
      );
      if (!nodeA.locked) {
        nodeA.applyForce(force);
      }
      if (!nodeB.locked) {
        nodeB.applyForce(force.inverted);
      }
    }

    // Apply centering forces
    for (const node of this._nodes.values()) {
      if (node.locked) {
        continue;
      }
      node.applyForce(Force.centerForce(node.position, node.mass));
    }

    // Update positions
    for (const node of this._nodes.values()) {
      node.physicsTick();
    }
  }
}
