import { TestHarness } from '../testing/TestHarness.test';
import type { PhysicalNode } from '../../physics/physical-graph/PhysicalNode';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { CanvasHierarchyLayout } from './CanvasHierarchyLayout';
import { CanvasGraph } from './CanvasGraph';
import { CanvasViewSettings } from '../view-settings/CanvasViewSettings';

import type { PhysicalGraph } from '../../physics/physical-graph/PhysicalGraph';

void describe('CanvasHierarchyLayout', (): void => {
  void describe('layout', (): void => {
    void it('lays out directed hierarchies in ordered layers and centers the bounding box', (): void => {
      const graph: PhysicalGraph = new CanvasGraph(
        TestHarness.canvasData(
          [
            TestHarness.node('a'),
            TestHarness.node('b'),
            TestHarness.node('c'),
            TestHarness.node('d'),
          ],
          [
            TestHarness.edge('ab'),
            TestHarness.edge('ac', 'a', 'c'),
            TestHarness.edge('bd', 'b', 'd'),
            TestHarness.edge('cd', 'c', 'd'),
          ],
        ).graph,
      ).toPhysicalGraph(new CanvasViewSettings());
      new CanvasHierarchyLayout(graph).layout('KNOWS');
      const a: PhysicalNode | null = graph.nodes['a'];
      const b: PhysicalNode | null = graph.nodes['b'];
      const c: PhysicalNode | null = graph.nodes['c'];
      const d: PhysicalNode | null = graph.nodes['d'];
      assert.ok(a && b && c && d);
      assert.ok(a.positionX < b.positionX && b.positionX < d.positionX);
      assert.equal(b.positionX, c.positionX);
      assert.ok(Math.abs(b.positionY - c.positionY) >= b.radius + c.radius);
      assert.equal(a.positionX, -d.positionX);
    });
    void it('handles cycles, duplicate component links, loops, disconnected nodes and arbitrary ids deterministically', (): void => {
      const graph: PhysicalGraph = new CanvasGraph(
        TestHarness.canvasData(
          [
            TestHarness.node('__proto__'),
            TestHarness.node('b'),
            TestHarness.node('c'),
            TestHarness.node('isolated'),
          ],
          [
            TestHarness.edge('ab', '__proto__', 'b'),
            TestHarness.edge('ba', 'b', '__proto__'),
            TestHarness.edge('bc', 'b', 'c'),
            TestHarness.edge('ac', '__proto__', 'c'),
            TestHarness.edge('loop', 'c', 'c'),
            TestHarness.edge('other', 'isolated', '__proto__', {
              type: 'OTHER',
            }),
          ],
        ).graph,
      ).toPhysicalGraph(new CanvasViewSettings());
      graph.edges['null'] = null;
      graph.nodes['null'] = null;
      graph.edges['missing-start'] = {
        id: 'missing-start',
        startNodeId: 'missing',
        endNodeId: 'c',
        title: '',
        edgeType: 'KNOWS',
      };
      graph.edges['missing-end'] = {
        id: 'missing-end',
        startNodeId: 'c',
        endNodeId: 'missing',
        title: '',
        edgeType: 'KNOWS',
      };
      const copy: PhysicalGraph = structuredClone(graph);
      new CanvasHierarchyLayout(graph).layout('KNOWS');
      new CanvasHierarchyLayout(copy).layout('KNOWS');
      assert.deepEqual(structuredClone(graph), copy);
      assert.equal(
        graph.nodes['__proto__']?.positionX,
        graph.nodes['b']?.positionX,
      );
      assert.ok(
        (graph.nodes['c']?.positionX ?? 0) > (graph.nodes['b']?.positionX ?? 0),
      );
    });
    void it('accepts an empty physical graph', (): void => {
      new CanvasHierarchyLayout({ nodes: {}, edges: {} }).layout('KNOWS');
    });
    void it('places disconnected nodes in one layer for an unmatched relationship type', (): void => {
      const graph: PhysicalGraph = new CanvasGraph(
        TestHarness.canvasData().graph,
      ).toPhysicalGraph(new CanvasViewSettings());
      new CanvasHierarchyLayout(graph).layout('UNKNOWN');
      assert.equal(graph.nodes['a']?.positionX, graph.nodes['b']?.positionX);
    });
  });
  void describe('constructor', (): void => {
    void it('retains its initial data and collaborators', (): void => {
      const graph: PhysicalGraph = { nodes: {}, edges: {} };
      const layout: CanvasHierarchyLayout = new CanvasHierarchyLayout(graph);
      assert.doesNotThrow((): void => {
        layout.layout('KNOWS');
      });
    });
  });
});
