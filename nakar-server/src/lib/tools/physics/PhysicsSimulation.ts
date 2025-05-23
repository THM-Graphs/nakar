import { Observable, Subject } from 'rxjs';
import { MutableGraph } from '../../services/room/graph/MutableGraph';
import { wait } from '../Wait';
import { MutableNode } from '../../services/room/graph/MutableNode';
import { MutableEdge } from '../../services/room/graph/MutableEdge';
import { CombinationCache } from './CombinationCache';
import { LoggerService } from '../../services/logger/LoggerService';
import { ProfilerService } from '../../services/profiler/ProfilerService';
import { PhysicsSimulationRunOptions } from './PhysicsSimulationRunOptions';
import { SMap } from '../Map';

export class PhysicsSimulation {
  public static readonly maximumVelocity: number = 500;
  public static readonly maximumForce: number = 100;
  public static readonly FPS: number = 30;

  private _graph: MutableGraph;
  private _running: boolean;
  private _onSlowTick: Subject<void>;
  private _tickCount: number;
  private _tickDurationsCache: number[];
  private _radiusCache: SMap<string, number>;

  public constructor(
    graph: MutableGraph,
    private readonly _logger: LoggerService,
    private readonly _profiler: ProfilerService,
  ) {
    this._graph = graph;
    this._running = false;
    this._onSlowTick = new Subject();
    this._tickCount = 0;
    this._tickDurationsCache = [];
    this._radiusCache = new SMap();
  }

  public get onSlowTick(): Observable<void> {
    return this._onSlowTick.asObservable();
  }

  public get tickCount(): number {
    return this._tickCount;
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

  public start(): void {
    if (this._running) {
      return;
    }

    this._running = true;
    this._runSync({ maxTicks: null, maxMs: null }).catch(
      (error: unknown): void => {
        this._logger.error(this, error);
      },
    );
  }

  public stop(): void {
    this._running = false;
  }

  public async run(options: PhysicsSimulationRunOptions): Promise<void> {
    if (this._running) {
      return;
    }

    this._running = true;
    await this._runSync(options);
  }

  public setGraph(graph: MutableGraph): void {
    this._graph = graph;
    this._radiusCache = new SMap();
    for (const node of graph.nodes.nodes) {
      this._radiusCache.set(node.id, node.radius(graph, this._logger));
    }
  }

  public getGraph(): MutableGraph {
    return this._graph;
  }

  private async _runSync(options: PhysicsSimulationRunOptions): Promise<void> {
    let lastWait: number = performance.now();
    const shouldWaitEveryMs: number = (1 / PhysicsSimulation.FPS) * 1000;
    let ticksElapsed: number = 0;
    const msStart: number = performance.now();
    while (
      this._running &&
      ticksElapsed < (options.maxTicks ?? Number.POSITIVE_INFINITY) &&
      msStart + (options.maxMs ?? Number.POSITIVE_INFINITY) > performance.now()
    ) {
      const timeBeforeTick: number = performance.now();
      this._tick();
      this._tickDurationsCache.push(performance.now() - timeBeforeTick);
      ticksElapsed += 1;

      const delta: number = performance.now() - lastWait;
      if (delta > shouldWaitEveryMs) {
        this._onSlowTick.next();
        await wait(0);
        lastWait = performance.now();
      }
    }
    this._running = false;
  }

  private _tick(): void {
    const nodes: MutableNode[] = this._graph.nodes.nodes.toArray();
    const edges: MutableEdge[] = this._graph.edges.edges.toArray();

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

      const nodeA: MutableNode | null = this._graph.nodes.get(edge.startNodeId);
      if (nodeA == null) {
        continue;
      }

      const nodeB: MutableNode | null = this._graph.nodes.get(edge.endNodeId);
      if (nodeB == null) {
        continue;
      }

      const targetDistance: number =
        (this._radiusCache.get(nodeA.id) ?? MutableNode.defaultRadius) +
        edge.type.length * 20 +
        (this._radiusCache.get(nodeB.id) ?? MutableNode.defaultRadius);

      this._linkForce(targetDistance, nodeA, nodeB);
      handledNodeCombinations.addCombination(edge.startNodeId, edge.endNodeId);
    }

    // Update positions
    for (const node of nodes) {
      this._applyVelocity(node);
    }

    this._tickCount += 1;
  }

  private _positionEquals(nodeA: MutableNode, nodeB: MutableNode): boolean {
    const threshold: number = 0.1;
    return (
      Math.abs(nodeA.position.x - nodeB.position.x) < threshold &&
      Math.abs(nodeA.position.y - nodeB.position.y) < threshold
    );
  }

  private _jiggle(node: MutableNode): void {
    const radians: number = Math.random() * Math.PI * 2;
    node.position.x += Math.cos(radians) * 10;
    node.position.y += Math.sin(radians) * 10;
  }

  private _applyForce(node: MutableNode, forceX: number, forceY: number): void {
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

  private _applyVelocity(node: MutableNode): void {
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

  private _mass(node: MutableNode): number {
    return (
      Math.PI *
      Math.pow(this._radiusCache.get(node.id) ?? MutableNode.defaultRadius, 2)
    );
  }

  private _twoBodyForce(nodeA: MutableNode, nodeB: MutableNode): void {
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
    nodeA: MutableNode,
    nodeB: MutableNode,
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

  private _centerForce(node: MutableNode): void {
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
