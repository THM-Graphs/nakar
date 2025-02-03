import { Observable, Subject } from 'rxjs';
import { MutableGraph } from '../graph/MutableGraph';
import { wait } from '../tools/Wait';
import { MutableNode } from '../graph/MutableNode';

export class PhysicsSimulation {
  public static readonly maximumVelocity = 1000;
  public static readonly FPS = 60;

  private _graph: MutableGraph;
  private _running: boolean;
  private _onSlowTick: Subject<void>;

  public constructor(graph: MutableGraph) {
    this._graph = graph;
    this._running = false;
    this._onSlowTick = new Subject();
  }

  public get onSlowTick(): Observable<void> {
    return this._onSlowTick.asObservable();
  }

  public start(): void {
    if (this._running) {
      return;
    }

    this._running = true;
    (async (): Promise<void> => {
      let lastWait = Date.now();
      const shouldWaitEveryMs = (1 / PhysicsSimulation.FPS) * 1000 * 0.1; // Tenth of frame
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

  private _tick(): void {
    // Example iteration count
    // Calculate repulsive forces
    for (const nodeA of this._graph.nodes.values()) {
      for (const nodeB of this._graph.nodes.values()) {
        if (nodeA !== nodeB) {
          this._twoBodyForce(nodeA, nodeB);
        }
      }
    }

    // Calculate attractive forces
    for (const edge of this._graph.edges.values()) {
      if (edge.isLoop) {
        continue;
      }
      const nodeA = this._graph.nodes.get(edge.startNodeId);
      if (nodeA == null) {
        continue;
      }

      const nodeB = this._graph.nodes.get(edge.endNodeId);
      if (nodeB == null) {
        continue;
      }

      if (nodeA.locked && nodeB.locked) {
        continue;
      }

      const targetDistance =
        nodeA.radius + edge.type.length * 20 + nodeB.radius;

      this._linkForce(targetDistance, nodeA, nodeB);
    }

    // Apply centering forces
    for (const node of this._graph.nodes.values()) {
      this._centerForce(node);
    }

    // Update positions
    for (const node of this._graph.nodes.values()) {
      this._applyVelocity(node);
    }
  }

  private _positionEquals(nodeA: MutableNode, nodeB: MutableNode): boolean {
    return (
      nodeA.position.x === nodeB.position.x &&
      nodeA.position.y === nodeB.position.y
    );
  }

  private _jiggle(node: MutableNode): void {
    const radians = Math.random() * Math.PI * 2;
    node.position.x += Math.cos(radians) * 10;
    node.position.y += Math.sin(radians) * 10;
  }

  private _applyForce(node: MutableNode, forceX: number, forceY: number): void {
    node.velocityX += forceX;
    node.velocityY += forceY;

    const magnitude = this._magnitude(node.velocityX, node.velocityY);
    if (magnitude > PhysicsSimulation.maximumVelocity) {
      node.velocityX =
        (node.velocityX / magnitude) * PhysicsSimulation.maximumVelocity;
      node.velocityY =
        (node.velocityY / magnitude) * PhysicsSimulation.maximumVelocity;
    }
  }

  private _applyVelocity(node: MutableNode): void {
    const magnitude = this._magnitude(node.velocityX, node.velocityY);
    if (magnitude > PhysicsSimulation.maximumVelocity) {
      node.velocityX =
        (node.velocityX / magnitude) * PhysicsSimulation.maximumVelocity;
      node.velocityX =
        (node.velocityY / magnitude) * PhysicsSimulation.maximumVelocity;
    }
    node.position.x += node.velocityX;
    node.position.y += node.velocityY;

    node.velocityX *= 0.8;
    node.velocityY *= 0.8;
  }

  private _magnitude(x: number, y: number): number {
    return Math.sqrt(x * x + y * y);
  }

  private _mass(node: MutableNode): number {
    return Math.PI * Math.pow(node.radius, 2);
  }

  private _twoBodyForce(nodeA: MutableNode, nodeB: MutableNode): void {
    if (nodeA.locked) {
      return;
    }
    if (this._positionEquals(nodeA, nodeB)) {
      this._jiggle(nodeA);
    }

    const directionX = nodeA.position.x - nodeB.position.x;
    const directionY = nodeA.position.y - nodeB.position.y;
    const magnitude = this._magnitude(directionX, directionY);
    const strength =
      ((this._mass(nodeA) * this._mass(nodeB) * 4) / Math.pow(magnitude, 2)) *
      0.00015;

    this._applyForce(
      nodeA,
      (directionX / magnitude) * strength,
      (directionY / magnitude) * strength,
    );
  }

  private _linkForce(
    targetLength: number,
    nodeA: MutableNode,
    nodeB: MutableNode,
  ): void {
    if (this._positionEquals(nodeA, nodeB)) {
      this._jiggle(nodeA);
    }

    const directionX = nodeA.position.x - nodeB.position.x;
    const directionY = nodeA.position.y - nodeB.position.y;
    const magnitude = this._magnitude(directionX, directionY);
    const strength = (targetLength - magnitude) * 0.025;

    if (!nodeA.locked) {
      this._applyForce(
        nodeA,
        (directionX / magnitude) * strength,
        (directionY / magnitude) * strength,
      );
    }
    if (!nodeB.locked) {
      this._applyForce(
        nodeB,
        (-directionX / magnitude) * strength,
        (-directionY / magnitude) * strength,
      );
    }
  }

  private _centerForce(node: MutableNode): void {
    const magnitude = this._magnitude(node.position.x, node.position.y);
    if (magnitude === 0) {
      return;
    }

    const directionX = -node.position.x;
    const directionY = -node.position.y;
    const strength = magnitude * this._mass(node) * 0.00000013;

    if (!node.locked) {
      this._applyForce(
        node,
        (directionX / magnitude) * strength,
        (directionY / magnitude) * strength,
      );
    }
  }
}
