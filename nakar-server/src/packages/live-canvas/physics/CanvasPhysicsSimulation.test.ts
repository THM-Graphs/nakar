import { TestHarness } from '../testing/TestHarness.test';
import type { PhysicalNode } from '../../physics/physical-graph/PhysicalNode';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { PhysicalGraph } from '../../physics/physical-graph/PhysicalGraph';
import { CanvasPhysicsSimulation } from './CanvasPhysicsSimulation';

void describe('CanvasPhysicsSimulation', (): void => {
  void describe('tick', (): void => {
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
