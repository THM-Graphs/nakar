import type { PhysicalGraph } from '../../physics/physical-graph/PhysicalGraph';
import type { PhysicalNode } from '../../physics/physical-graph/PhysicalNode';
import { CombinationCache } from '../../physics/CombinationCache';
import { CanvasPhysicsConfiguration } from './CanvasPhysicsConfiguration';
import type { CanvasPhysicsOptions } from './CanvasPhysicsOptions';
import type { CanvasRandomDelegate } from '../delegates/CanvasRandomDelegate';

/**
 * Advances the force model with injectable randomness while preserving locked node positions.
 */
export class CanvasPhysicsSimulation {
  /** Validated force and friction settings retained for subsequent ticks. */
  private readonly _configuration: CanvasPhysicsConfiguration;

  /**
   * References the physical graph that subsequent simulation ticks update.
   * @param _graph - Graph whose data is read or modified.
   * @param options - Force, velocity, friction and timing overrides.
   * @param _random - Source of random samples used to separate nearby unlocked nodes.
   */
  public constructor(
    private readonly _graph: PhysicalGraph,
    options: Partial<CanvasPhysicsOptions> = {},
    private readonly _random: CanvasRandomDelegate = { random: Math.random },
  ) {
    this._configuration = new CanvasPhysicsConfiguration(options);
  }

  /**
   * Applies one deterministic force step to the referenced physical graph.
   * @param heat - Cooling multiplier applied to node displacement during this simulation step.
   */
  public tick(heat: number): void {
    const nodes: PhysicalNode[] = Object.values(this._graph.nodes).filter(
      (node: PhysicalNode | null): node is PhysicalNode => node !== null,
    );
    for (let i: number = 0; i < nodes.length; i++) {
      const node: PhysicalNode = nodes[i];
      const centerDistance: number = Math.hypot(node.positionX, node.positionY);
      if (centerDistance > 0) {
        this._force(
          node,
          (-node.positionX / centerDistance) *
            centerDistance *
            this._mass(node) *
            0.00000013,
          (-node.positionY / centerDistance) *
            centerDistance *
            this._mass(node) *
            0.00000013,
        );
      }
      for (let j: number = i + 1; j < nodes.length; j++) {
        const left: PhysicalNode = nodes[i];
        const right: PhysicalNode = nodes[j];
        this._pair(
          left,
          right,
          (distance: number): number =>
            ((this._mass(left) * this._mass(right) * 4) /
              (distance * distance)) *
            0.00015,
        );
      }
    }
    const handled: CombinationCache = new CombinationCache();
    for (const edge of Object.values(this._graph.edges)) {
      if (
        edge === null ||
        edge.startNodeId === edge.endNodeId ||
        handled.hasCombination(edge.startNodeId, edge.endNodeId)
      ) {
        continue;
      }
      const left: PhysicalNode | null | undefined =
        this._graph.nodes[edge.startNodeId];
      const right: PhysicalNode | null | undefined =
        this._graph.nodes[edge.endNodeId];
      if (left == null || right == null) {
        continue;
      }
      this._pair(
        left,
        right,
        (distance: number): number =>
          (left.radius + edge.title.length + 200 + right.radius - distance) *
          0.024,
      );
      handled.addCombination(edge.startNodeId, edge.endNodeId);
    }
    for (const node of nodes) {
      if (node.locked) {
        node.velocityX = 0;
        node.velocityY = 0;
        continue;
      }
      const speed: number = Math.hypot(node.velocityX, node.velocityY);
      if (speed > this._configuration.maximumVelocity) {
        node.velocityX *= this._configuration.maximumVelocity / speed;
        node.velocityY *= this._configuration.maximumVelocity / speed;
      }
      node.positionX += node.velocityX * heat;
      node.positionY += node.velocityY * heat;
      node.velocityX *= 1 - this._configuration.frictionFactor;
      node.velocityY *= 1 - this._configuration.frictionFactor;
    }
  }

  /**
   * Computes the force-model mass of a physical node.
   * @param node - Physical node or graph node used by this operation.
   * @returns The node area used as mass by the force model.
   */
  private _mass(node: PhysicalNode): number {
    return Math.PI * node.radius * node.radius;
  }

  /**
   * Adds a scaled force contribution to the physical node.
   * @param node - Physical node or graph node used by this operation.
   * @param x - Horizontal force component.
   * @param y - Vertical force component.
   */
  private _force(node: PhysicalNode, x: number, y: number): void {
    if (node.locked) {
      return;
    }
    node.velocityX += x;
    node.velocityY += y;
    const magnitude: number = Math.hypot(node.velocityX, node.velocityY);
    if (magnitude > this._configuration.maximumForce) {
      node.velocityX *= this._configuration.maximumForce / magnitude;
      node.velocityY *= this._configuration.maximumForce / magnitude;
    }
  }

  /**
   * Applies attraction or repulsion between two physical nodes.
   * @param left - First physical node in this force pair.
   * @param right - Second physical node in this force pair.
   * @param strength - Function computing signed force magnitude from the distance between nodes.
   */
  private _pair(
    left: PhysicalNode,
    right: PhysicalNode,
    strength: (distance: number) => number,
  ): void {
    if (
      Math.abs(left.positionX - right.positionX) < 0.1 &&
      Math.abs(left.positionY - right.positionY) < 0.1
    ) {
      const target: PhysicalNode | null = !left.locked
        ? left
        : !right.locked
          ? right
          : null;
      if (target === null) {
        return;
      }
      const angle: number = this._random.random() * Math.PI * 2;
      target.positionX += Math.cos(angle) * 10;
      target.positionY += Math.sin(angle) * 10;
    }
    const x: number = left.positionX - right.positionX;
    const y: number = left.positionY - right.positionY;
    const distance: number = Math.hypot(x, y);
    const force: number = strength(distance);
    this._force(left, (x / distance) * force, (y / distance) * force);
    this._force(right, (-x / distance) * force, (-y / distance) * force);
  }
}
