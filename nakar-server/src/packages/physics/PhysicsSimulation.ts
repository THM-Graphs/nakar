import type { Observable } from 'rxjs';
import { Subject } from 'rxjs';
import { CombinationCache } from './CombinationCache';
import type { PhysicsSimulationRunOptions } from './PhysicsSimulationRunOptions';
import type { PhysicalGraph } from './physical-graph/PhysicalGraph';
import type { PhysicalNode } from './physical-graph/PhysicalNode';
import type { PhysicalEdge } from './physical-graph/PhysicalEdge';
import { Range } from '../range/Range';
import type { PhysicsSimulationEventSlowTick } from './PhysicsSimulationEventSlowTick';

export class PhysicsSimulation {
  public static readonly maximumVelocity: number = 2000;
  public static readonly maximumForce: number = 300;
  public static readonly FPS: number = 16;
  public static readonly cooldownTime: number = 1000;
  public static readonly frictionFactor: number = 0.4;
  public static readonly targetPhysicsTickDuration: number = 15;

  private _graph: PhysicalGraph;
  private _running: boolean;
  private readonly _onSlowTick$: Subject<PhysicsSimulationEventSlowTick>;
  private readonly _onStopped$: Subject<void>;
  private readonly _onLog$: Subject<string>;
  private _targetDate: number;

  public constructor(graph: PhysicalGraph) {
    this._graph = graph;
    this._running = false;
    this._onSlowTick$ = new Subject();
    this._onStopped$ = new Subject();
    this._onLog$ = new Subject();
    this._targetDate = Date.now();
  }

  public get onSlowTick$(): Observable<PhysicsSimulationEventSlowTick> {
    return this._onSlowTick$.asObservable();
  }

  public get onStopped$(): Observable<void> {
    return this._onStopped$.asObservable();
  }

  public get onLog$(): Observable<string> {
    return this._onLog$.asObservable();
  }

  private get _heat(): number {
    const delta: number = this._targetDate - Date.now();
    const heat: number =
      Range.clamp(delta, 0, PhysicsSimulation.cooldownTime) /
      PhysicsSimulation.cooldownTime;
    return heat;
  }

  private get _targetSlowTickDuration(): number {
    return (1 / PhysicsSimulation.FPS) * 1000;
  }

  public static jiggle(node: PhysicalNode): void {
    const radians: number = Math.random() * Math.PI * 2;
    node.positionX += Math.cos(radians) * 10;
    node.positionY += Math.sin(radians) * 10;
  }

  public static jiggled(): { x: number; y: number } {
    const radians: number = Math.random() * Math.PI * 2;
    return {
      x: Math.cos(radians) * 10,
      y: Math.sin(radians) * 10,
    };
  }

  public stop(): void {
    this._running = false;
  }

  public async run(options: PhysicsSimulationRunOptions): Promise<void> {
    if (options.maxMs == null) {
      this._targetDate = Number.MAX_SAFE_INTEGER;
    } else {
      this._targetDate = Date.now() + options.maxMs;
    }

    if (this._running) {
      return;
    } else {
      this._onLog$.next(
        `Will start physics simulation: ${JSON.stringify(options)}`,
      );
      this._running = true;
      await this._runSync();
    }
  }

  public setGraph(graph: PhysicalGraph): void {
    this._graph = graph;
  }

  public getGraph(): PhysicalGraph {
    return this._graph;
  }

  private async _runSync(): Promise<void> {
    let lastWait: number = Date.now();
    let tickCount: number = 0;

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    while (true) {
      this._tick();
      tickCount += 1;

      if (!this._running) {
        break;
      }
      if (Date.now() > this._targetDate) {
        break;
      }

      const waitDelta: number = Date.now() - lastWait;
      if (waitDelta >= this._targetSlowTickDuration) {
        const avgTickDuration: number = (Date.now() - lastWait) / tickCount;
        this._onSlowTick$.next({
          graph: this._graph,
          performance: {
            tickDuration: avgTickDuration,
            loadPercent:
              avgTickDuration / PhysicsSimulation.targetPhysicsTickDuration,
            performance:
              avgTickDuration > PhysicsSimulation.targetPhysicsTickDuration
                ? 'bad'
                : 'good',
            tickCount: tickCount,
          },
        });
        lastWait = Date.now();
        tickCount = 0;
        await this._enqueueEventLoop();
      }
    }

    this._running = false;
    this._targetDate = Number.MIN_SAFE_INTEGER;
    this._onStopped$.next();
    this._onLog$.next(`Physics Simulation stopped.`);
  }

