import type { Observable } from 'rxjs';
import { Subject } from 'rxjs';
import { wait } from '../tools/Wait';
import { CombinationCache } from './CombinationCache';
import type { LoggerService } from '../logger/LoggerService';
import type { ProfilerService } from '../profiler/ProfilerService';
import type { PhysicsSimulationRunOptions } from './PhysicsSimulationRunOptions';
import type { PhysicalGraph } from './physical-graph/PhysicalGraph';
import type { PhysicalNode } from './physical-graph/PhysicalNode';
import type { PhysicalEdge } from './physical-graph/PhysicalEdge';
import { Range } from '../tools/Range';
import type { MutableNode } from '../room/graph/MutableNode';
import { PhysicsSimulationEventSlowTick } from './PhysicsSimulationEventSlowTick';

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
  private _targetDate: number;

  public constructor(
    graph: PhysicalGraph,
    private readonly _logger: LoggerService,
    private readonly _profiler: ProfilerService,
  ) {
    this._graph = graph;
    this._running = false;
    this._onSlowTick$ = new Subject();
    this._targetDate = Date.now();
  }

  public get onSlowTick$(): Observable<PhysicsSimulationEventSlowTick> {
    return this._onSlowTick$.asObservable();
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

  public static jiggle(node: PhysicalNode | MutableNode): void {
    const radians: number = Math.random() * Math.PI * 2;
    node.position.x += Math.cos(radians) * 10;
    node.position.y += Math.sin(radians) * 10;
  }

  public runIndefinitely(): void {
    this.run({ maxMs: null }).catch((error: unknown): void => {
      this._logger.error(this, error);
    });
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
      this._logger.debug(
        this,
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
        await wait(0);
      }
    }

    this._running = false;
    this._targetDate = Number.MIN_SAFE_INTEGER;
    this._logger.debug(this, `Physics Simulation stopped.`);
  }

  private _tick(): void {
    const nodes: PhysicalNode[] = Object.values(this._graph.nodes);
    const edges: PhysicalEdge[] = Object.values(this._graph.edges);

    for (let i: number = 0; i < nodes.length; i++) {
      this._centerForce(nodes[i]);

      for (let j: number = i + 1; j < nodes.length; j++) {
        this._twoBodyForce(nodes[i], nodes[j]);
      }
    }

    const handledNodeCombinations: CombinationCache = new CombinationCache();
    for (const edge of edges) {
      if (edge.isLoop) {
        continue;
      }
      if (
        handledNodeCombinations.hasCombination(edge.startNodeId, edge.endNodeId)
      ) {
        continue;
      }

      const nodeA: PhysicalNode | null = this._graph.nodes[
        edge.startNodeId
      ] as PhysicalNode | null;
      if (nodeA == null) {
        continue;
      }

      const nodeB: PhysicalNode | null = this._graph.nodes[
        edge.endNodeId
      ] as PhysicalNode | null;
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
      this._applyVelocity(node);
    }
  }

  private _positionEquals(nodeA: PhysicalNode, nodeB: PhysicalNode): boolean {
    const threshold: number = 0.1;
    const result: boolean =
      Math.abs(nodeA.position.x - nodeB.position.x) < threshold &&
      Math.abs(nodeA.position.y - nodeB.position.y) < threshold;
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
      node.velocityX =
        (node.velocityY / magnitude) * PhysicsSimulation.maximumVelocity;
    }
    node.position.x += node.velocityX * this._heat;
    node.position.y += node.velocityY * this._heat;

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

    const directionX: number = nodeA.position.x - nodeB.position.x;
    const directionY: number = nodeA.position.y - nodeB.position.y;
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

    const directionX: number = nodeA.position.x - nodeB.position.x;
    const directionY: number = nodeA.position.y - nodeB.position.y;
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
    const magnitude: number = this._magnitude(node.position.x, node.position.y);
    if (magnitude === 0) {
      return;
    }

    const directionX: number = -node.position.x;
    const directionY: number = -node.position.y;
    const strength: number = magnitude * this._mass(node) * 0.00000013;

    if (!node.locked) {
      this._applyForce(
        node,
        (directionX / magnitude) * strength,
        (directionY / magnitude) * strength,
      );
    }
  }
}
