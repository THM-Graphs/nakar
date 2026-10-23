import { TestHarness } from '../testing/TestHarness.test';
import type { PhysicalNode } from '../../physics/physical-graph/PhysicalNode';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { PhysicalGraph } from '../../physics/physical-graph/PhysicalGraph';
import { CanvasPhysicsSimulation } from './CanvasPhysicsSimulation';
import { InvalidDataError } from '../error/InvalidDataError';
import type { CanvasPhysicsOptions } from './CanvasPhysicsOptions';
import { MockRuntimeDelegate } from '../testing/MockRuntimeDelegate.test';

void describe('CanvasPhysicsSimulation', (): void => {
  void describe('tick', (): void => {
    void it('matches the established interleaved center and pair force calculation', (): void => {
      const graph: PhysicalGraph = TestHarness.physical();
      const a: PhysicalNode | null = graph.nodes['a'];
      const b: PhysicalNode | null = graph.nodes['b'];
      assert.ok(a && b);
      a.positionX = 100000;
      b.positionX = 100001;
      delete graph.nodes['c'];
      delete graph.edges['ab'];
      new CanvasPhysicsSimulation(graph).tick(1);
      assert.ok(Math.abs(b.positionX - 100235.65421935407) < 0.000001);
    });
    void it('separates coincident nodes in two dimensions using injected randomness', (): void => {
      const graph: PhysicalGraph = TestHarness.physical();
      const random: MockRuntimeDelegate = new MockRuntimeDelegate();
      const simulation: CanvasPhysicsSimulation = new CanvasPhysicsSimulation(
        graph,
        {},
        random,
      );
      for (let i: number = 0; i < 100; i++) {
        simulation.tick(1);
      }
      assert.ok(
        Object.values(graph.nodes).some(
          (node: PhysicalNode | null): boolean =>
            node !== null && Math.abs(node.positionY) > 0.1,
        ),
      );
    });
    void it('uses the established proximity threshold before calculating pair forces', (): void => {
      const graph: PhysicalGraph = TestHarness.physical();
      const b: PhysicalNode | null = graph.nodes['b'];
      assert.ok(b);
      b.positionX = 0.05;
      let samples: number = 0;
      const random: MockRuntimeDelegate = new MockRuntimeDelegate();
      random.random = (): number => {
        samples += 1;
        return 0.125;
      };
      new CanvasPhysicsSimulation(graph, {}, random).tick(1);
      assert.ok(samples > 0);
    });
    void it('does not perturb two overlapping locked nodes', (): void => {
      const graph: PhysicalGraph = TestHarness.physical();
      for (const node of Object.values(graph.nodes)) {
        if (node !== null) {
          node.locked = true;
        }
      }
      new CanvasPhysicsSimulation(graph).tick(1);
      for (const node of Object.values(graph.nodes)) {
        assert.ok(
          node !== null && node.positionX === 0 && node.positionY === 0,
        );
      }
    });
    void it('caps velocity before displacement using the configured maximum', (): void => {
      const graph: PhysicalGraph = TestHarness.driftingPhysicalGraph();
      new CanvasPhysicsSimulation(graph, {
        maximumVelocity: 2,
        frictionFactor: 0,
      }).tick(1);
      assert.equal(graph.nodes['a']?.positionX, 2);
      assert.equal(graph.nodes['a'].velocityX, 2);
    });
    void it('caps force contributions using the configured maximum', (): void => {
      const graph: PhysicalGraph = TestHarness.physical();
      new CanvasPhysicsSimulation(graph, {
        maximumForce: 5,
        frictionFactor: 0,
      }).tick(1);
      for (const node of Object.values(graph.nodes)) {
        assert.ok(
          node !== null &&
            Math.hypot(node.velocityX, node.velocityY) <= 5.000001,
        );
      }
    });
    void it('applies configured friction after moving nodes', (): void => {
      const graph: PhysicalGraph = TestHarness.driftingPhysicalGraph();
      new CanvasPhysicsSimulation(graph, { frictionFactor: 0.25 }).tick(1);
      assert.equal(graph.nodes['a']?.positionX, 10);
      assert.equal(graph.nodes['a'].velocityX, 7.5);
    });
    void it('removes all velocity when friction is one', (): void => {
      const graph: PhysicalGraph = TestHarness.driftingPhysicalGraph();
      new CanvasPhysicsSimulation(graph, { frictionFactor: 1 }).tick(1);
      assert.equal(graph.nodes['a']?.positionX, 10);
      assert.equal(graph.nodes['a'].velocityX, 0);
    });
    void it('scales displacement with heat while still applying friction', (): void => {
      const graph: PhysicalGraph = TestHarness.driftingPhysicalGraph();
      const simulation: CanvasPhysicsSimulation = new CanvasPhysicsSimulation(
        graph,
      );
      simulation.tick(0.5);
      assert.equal(graph.nodes['a']?.positionX, 5);
      assert.equal(graph.nodes['a'].velocityX, 6);
      simulation.tick(0);
      assert.equal(graph.nodes['a'].positionX, 5);
      assert.ok(Math.abs(graph.nodes['a'].velocityX - 3.6) < 0.000001);
    });
    void it('separates coincident nodes deterministically and keeps values finite', (): void => {
      const graph: PhysicalGraph = TestHarness.physical();
      new CanvasPhysicsSimulation(graph).tick(1);
      assert.notEqual(graph.nodes['a']?.positionX, graph.nodes['b']?.positionX);
      for (const node of Object.values(graph.nodes)) {
        assert.ok(
          node !== null &&
            Number.isFinite(node.positionX) &&
            Number.isFinite(node.positionY),
        );
      }
    });
    void it('preserves locked positions and resets existing velocity even with overlapping nodes', (): void => {
      const graph: PhysicalGraph = TestHarness.physical();
      const a: PhysicalNode | null = graph.nodes['a'];
      assert.ok(a);
      a.locked = true;
      a.velocityX = 20;
      a.velocityY = 30;
      new CanvasPhysicsSimulation(graph).tick(1);
      assert.equal(a.positionX, 0);
      assert.equal(a.positionY, 0);
      assert.equal(a.velocityX, 0);
      assert.equal(a.velocityY, 0);
    });
    void it('applies center/link forces, caps force, ignores null nodes, loops, missing endpoints and duplicate links', (): void => {
      const graph: PhysicalGraph = TestHarness.physical();
      const a: PhysicalNode | null = graph.nodes['a'];
      const b: PhysicalNode | null = graph.nodes['b'];
      assert.ok(a && b);
      a.positionX = 10000;
      b.positionX = -10000;
      b.locked = true;
      graph.nodes['null'] = null;
      graph.edges['null'] = null;
      graph.edges['loop'] = {
        id: 'loop',
        startNodeId: 'a',
        endNodeId: 'a',
        edgeType: 'LOOP',
        title: '',
      };
      graph.edges['missing-start'] = {
        id: 'missing-start',
        startNodeId: 'missing',
        endNodeId: 'b',
        edgeType: '',
        title: '',
      };
      graph.edges['missing-end'] = {
        id: 'missing-end',
        startNodeId: 'a',
        endNodeId: 'missing',
        edgeType: '',
        title: '',
      };
      graph.edges['duplicate'] = {
        id: 'duplicate',
        startNodeId: 'b',
        endNodeId: 'a',
        edgeType: '',
        title: '',
      };
      new CanvasPhysicsSimulation(graph).tick(1);
      assert.ok(a.positionX < 10000);
      assert.equal(b.positionX, -10000);
      assert.ok(Math.hypot(a.velocityX, a.velocityY) <= 180.000001);
      new CanvasPhysicsSimulation({ nodes: {}, edges: {} }).tick(1);
    });
  });
  void describe('constructor', (): void => {
    void it('snapshots settings so later caller mutations cannot affect simulation', (): void => {
      const graph: PhysicalGraph = TestHarness.driftingPhysicalGraph();
      const options: Partial<CanvasPhysicsOptions> = { frictionFactor: 0 };
      const simulation: CanvasPhysicsSimulation = new CanvasPhysicsSimulation(
        graph,
        options,
      );
      options.frictionFactor = 1;
      simulation.tick(1);
      assert.equal(graph.nodes['a']?.velocityX, 10);
    });
    void it('rejects invalid simulation options', (): void => {
      assert.throws((): void => {
        new CanvasPhysicsSimulation(TestHarness.physical(), {
          maximumVelocity: 0,
        });
      }, InvalidDataError);
    });
    void it('retains its initial data and collaborators', (): void => {
      const graph: PhysicalGraph = TestHarness.physical();
      const simulation: CanvasPhysicsSimulation = new CanvasPhysicsSimulation(
        graph,
      );
      simulation.tick(1);
      assert.notEqual(graph.nodes['a']?.positionX, 0);
    });
  });
});