  private _tick(): void {
    const nodes: (PhysicalNode | null)[] = Object.values(this._graph.nodes);
    const edges: (PhysicalEdge | null)[] = Object.values(this._graph.edges);

    for (let i: number = 0; i < nodes.length; i++) {
      const nodeA: PhysicalNode | null = nodes[i];
      if (nodeA == null) {
        continue;
      }
      this._centerForce(nodeA);

      for (let j: number = i + 1; j < nodes.length; j++) {
        const nodeB: PhysicalNode | null = nodes[j];
        if (nodeB == null) {
          continue;
        }
        this._twoBodyForce(nodeA, nodeB);
      }
    }

    const handledNodeCombinations: CombinationCache = new CombinationCache();
    for (const edge of edges) {
      if (edge == null) {
        continue;
      }
      if (edge.startNodeId === edge.endNodeId) {
        // Is loop
        continue;
      }
      if (
        handledNodeCombinations.hasCombination(edge.startNodeId, edge.endNodeId)
      ) {
        continue;
      }

      const nodeA: PhysicalNode | null = this._graph.nodes[edge.startNodeId];
      if (nodeA == null) {
        continue;
      }

      const nodeB: PhysicalNode | null = this._graph.nodes[edge.endNodeId];
      if (nodeB == null) {
        continue;
      }

      const targetDistance: number =
        nodeA.radius + edge.title.length * 20 + nodeB.radius;

      this._linkForce(targetDistance, nodeA, nodeB);
      handledNodeCombinations.addCombination(edge.startNodeId, edge.endNodeId);
    }

    // Update positions
    for (const node of nodes) {
      if (node == null) {
        continue;
      }
      this._applyVelocity(node);
    }
  }

  private _positionEquals(nodeA: PhysicalNode, nodeB: PhysicalNode): boolean {
    const threshold: number = 0.1;
    const result: boolean =
      Math.abs(nodeA.positionX - nodeB.positionX) < threshold &&
      Math.abs(nodeA.positionY - nodeB.positionY) < threshold;
    return result;
  }

  private _applyForce(
    node: PhysicalNode,
    forceX: number,
    forceY: number,
  ): void {
    node.velocityX += forceX;
    node.velocityY += forceY;

    const magnitude: number = this._magnitude(node.velocityX, node.velocityY);
    if (magnitude > PhysicsSimulation.maximumForce) {
      node.velocityX =
        (node.velocityX / magnitude) * PhysicsSimulation.maximumForce;
      node.velocityY =
        (node.velocityY / magnitude) * PhysicsSimulation.maximumForce;
    }
  }

  private _applyVelocity(node: PhysicalNode): void {
    const magnitude: number = this._magnitude(node.velocityX, node.velocityY);
    if (magnitude > PhysicsSimulation.maximumVelocity) {
      node.velocityX =
        (node.velocityX / magnitude) * PhysicsSimulation.maximumVelocity;
      node.velocityY =
        (node.velocityY / magnitude) * PhysicsSimulation.maximumVelocity;
    }
    node.positionX += node.velocityX * this._heat;
    node.positionY += node.velocityY * this._heat;

    node.velocityX *= 1 - PhysicsSimulation.frictionFactor;
    node.velocityY *= 1 - PhysicsSimulation.frictionFactor;
  }

  private _magnitude(x: number, y: number): number {
    return Math.sqrt(x * x + y * y);
  }

  private _mass(node: PhysicalNode): number {
    return Math.PI * Math.pow(node.radius, 2);
  }

  private _twoBodyForce(nodeA: PhysicalNode, nodeB: PhysicalNode): void {
    if (this._positionEquals(nodeA, nodeB)) {
      PhysicsSimulation.jiggle(nodeA);
    }

    const directionX: number = nodeA.positionX - nodeB.positionX;
    const directionY: number = nodeA.positionY - nodeB.positionY;
    const magnitude: number = this._magnitude(directionX, directionY);
    const strength: number =
      ((this._mass(nodeA) * this._mass(nodeB) * 4) / Math.pow(magnitude, 2)) *
      0.00015;

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

  private _linkForce(
    targetLength: number,
    nodeA: PhysicalNode,
    nodeB: PhysicalNode,
  ): void {
    if (this._positionEquals(nodeA, nodeB)) {
      PhysicsSimulation.jiggle(nodeA);
    }

    const directionX: number = nodeA.positionX - nodeB.positionX;
    const directionY: number = nodeA.positionY - nodeB.positionY;
    const magnitude: number = this._magnitude(directionX, directionY);
    const strength: number = (targetLength - magnitude) * 0.024;

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

  private _centerForce(node: PhysicalNode): void {
    const magnitude: number = this._magnitude(node.positionX, node.positionY);
    if (magnitude === 0) {
      return;
    }

    const directionX: number = -node.positionX;
    const directionY: number = -node.positionY;
    const strength: number = magnitude * this._mass(node) * 0.00000013;

    if (!node.locked) {
      this._applyForce(
        node,
        (directionX / magnitude) * strength,
        (directionY / magnitude) * strength,
      );
    }
  }

  private async _enqueueEventLoop(): Promise<void> {
    await new Promise<void>((resolve: () => void): void => {
      setImmediate((): void => {
        resolve();
      });
    });
  }
}
