import { Observable, Subject } from 'rxjs';
import { wait } from '../Wait';
import { CombinationCache } from './CombinationCache';
import { LoggerService } from '../../services/logger/LoggerService';
import { ProfilerService } from '../../services/profiler/ProfilerService';
import { PhysicsSimulationRunOptions } from './PhysicsSimulationRunOptions';
import { PhysicalGraph } from './physical-graph/PhysicalGraph';
import { PhysicalNode } from './physical-graph/PhysicalNode';
import { PhysicalEdge } from './physical-graph/PhysicalEdge';
import { Range } from '../Range';

export class PhysicsSimulation {
  public static readonly maximumVelocity: number = 500;
  public static readonly maximumForce: number = 100;
  public static readonly FPS: number = 30;
  public static readonly cooldownTime: number = 500;

  private _graph: PhysicalGraph;
  private _running: boolean;
  private _onSlowTick: Subject<void>;
  private _targetDate: number;
  private _tickDurationsCache: number[];

  public constructor(
    graph: PhysicalGraph,
    private readonly _logger: LoggerService,
    private readonly _profiler: ProfilerService,
  ) {
    this._graph = graph;
    this._running = false;
    this._onSlowTick = new Subject();
    this._targetDate = Date.now();
    this._tickDurationsCache = [];
  }

  public get onSlowTick(): Observable<void> {
    return this._onSlowTick.asObservable();
  }

  public get averageTickDuration(): number {
    const avg: number =
      this._tickDurationsCache.reduce(
        (a: number, b: number): number => a + b,
        0,
      ) / this._tickDurationsCache.length;
    this._tickDurationsCache = [];
    return avg;
  }

  private get _heat(): number {
    const delta: number = this._targetDate - performance.now();
    const heat: number =
      Range.clamp(delta, 0, PhysicsSimulation.cooldownTime) /
      PhysicsSimulation.cooldownTime;
    return heat;
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
      this._targetDate = performance.now() + options.maxMs;
    }

    if (this._running) {
      return;
    } else {
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
    let lastWait: number = performance.now();
    const shouldWaitEveryMs: number = (1 / PhysicsSimulation.FPS) * 1000;

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    while (true) {
      if (!this._running) {
        break;
      }
      if (performance.now() > this._targetDate) {
        break;
      }

      const timeBeforeTick: number = performance.now();
      this._tick();
      this._tickDurationsCache.push(performance.now() - timeBeforeTick);

      const waitDelta: number = performance.now() - lastWait;
      if (waitDelta > shouldWaitEveryMs) {
        this._onSlowTick.next();
        await wait(0);
        lastWait = performance.now();
      }
    }

    this._running = false;
    this._targetDate = Number.MIN_SAFE_INTEGER;
    this._onSlowTick.next();
    this._logger.debug(
      this,
      `Average tick duration: ${this.averageTickDuration.toFixed(2)} ms. Target: ${((1 / PhysicsSimulation.FPS) * 1000).toFixed()} ms.`,
    );
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
    return (
      Math.abs(nodeA.position.x - nodeB.position.x) < threshold &&
      Math.abs(nodeA.position.y - nodeB.position.y) < threshold
    );
  }

  private _jiggle(node: PhysicalNode): void {
    const radians: number = Math.random() * Math.PI * 2;
    node.position.x += Math.cos(radians) * 10;
    node.position.y += Math.sin(radians) * 10;
  }

  private _applyForce(
    node: PhysicalNode,
    forceX: number,
    forceY: number,
  ): void {
    node.velocityX += forceX * this._heat;
    node.velocityY += forceY * this._heat;

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
    node.position.x += node.velocityX;
    node.position.y += node.velocityY;

    node.velocityX *= 0.8;
    node.velocityY *= 0.8;
  }

  private _magnitude(x: number, y: number): number {
    return Math.sqrt(x * x + y * y);
  }

  private _mass(node: PhysicalNode): number {
    return Math.PI * Math.pow(node.radius, 2);
  }

  private _twoBodyForce(nodeA: PhysicalNode, nodeB: PhysicalNode): void {
    if (this._positionEquals(nodeA, nodeB)) {
      this._jiggle(nodeA);
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
      this._jiggle(nodeA);
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
